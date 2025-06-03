import { useState, useEffect } from 'react'
import './App.css'
// Testing imports one by one
import { AuthForm } from './AuthForm'
import { apiFetch, useOfflineMode } from './firebase'
import { ApiErrorFallback } from './ApiErrorFallback'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { BudgetAdjust } from './BudgetAdjust'
import type { Category } from './BudgetAdjust'
import { ExpenseForm, type Expense } from './ExpenseForm'
import { exportExpensesToCSV } from './exportCSV'

function App() {
  const [debugMode, setDebugMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Simple auth state management
  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7f9'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2>🏦 Organizador Financeiro</h2>
          <p>Carregando aplicação...</p>
        </div>
      </div>
    );
  }
  
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
        <button 
          onClick={() => setDebugMode(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Continuar para Aplicação
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f7f9'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #eee',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#213547' }}>
              🏦 Organizador Financeiro
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
              Método Investidor Sardinha
            </p>
            <AuthForm 
              onAuthSuccess={(userData) => setUser(userData)}
              onError={(error) => console.error('Auth error:', error)}
            />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                onClick={() => setDebugMode(true)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Debug Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main application (authenticated user)
  return (
    <div className="App">
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f7f9',
        minHeight: '100vh'
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          backgroundColor: 'white',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#213547', margin: 0 }}>🏦 Organizador Financeiro</h1>
          <button 
            onClick={() => setUser(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </header>
        
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Dashboard Financeiro</h2>
          <p>Bem-vindo(a), {user?.email || 'Usuário'}!</p>
          <p>Sistema de gestão financeira baseado no método Investidor Sardinha.</p>
          
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            <p><strong>Status:</strong> ✅ Aplicação funcionando corretamente</p>
            <p><strong>Usuário autenticado:</strong> {user?.email}</p>
            <p><strong>Última atualização:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
