// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getIdToken } from 'firebase/auth';
import { offlineAPI } from './offlineAPI';
import type { OfflineExpense } from './offlineAPI';

// Tipos para os requests
type ExpenseBody = Partial<Omit<OfflineExpense, 'id' | 'profileId'>>;
type ProfileBody = { name?: string; income?: number };
type RequestBody = { [key: string]: any };

// Estado global para controle de modo offline
export const useOfflineMode = {
  isEnabled: false,
  setEnabled(value: boolean) {
    this.isEnabled = value;
    localStorage.setItem('useOfflineMode', value ? 'true' : 'false');
    console.log(`Modo offline ${value ? 'ativado' : 'desativado'}`);
  },
  init() {
    // Verificar se estava usando modo offline antes
    const saved = localStorage.getItem('useOfflineMode');
    if (saved === 'true') {
      this.isEnabled = true;
      console.log('Modo offline ativado (restaurado)');
    }
  }
};

// Inicializar modo offline
useOfflineMode.init();

// Configuração do Firebase - estas variáveis podem ser públicas
// O Firebase API Key pode ser exposto, pois a segurança real vem das regras do Firestore
function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Validação básica para garantir que as variáveis estão definidas
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.warn(`Firebase configuration error: ${key} is not defined`);
    }
  });

  return config;
}

const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Utilitário para requisições autenticadas ao backend
export async function apiFetch(path: string, options: RequestInit = {}) {
  // Se estiver em modo offline, use a API offline
  if (useOfflineMode.isEnabled) {
    return await handleOfflineRequest(path, options);
  }
  
  try {
    const user = auth.currentUser;
    const token = user ? await getIdToken(user) : null;
    
    if (!import.meta.env.VITE_API_URL) {
      console.error('API URL não está definida. Verifique se VITE_API_URL existe no ambiente.');
      throw new Error('Configuração da API ausente');
    }
    
    // Adiciona timeout para evitar espera infinita
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(import.meta.env.VITE_API_URL + path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
  } catch (error) {
    console.error(`Erro na chamada API para ${path}:`, error);
    
    // Se a API real falhar, sugerir modo offline
    if (!useOfflineMode.isEnabled) {
      console.log('API real falhou, sugerindo modo offline');
      
      // Ativar automaticamente o modo offline apenas em produção
      if (import.meta.env.PROD) {
        useOfflineMode.setEnabled(true);
        return handleOfflineRequest(path, options);
      }
    }
    
    throw error;
  }
}

// Função para lidar com requisições em modo offline
async function handleOfflineRequest(path: string, options: RequestInit = {}) {
  console.log(`[Modo Offline] Requisição para ${path}`, options);
  
  // Atualizar o usuário na API offline
  offlineAPI.setUser(auth.currentUser);
  
  // Simular um pequeno delay para parecer mais natural
  await new Promise(resolve => setTimeout(resolve, 200));
    // Extrair o método e o body com tipagem
  const method = options.method || 'GET';
  let body: RequestBody = {};
  
  if (options.body) {
    try {
      const parsed = JSON.parse(options.body.toString());
      body = parsed as RequestBody;
    } catch (e) {
      console.error('Erro ao parsear body:', e);
      body = {} as RequestBody;
    }
  }
  
  // Simular respostas com base no path e método
  try {
    let responseData: any;
    
    if (path.startsWith('/api/profiles')) {
      // Profiles endpoints
      if (method === 'GET') {
        responseData = await offlineAPI.getProfiles();      } else if (method === 'POST') {
        const profileBody = body as ProfileBody;
        if (!profileBody.name) throw new Error('Nome do perfil é obrigatório');
        responseData = await offlineAPI.createProfile(profileBody.name);
      } else if (path.includes('/income') && method === 'PUT') {
        const profileId = path.split('/')[3];
        const profileBody = body as ProfileBody;
        if (typeof profileBody.income !== 'number') throw new Error('Income deve ser um número');
        responseData = await offlineAPI.updateProfileIncome(profileId, profileBody.income);
      }
    } 
    else if (path.startsWith('/api/budgets/')) {
      // Budgets endpoints
      const profileId = path.split('/')[3];
      if (method === 'GET') {
        responseData = await offlineAPI.getBudgets(profileId);
      }
    } 
    else if (path.startsWith('/api/expenses')) {
      // Expenses endpoints
      if (path.includes('/api/expenses/') && (method === 'GET')) {
        const profileId = path.split('/')[3];
        responseData = await offlineAPI.getExpenses(profileId);
      }      else if (path.includes('/api/expenses/') && method === 'POST') {
        const profileId = path.split('/')[3];
        const expenseBody = body as ExpenseBody;
        if (!expenseBody.value || !expenseBody.date || !expenseBody.description || !expenseBody.category) {
          throw new Error('Campos obrigatórios da despesa ausentes');
        }
        // Ensure all required fields are present for a new expense
        const newExpense: Omit<OfflineExpense, 'id' | 'profileId'> = {
          value: expenseBody.value,
          date: expenseBody.date,
          description: expenseBody.description,
          category: expenseBody.category,
          recurring: expenseBody.recurring || false
        };
        responseData = await offlineAPI.addExpense(profileId, newExpense);
      }      else if (path.includes('/api/expenses/') && method === 'PUT') {
        const expenseId = path.split('/')[3];
        const expenseUpdate = body as ExpenseBody;
        responseData = await offlineAPI.updateExpense(expenseId, expenseUpdate);
      } 
      else if (path.includes('/api/expenses/') && method === 'DELETE') {
        const expenseId = path.split('/')[3];
        await offlineAPI.deleteExpense(expenseId);
        responseData = { success: true };
      }
    }
    
    // Simular uma resposta HTTP
    return {
      ok: true,
      status: 200,
      json: async () => responseData,
      text: async () => JSON.stringify(responseData)
    } as Response;  } catch (error: unknown) {
    console.error(`[Modo Offline] Erro ao processar requisição para ${path}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: errorMessage }),
      text: async () => JSON.stringify({ error: errorMessage })
    } as Response;
  }
}
