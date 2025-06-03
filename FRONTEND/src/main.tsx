import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Adiciona handler global de erros para debugging em produção
window.addEventListener('error', (event) => {
  console.error('Erro global capturado:', event.error);
  
  // Exibir mensagem de erro visível no DOM se a página estiver em branco
  if (document.body.children.length <= 1) {
    const errorElement = document.createElement('div');
    errorElement.style.padding = '20px';
    errorElement.style.margin = '20px';
    errorElement.style.backgroundColor = '#ffeeee';
    errorElement.style.border = '1px solid red';
    errorElement.innerHTML = `<h2>Erro na aplicação</h2>
      <p>${event.error?.message || 'Erro desconhecido'}</p>
      <pre>${event.error?.stack || ''}</pre>`;
    document.body.appendChild(errorElement);
  }
});

// Log das variáveis de ambiente (remove em produção depois)
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Firebase configurado:', !!import.meta.env.VITE_FIREBASE_API_KEY);

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('Erro ao renderizar aplicação:', error);
  
  // Fallback para erro crítico
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; margin: 20px; background: #ffeeee; border: 2px solid red; border-radius: 8px;">
        <h2>❌ Erro Crítico na Aplicação</h2>
        <p>Não foi possível inicializar a aplicação React.</p>
        <details>
          <summary>Detalhes do erro:</summary>
          <pre>${error}</pre>
        </details>
      </div>
    `;
  }
}
