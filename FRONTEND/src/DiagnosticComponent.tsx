import React from 'react';

export function DiagnosticComponent() {
  const diagnostics = {
    react: React.version,
    env: {
      apiUrl: import.meta.env.VITE_API_URL,
      firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Configurado' : '✗ Não configurado',
      firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Configurado' : '✗ Não configurado',
      firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Configurado' : '✗ Não configurado',
      firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Configurado' : '✗ Não configurado'
    },
    timestamp: new Date().toISOString()
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      backgroundColor: '#f0f8ff',
      border: '2px solid #007acc',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#007acc', marginTop: 0 }}>🔍 Diagnóstico da Aplicação</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <h3>✅ React está funcionando!</h3>
        <p>Versão do React: {diagnostics.react}</p>
        <p>Timestamp: {diagnostics.timestamp}</p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3>🔧 Variáveis de Ambiente:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>🌐 API URL: {diagnostics.env.apiUrl || '❌ Não definido'}</li>
          <li>🔑 Firebase API Key: {diagnostics.env.firebaseApiKey}</li>
          <li>🏠 Firebase Auth Domain: {diagnostics.env.firebaseAuthDomain}</li>
          <li>📁 Firebase Project ID: {diagnostics.env.firebaseProjectId}</li>
          <li>📱 Firebase App ID: {diagnostics.env.firebaseAppId}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3>🌍 Informações do Browser:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>User Agent: {navigator.userAgent}</li>
          <li>URL: {window.location.href}</li>
          <li>Origin: {window.location.origin}</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '10px',
        borderRadius: '4px',
        marginTop: '15px'
      }}>
        <p style={{ margin: 0, color: '#2d5016' }}>
          ✅ Se você pode ver esta mensagem, o React está carregando corretamente!
        </p>
      </div>
    </div>
  );
}
