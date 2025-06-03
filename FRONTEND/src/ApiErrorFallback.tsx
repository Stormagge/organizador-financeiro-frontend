// Componente de fallback para quando a API está indisponível
import { useState } from 'react';

interface ApiErrorFallbackProps {
  message: string;
  retry: () => void;
}

export function ApiErrorFallback({ message, retry }: ApiErrorFallbackProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#fff8f8',
      border: '1px solid #e88',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#c33', marginTop: 0 }}>Erro de conexão</h2>
      
      <p>{message || 'Não foi possível conectar ao servidor.'}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={retry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4e79a7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tentar novamente
        </button>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginLeft: '10px',
            cursor: 'pointer'
          }}
        >
          {expanded ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', fontSize: '14px' }}>
          <p>Possíveis causas:</p>
          <ul>
            <li>O servidor backend pode estar indisponível ou em manutenção</li>
            <li>Sua conexão com a internet pode estar instável</li>
            <li>A URL da API pode estar incorreta nas configurações</li>
          </ul>
          <p>API URL: {import.meta.env.VITE_API_URL || '[Não definida]'}</p>
          <p>Se o problema persistir, entre em contato com o suporte.</p>
        </div>
      )}
    </div>
  );
}
