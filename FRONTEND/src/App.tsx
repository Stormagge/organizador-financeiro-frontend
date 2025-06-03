// filepath: c:\Users\Jesse\Desktop\ORGANIZADOR FINANCEIRo\FRONTEND\src\App-new.tsx
import { useState, useEffect } from 'react'
import './App.css'
import { BudgetAdjust } from './BudgetAdjust'
import type { Category } from './BudgetAdjust'
import { ExpenseForm, type Expense } from './ExpenseForm'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { exportExpensesToCSV } from './exportCSV'
import { AuthForm } from './AuthForm'
import { apiFetch, auth } from './firebase' // Corrigido o import do auth
import type { User as FirebaseUser } from 'firebase/auth' // Tipo para o usuário do Firebase

// Onboarding Component
function Onboarding({ onFinish, profileName }: { onFinish: (income: number) => void, profileName: string }) {
  const [income, setIncome] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(income.replace(',', '.'))
    if (isNaN(value) || value <= 0) {
      setError('Informe uma renda válida')
      return
    }
    setError('')
    try {
      const profilesRes = await apiFetch('/api/profiles')
      const profiles = await profilesRes.json()
      const profile = profiles.find((p: any) => p.name === profileName)
      if (profile) {
        await apiFetch(`/api/profiles/${profile.id}/income`, {
          method: 'PUT',
          body: JSON.stringify({ income: value })
        })
      }
      onFinish(value)
    } catch (err) {
      console.error('Erro ao salvar renda:', err)
      setError('Erro ao salvar renda. Tente novamente.')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'left' }}>
      <h2>Bem-vindo!</h2>
      <p>Para começar, informe sua renda mensal líquida:</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={income}
          onChange={e => setIncome(e.target.value)}
          placeholder="Renda mensal (R$)"
          style={{ width: '100%', padding: 8, fontSize: 18 }}
        />
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <button type="submit" style={{ marginTop: 16, width: '100%' }}>
          Avançar
        </button>
      </form>
    </div>
  )
}

// Orçamento padrão do método Investidor Sardinha
const DEFAULT_PERCENTAGES: Category[] = [
  { key: 'fixos', label: 'Custos Fixos', percent: 40 },
  { key: 'conforto', label: 'Conforto', percent: 20 },
  { key: 'metas', label: 'Metas', percent: 5 },
  { key: 'prazeres', label: 'Prazeres', percent: 5 },
  { key: 'liberdade', label: 'Liberdade Financeira', percent: 25 },
  { key: 'conhecimento', label: 'Conhecimento', percent: 5 },
]

const CATEGORY_COLORS: Record<string, string> = {
  fixos: '#4e79a7',
  conforto: '#f28e2b',
  metas: '#e15759',
  prazeres: '#76b7b2',
  liberdade: '#59a14f',
  conhecimento: '#edc949',
}

function BudgetCharts({ income, categories, expenses }: { income: number, categories: Category[], expenses: Expense[] }) {
  const spent: Record<string, number> = {}
  for (const cat of categories) spent[cat.key] = 0
  for (const e of expenses) spent[e.category] = (spent[e.category] || 0) + e.value
  const data = categories.map(cat => ({
    name: cat.label,
    key: cat.key,
    percent: cat.percent,
    orcado: income * cat.percent / 100,
    gasto: spent[cat.key] || 0,
  }))
  return (
    <div style={{ margin: '2rem 0' }}>
      <h3>Distribuição do Orçamento</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
        <div>
          <PieChart width={260} height={260}>
            <Pie
              data={data}
              dataKey="orcado"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name }) => name}
            >
              {data.map(entry => (
                <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] || '#888'} />
              ))}
            </Pie>
            <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
          </PieChart>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>Orçamento por categoria</div>
        </div>
        <div>
          <BarChart width={320} height={260} data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `R$${v/1000 >= 1 ? (v/1000)+'k' : v}`}/>
            <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <Bar dataKey="orcado" fill="#bbb" name="Orçado">
              {data.map(entry => (
                <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] || '#bbb'} />
              ))}
            </Bar>
            <Bar dataKey="gasto" fill="#e15759" name="Gasto" />
          </BarChart>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>Comparativo Orçado x Gasto</div>
        </div>
      </div>
    </div>
  )
}

