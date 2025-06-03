// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getIdToken } from 'firebase/auth';

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
      throw new Error(`Firebase configuration error: ${key} is not defined`);
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
    throw error;
  }
}
