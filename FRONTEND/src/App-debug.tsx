import { useState } from 'react'
import './App.css'

function App() {
  const [debugMode] = useState(true);
  
  if (debugMode) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        backgroundColor: '#f0f8ff',
        border: '2px solid #007acc',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        minHeight: '200px'
      }}>
        <h1 style={{ color: '#007acc' }}>🏦 Organizador Financeiro - Debug Mode</h1>
        <p>✅ App.tsx está carregando!</p>
        <p>Data/Hora: {new Date().toLocaleString()}</p>
        <div style={{ background: '#e8f5e8', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
          <p><strong>Status:</strong> App component renderizado com sucesso</p>
          <p><strong>React:</strong> Funcionando</p>
          <p><strong>CSS:</strong> Carregado (App.css)</p>
          <p><strong>Build:</strong> Teste de produção</p>
        </div>
        <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
          <p><strong>Environment Variables:</strong></p>
          <ul style={{ textAlign: 'left', margin: '5px 0' }}>
            <li>API URL: {import.meta.env.VITE_API_URL || 'Não configurado'}</li>
            <li>Firebase API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? 'Configurado' : 'Não configurado'}</li>
            <li>Firebase Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Não configurado'}</li>
          </ul>
        </div>
        <div style={{ background: '#d1ecf1', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
          <p><strong>Próximos passos:</strong></p>
          <ol style={{ textAlign: 'left', margin: '5px 0' }}>
            <li>✅ Verificar se esta versão faz deploy no Vercel</li>
            <li>📦 Restaurar componentes um por um</li>
            <li>🔍 Identificar qual importação causa o problema</li>
            <li>🚀 Deploy da aplicação completa</li>
          </ol>
        </div>
      </div>
    );
  }
  
  // Aplicação normal será restaurada depois
  return <div>Carregando aplicação principal...</div>;
}

export default App
