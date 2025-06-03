import { useState } from 'react'
import './App.css'

function App() {
  const [message] = useState('Organizador Financeiro está funcionando!')

  return (
    <div className="App">
      <header style={{ padding: '20px' }}>
        <h1 style={{ color: '#213547' }}>🏦 Organizador Financeiro</h1>
        <p>{message}</p>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          margin: '20px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2>Sistema de Gestão Financeira</h2>
          <p>Aplicação está rodando corretamente!</p>
          <p>Baseado no método Investidor Sardinha</p>
        </div>
      </header>
    </div>
  )
}

export default App
