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
  },  init() {
    // Verificar se deve forçar modo online
    const forceOnline = localStorage.getItem('forceOnlineMode');
    if (forceOnline === 'true') {
      this.isEnabled = false;
      localStorage.removeItem('useOfflineMode');
      localStorage.removeItem('forceOnlineMode');
      console.log('🔄 MODO ONLINE FORÇADO - Cache resetado');
      return;
    }
    
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
  // Log da URL da API e configuração
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('Firebase configurado:', !!auth.currentUser);
  
  // Se estiver em modo offline, use a API offline
  if (useOfflineMode.isEnabled) {
    console.log('[MODO OFFLINE FORÇADO] Usando API offline para:', path);
    return await handleOfflineRequest(path, options);
  }
  
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.error('apiFetch: Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }
    
    const token = await getIdToken(user);
    console.log('apiFetch: Token obtido para usuário:', user.email);
    
    if (!import.meta.env.VITE_API_URL) {
      console.error('apiFetch: VITE_API_URL não está definida');
      throw new Error('Configuração da API ausente');
    }
    
    const fullUrl = import.meta.env.VITE_API_URL + path;
    console.log('apiFetch: Fazendo requisição para:', fullUrl);
    console.log('apiFetch: Método:', options.method || 'GET');
    console.log('apiFetch: Headers que serão enviados:', {
      Authorization: `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });
    
    // Adiciona timeout para evitar espera infinita
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('apiFetch: Timeout de 15 segundos excedido para:', path);
      controller.abort();
    }, 15000); // 15 segundos
    
    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    
    console.log(`apiFetch: Resposta recebida em ${endTime - startTime}ms`);
    console.log('apiFetch: Status:', response.status);
    console.log('apiFetch: OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('apiFetch: Resposta de erro do servidor:', response.status, errorText);
      
      // Para erros de autenticação, não vá para offline automaticamente
      if (response.status === 401) {
        throw new Error('Token de autenticação inválido');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`apiFetch: Erro na chamada API para ${path}:`, error);
    
    // Log detalhado do tipo de erro
    if (error instanceof Error) {
      console.error('apiFetch: Tipo de erro:', error.name);
      console.error('apiFetch: Mensagem de erro:', error.message);
      if (error.name === 'AbortError') {
        console.error('apiFetch: Requisição foi cancelada por timeout');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('apiFetch: Erro de rede - possivelmente backend não está acessível');
      }
    }
    
    // Se a API real falhar, ativar modo offline automaticamente apenas em produção
    if (!useOfflineMode.isEnabled) {
      console.log('apiFetch: API real falhou, ativando modo offline automaticamente');
      useOfflineMode.setEnabled(true);
      return handleOfflineRequest(path, options);
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
    
    if (path === '/api/profiles' && method === 'GET') {
      // GET /api/profiles
      responseData = await offlineAPI.getProfiles();
    } 
    else if (path.startsWith('/api/profiles/') && !path.includes('/income') && !path.includes('/categories') && method === 'GET') {
      // GET /api/profiles/:profileName
      const profileName = decodeURIComponent(path.split('/')[3]);
      console.log('[Modo Offline] Buscando perfil por nome:', profileName);
      
      const profiles = await offlineAPI.getProfiles();
      let profile = profiles.find(p => p.name === profileName);
      
      if (!profile) {
        console.log('[Modo Offline] Perfil não encontrado, criando:', profileName);
        profile = await offlineAPI.createProfile(profileName);
      }
      
      // Buscar categorias do perfil
      const budgets = await offlineAPI.getBudgets(profile.id);
      const categories = budgets.map(b => ({ key: b.category, percent: b.percent }));
      
      responseData = {
        ...profile,
        categories: categories.length > 0 ? categories : null
      };
    }
    else if (path.startsWith('/api/profiles/') && path.includes('/income') && method === 'PUT') {
      // PUT /api/profiles/:profileId/income
      const profileId = path.split('/')[3];
      const profileBody = body as ProfileBody;
      if (typeof profileBody.income !== 'number') throw new Error('Income deve ser um número');
      responseData = await offlineAPI.updateProfileIncome(profileId, profileBody.income);
    }
    else if (path.startsWith('/api/profiles/') && path.includes('/categories') && method === 'PUT') {
      // PUT /api/profiles/:profileId/categories
      const profileId = path.split('/')[3];
      const categoriesBody = body as { categories: Array<{key: string, percent: number}> };
      if (categoriesBody.categories) {
        responseData = await offlineAPI.saveBudgets(profileId, categoriesBody.categories);
      }
      responseData = { success: true };
    }
    else if (path === '/api/profiles' && method === 'POST') {
      // POST /api/profiles
      const profileBody = body as ProfileBody;
      if (!profileBody.name) throw new Error('Nome do perfil é obrigatório');
      responseData = await offlineAPI.createProfile(profileBody.name);
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
      if (path === '/api/expenses' && method === 'GET') {
        // GET /api/expenses?profile=...&month=...
        const url = new URL('http://dummy.com' + path + '?' + new URLSearchParams(options as any).toString());
        const profileName = url.searchParams.get('profile');
        const month = url.searchParams.get('month');
        
        console.log('[Modo Offline] GET expenses - Profile:', profileName, 'Month:', month);
        
        if (!profileName) {
          throw new Error('Parâmetro profile é obrigatório');
        }
        
        // Encontrar o perfil por nome
        const profiles = await offlineAPI.getProfiles();
        const profile = profiles.find(p => p.name === profileName);
        
        if (!profile) {
          responseData = [];
        } else {
          const allExpenses = await offlineAPI.getExpenses(profile.id);
          // Filtrar por mês se especificado
          responseData = month ? allExpenses.filter(e => e.date.startsWith(month)) : allExpenses;
        }
      }
      else if (path === '/api/expenses' && method === 'POST') {
        // POST /api/expenses
        const expenseBody = body as any;
        console.log('[Modo Offline] POST expense:', expenseBody);
        
        if (!expenseBody.profile) {
          throw new Error('Parâmetro profile é obrigatório');
        }
        
        // Encontrar o perfil por nome
        const profiles = await offlineAPI.getProfiles();
        const profile = profiles.find(p => p.name === expenseBody.profile);
        
        if (!profile) {
          throw new Error('Perfil não encontrado');
        }
        
        const newExpense: Omit<OfflineExpense, 'id' | 'profileId'> = {
          value: expenseBody.value,
          date: expenseBody.date,
          description: expenseBody.description,
          category: expenseBody.category,
          recurring: expenseBody.recurring || false
        };
        
        responseData = await offlineAPI.addExpense(profile.id, newExpense);
      }
      else if (path.includes('/api/expenses/') && method === 'GET') {
        // GET /api/expenses/:profileId
        const profileId = path.split('/')[3];
        responseData = await offlineAPI.getExpenses(profileId);
      }      
      else if (path.includes('/api/expenses/') && method === 'POST') {
        // POST /api/expenses/:profileId
        const profileId = path.split('/')[3];
        const expenseBody = body as ExpenseBody;
        if (!expenseBody.value || !expenseBody.date || !expenseBody.description || !expenseBody.category) {
          throw new Error('Campos obrigatórios da despesa ausentes');
        }
        const newExpense: Omit<OfflineExpense, 'id' | 'profileId'> = {
          value: expenseBody.value,
          date: expenseBody.date,
          description: expenseBody.description,
          category: expenseBody.category,
          recurring: expenseBody.recurring || false
        };
        responseData = await offlineAPI.addExpense(profileId, newExpense);
      }      
      else if (path.includes('/api/expenses/') && method === 'PUT') {
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
    
    console.log('[Modo Offline] Resposta:', responseData);
    
    // Simular uma resposta HTTP
    return {
      ok: true,
      status: 200,
      json: async () => responseData,
      text: async () => JSON.stringify(responseData)
    } as Response;
  } catch (error: unknown) {
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