function BudgetOverview({ income, categories, onEdit, onAdjust, expenses, onAddExpense, onRemoveExpense, onEditExpense }: {
  income: number,
  categories: Category[],
  onEdit: () => void,
  onAdjust: () => void,
  expenses: Expense[],
  onAddExpense: (e: Expense) => void,
  onRemoveExpense: (index: number) => void,
  onEditExpense: (index: number) => void,
}) {
  // Soma de gastos por categoria
  const spent: Record<string, number> = {}
  for (const cat of categories) spent[cat.key] = 0
  for (const e of expenses) spent[e.category] = (spent[e.category] || 0) + e.value

  // Função para determinar cor da barra
  function getBarClass(percent: number) {
    if (percent < 80) return 'progress-ok'
    if (percent < 100) return 'progress-warning'
    return 'progress-danger'
  }

  const [filterCat, setFilterCat] = useState('')
  const filteredExpenses = filterCat ? expenses.filter(e => e.category === filterCat) : expenses

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', textAlign: 'left' }}>
      <h2>Orçamento Inicial</h2>
      <p>Com base na sua renda de <b>R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>:</p>
      <BudgetCharts income={income} categories={categories} expenses={expenses} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Categoria</th>
            <th style={{ textAlign: 'right' }}>%</th>
            <th style={{ textAlign: 'right' }}>Valor (R$)</th>
            <th style={{ textAlign: 'right' }}>Gasto (R$)</th>
            <th style={{ textAlign: 'right' }}>Saldo (R$)</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const budget = income * cat.percent / 100
            const gasto = spent[cat.key] || 0
            const saldo = budget - gasto
            const percentGasto = Math.min(100, (gasto / budget) * 100)
            const barClass = getBarClass(percentGasto)
            return (
              <tr key={cat.key} style={gasto > budget ? { background: '#ffeaea' } : {}}>
                <td>
                  <div className="progress-bar-label">{cat.label}</div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-inner ${barClass}`}
                      style={{ width: percentGasto + '%'}}
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>{cat.percent}%</td>
                <td style={{ textAlign: 'right' }}>{budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right', color: gasto > budget ? 'red' : undefined }}>{gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>{saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button onClick={onEdit}>Editar Renda</button>
        <button onClick={onAdjust}>Ajustar Percentuais</button>
      </div>
      <ExpenseForm categories={categories} onAdd={onAddExpense} />
      <div style={{ marginTop: 24 }}>
        <h3>Despesas Registradas</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Filtrar por categoria: </label>
          <select onChange={e => setFilterCat(e.target.value)} value={filterCat}>
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </div>
        <ul>
          {filteredExpenses.length === 0 && <li>Nenhuma despesa registrada.</li>}
          {filteredExpenses.map((e, i) => (
            <li key={i}>
              {e.date} - {categories.find(c => c.key === e.category)?.label}: R$ {e.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {e.description && `- ${e.description}`}
              {e.recurring && <span style={{ color: '#888' }}> (recorrente)</span>}
              <button style={{ marginLeft: 8 }} onClick={() => onRemoveExpense(i)}>Remover</button>
              <button style={{ marginLeft: 4 }} onClick={() => onEditExpense(i)}>Editar</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => exportExpensesToCSV(filteredExpenses)}>Exportar para CSV</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<string[]>([])
  const [currentProfile, setCurrentProfile] = useState('')
  const [profileData, setProfileData] = useState<Record<string, {
    income: number | null,
    categories: Category[],
    adjusting: boolean,
    editing: boolean,
  }>>({})
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log("App.tsx: Usuário Firebase autenticado:", firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log("App.tsx: Nenhum usuário Firebase autenticado.");
        setUser(null);
      }
    });
    return () => unsubscribe(); // Limpa o listener ao desmontar
  }, []);

  // Carrega perfis
  useEffect(() => {
    if (!user) {
      setProfiles([]); // Limpa perfis se o usuário fizer logout
      setCurrentProfile(''); // Limpa o perfil atual
      return;
    }
    
    const loadProfiles = async () => {
      try {
        console.log('App.tsx: Tentando carregar perfis...'); // Log de diagnóstico
        const res = await apiFetch('/api/profiles');
        if (!res.ok) { // Verifica se a resposta da API foi bem-sucedida
          throw new Error(`Falha ao buscar perfis: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        const profileNames = data.map((p: any) => p.name);
        setProfiles(profileNames); // Atualiza a lista de perfis

        if (profileNames.length > 0) {
          // Se currentProfile não estiver na lista ou estiver vazio, define para o primeiro disponível.
          if (!profileNames.includes(currentProfile) || currentProfile === '') {
            console.log('App.tsx: Definindo perfil atual para o primeiro da lista:', profileNames[0]); // Log de diagnóstico
            setCurrentProfile(profileNames[0]);
          } else {
            console.log('App.tsx: Perfil atual é válido e está na lista:', currentProfile); // Log de diagnóstico
          }
        } else {
          // Nenhum perfil existe para o usuário.
          console.log('App.tsx: Nenhum perfil encontrado. Definindo para padrão "Perfil Padrão".'); // Log de diagnóstico
          // Define um perfil padrão para acionar o onboarding para ele.
          setProfiles(['Perfil Padrão']); 
          setCurrentProfile('Perfil Padrão');
        }
      } catch (err) {
        console.error('App.tsx: Erro ao carregar perfis:', err);
        // Fallback: se a chamada à API falhar e nenhum perfil estiver carregado, define um padrão.
        // Isso garante que, se o primeiro carregamento falhar, o aplicativo não fique preso.
        if (profiles.length === 0 && currentProfile === '') {
          console.log('App.tsx: Erro ao carregar perfis. Definindo para padrão "Perfil Padrão".'); // Log de diagnóstico
          setProfiles(['Perfil Padrão']);
          setCurrentProfile('Perfil Padrão');
        }
      }
    };
    loadProfiles();
  }, [user]); // Executa apenas quando o usuário muda.

  // Carrega dados do perfil atual
  useEffect(() => {
    if (!user || !currentProfile) return;
    
    const loadProfileData = async () => {
      try {
        const res = await apiFetch(`/api/profiles/${encodeURIComponent(currentProfile)}`)
        const data = await res.json()
        
        setProfileData(prev => ({
          ...prev,
          [currentProfile]: {
            income: data.income || null,
            categories: data.categories || DEFAULT_PERCENTAGES,
            adjusting: false,
            editing: false,
          }
        }))
      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err)
        setProfileData(prev => ({
          ...prev,
          [currentProfile]: {
            income: null,
            categories: DEFAULT_PERCENTAGES,
            adjusting: false,
            editing: false,
          }
        }))
      }
    }
    loadProfileData()
  }, [user, currentProfile])

  // Carrega despesas do mês
  useEffect(() => {
    if (!user || !currentProfile) return;
    
    const loadExpenses = async () => {
      try {
        const res = await apiFetch(`/api/expenses?profile=${encodeURIComponent(currentProfile)}&month=${selectedMonth}`)
        const data = await res.json()
        setExpenses(prev => ({ ...prev, [`${currentProfile}_${selectedMonth}`]: data }))
      } catch (err) {
        console.error('Erro ao carregar despesas:', err)
        setExpenses(prev => ({ ...prev, [`${currentProfile}_${selectedMonth}`]: [] }))
      }
    }
    loadExpenses()
  }, [user, currentProfile, selectedMonth])

  const currentData = profileData[currentProfile]
  const currentExpenses = expenses[`${currentProfile}_${selectedMonth}`] || []

  // Handlers
  const handleSaveIncome = async (income: number) => {
    try {
      const res = await apiFetch('/api/profiles')
      const data = await res.json()
      const profile = data.find((p: any) => p.name === currentProfile)
      if (profile) {
        await apiFetch(`/api/profiles/${profile.id}/income`, {
          method: 'PUT',
          body: JSON.stringify({ income })
        })
      }
      setProfileData(prev => ({
        ...prev,
        [currentProfile]: { ...prev[currentProfile], income, editing: false }
      }))
    } catch (err) {
      console.error('Erro ao salvar renda:', err)
    }
  }

  const handleSaveCategories = async (categories: Category[]) => {
    try {
      const res = await apiFetch('/api/profiles')
      const data = await res.json()
      const profile = data.find((p: any) => p.name === currentProfile)
      if (profile) {
        await apiFetch(`/api/profiles/${profile.id}/categories`, {
          method: 'PUT',
          body: JSON.stringify({ categories })
        })
      }
      setProfileData(prev => ({
        ...prev,
        [currentProfile]: { ...prev[currentProfile], categories, adjusting: false }
      }))
    } catch (err) {
      console.error('Erro ao salvar categorias:', err)
    }
  }

  const handleAddExpense = async (expense: Expense) => {
    try {
      const res = await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expense,
          profile: currentProfile,
          month: selectedMonth
        })
      })
      const newExpense = await res.json()
      setExpenses(prev => ({
        ...prev,
        [`${currentProfile}_${selectedMonth}`]: [...(prev[`${currentProfile}_${selectedMonth}`] || []), newExpense]
      }))
    } catch (err) {
      console.error('Erro ao adicionar despesa:', err)
      // Fallback: adiciona localmente
      setExpenses(prev => ({
        ...prev,
        [`${currentProfile}_${selectedMonth}`]: [...(prev[`${currentProfile}_${selectedMonth}`] || []), expense]
      }))
    }
  }

  const handleRemoveExpense = async (index: number) => {
    const expenseToRemove = currentExpenses[index]
    try {
      if (expenseToRemove.id) {
        await apiFetch(`/api/expenses/${expenseToRemove.id}`, { method: 'DELETE' })
      }
      setExpenses(prev => ({
        ...prev,
        [`${currentProfile}_${selectedMonth}`]: prev[`${currentProfile}_${selectedMonth}`].filter((_, i) => i !== index)
      }))
    } catch (err) {
      console.error('Erro ao remover despesa:', err)
    }
  }

  const handleEditExpense = (index: number) => {
    console.log('Editing expense at index:', index)
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
            <AuthForm onAuth={(userData) => setUser(userData)} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Carregando perfil...</h2>
      </div>
    );
  }

  // Onboarding
  if (currentData.income === null) {
    return (
      <div className="App">
        <Onboarding
          profileName={currentProfile}
          onFinish={(income) => {
            setProfileData(prev => ({
              ...prev,
              [currentProfile]: { ...prev[currentProfile], income }
            }))
          }}
        />
      </div>
    )
  }

  // Editing income
  if (currentData.editing) {
    return (
      <div className="App">
        <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'left' }}>
          <h2>Editar Renda</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const income = parseFloat(formData.get('income')?.toString().replace(',', '.') || '0')
            if (!isNaN(income) && income > 0) {
              handleSaveIncome(income)
            }
          }}>
            <input
              name="income"
              type="text"
              defaultValue={currentData.income?.toString() || ''}
              placeholder="Renda mensal (R$)"
              style={{ width: '100%', padding: 8, fontSize: 18 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit">Salvar</button>
              <button type="button" onClick={() => setProfileData(prev => ({
                ...prev,
                [currentProfile]: { ...prev[currentProfile], editing: false }
              }))}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Adjusting categories
  if (currentData.adjusting) {
    return (
      <div className="App">
        <BudgetAdjust
          categories={currentData.categories}
          onChange={(categories) => {
            setProfileData(prev => ({
              ...prev,
              [currentProfile]: { ...prev[currentProfile], categories, adjusting: false }
            }))
            handleSaveCategories(categories)
          }}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => setProfileData(prev => ({
            ...prev,
            [currentProfile]: { ...prev[currentProfile], adjusting: false }
          }))}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Main app
  return (
    <div className="App">
      <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#213547', margin: 0 }}>🏦 Organizador Financeiro</h1>
          <p style={{ color: '#666', margin: '0.5rem 0' }}>Método Investidor Sardinha</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label>Perfil:&nbsp;
                <select value={currentProfile} onChange={e => setCurrentProfile(e.target.value)}>
                  {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
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
          </div>
        </header>

        <div style={{ marginBottom: '1rem' }}>
          <label>Mês:&nbsp;
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const value = d.toISOString().slice(0, 7)
                const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                return <option key={value} value={value}>{label}</option>
              })}
            </select>
          </label>
        </div>

        <BudgetOverview
          income={currentData.income}
          categories={currentData.categories}
          expenses={currentExpenses}
          onEdit={() => setProfileData(prev => ({
            ...prev,
            [currentProfile]: { ...prev[currentProfile], editing: true }
          }))}
          onAdjust={() => setProfileData(prev => ({
            ...prev,
            [currentProfile]: { ...prev[currentProfile], adjusting: true }
          }))}
          onAddExpense={handleAddExpense}
          onRemoveExpense={handleRemoveExpense}
          onEditExpense={handleEditExpense}
        />

        <div style={{
          background: '#f3f8ff',
          color: '#234',
          borderLeft: '4px solid #4e79a7',
          padding: '12px 16px',
          margin: '24px 0',
          borderRadius: 6,
          fontSize: '1.05em',
          fontStyle: 'italic',
        }}>
          <b>Dica Sardinha:</b> Lembre-se: prazer é inegociável! Reserve sempre uma parte para o que te faz bem.
        </div>
      </div>
    </div>
  )
}

export default App
