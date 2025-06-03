// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getIdToken } from 'firebase/auth';

// Função para obter configuração de forma mais segura
function getFirebaseConfig() {
  // Using the injected environment variables from vite.config.ts
  const config = {
    apiKey: __FIREBASE_CONFIG__.apiKey,
    authDomain: __FIREBASE_CONFIG__.authDomain,
    projectId: __FIREBASE_CONFIG__.projectId,
    appId: __FIREBASE_CONFIG__.appId,
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
  return fetch(import.meta.env.VITE_API_URL + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  });
}
