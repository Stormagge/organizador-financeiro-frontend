// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getIdToken } from 'firebase/auth';

// Função para obter configuração de forma mais segura
function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.FIREBASE_API_KEY,
    authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.FIREBASE_PROJECT_ID,
    appId: import.meta.env.FIREBASE_APP_ID,
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
  const user = auth.currentUser;
  const token = user ? await getIdToken(user) : null;
  return fetch(import.meta.env.API_URL + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  });
}
