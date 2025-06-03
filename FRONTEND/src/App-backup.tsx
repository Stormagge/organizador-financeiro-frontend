import { useState, useEffect } from 'react'
import './App.css'
import { BudgetAdjust } from './BudgetAdjust'
import type { Category } from './BudgetAdjust'
import { ExpenseForm, type Expense } from './ExpenseForm'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { exportExpensesToCSV } from './exportCSV'
import { AuthForm } from './AuthForm'
import { apiFetch, useOfflineMode } from './firebase'
import { ApiErrorFallback } from './ApiErrorFallback'

// Componente para indicar modo offline
function OfflineIndicator({ onToggle }: { onToggle: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: '#ffeb3b',
      color: '#333',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      zIndex: 1000,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }} onClick={onToggle}>
      <span style={{ 
        width: '10px', 
        height: '10px', 
        backgroundColor: '#ff9800',
        borderRadius: '50%',
        display: 'inline-block'
      }}></span>
      Modo Offline Ativado
    </div>
  );
}

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

interface MonthSelectorProps {
  current: string
  onChange: (month: string) => void
}

function MonthSelector({ current, onChange }: MonthSelectorProps) {
  // Gera lista dos últimos 12 meses
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return (
    <div style={{ margin: '16px 0' }}>
      <label>Mês:&nbsp;
        <select value={current} onChange={e => onChange(e.target.value)}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>
    </div>
  )
}

const SARDINHA_TIPS = [
  'Lembre-se: prazer é inegociável! Reserve sempre uma parte para o que te faz bem.',
  'Se os custos fixos estão altos, reveja contratos e busque alternativas.',
  'Investir todo mês, mesmo pouco, é mais importante que esperar sobrar muito.',
  'Evite zerar as categorias de conhecimento e liberdade financeira.',
  'Revisite seu orçamento a cada mês e ajuste conforme sua realidade.',
  'Despesas recorrentes merecem atenção: revise periodicamente!',
  'Acompanhe o progresso das suas metas para se manter motivado.',
]

function SardinhaTip() {
  const tip = SARDINHA_TIPS[Math.floor(Math.random() * SARDINHA_TIPS.length)]
  return (
    <div style={{
      background: '#f3f8ff',
      color: '#234',
      borderLeft: '4px solid #4e79a7',
      padding: '12px 16px',
      margin: '24px 0',
      borderRadius: 6,
      fontSize: '1.05em',
      fontStyle: 'italic',
      maxWidth: 500,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <b>Dica Sardinha:</b> {tip}
    </div>
  )
}

interface CategoryEditProps {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

function CategoryEdit({ categories, onChange }: CategoryEditProps) {
  const [local, setLocal] = useState(categories)
  const [newCat, setNewCat] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const name = newCat.trim()
    if (!name) return
    if (local.some(c => c.label.toLowerCase() === name.toLowerCase())) {
      setError('Categoria já existe')
      return
    }
    setLocal([
      ...local,
      { key: name.toLowerCase().replace(/\s+/g, '_') as any, label: name, percent: 0 }
    ])
    setNewCat('')
    setError('')
  }
  const handleRemove = (key: string) => {
    setLocal(local.filter(c => c.key !== key))
  }
  const handleSave = () => {
    if (local.length < 6) {
      setError('Mantenha pelo menos as categorias essenciais do método!')
      return
    }
    setError('')
    onChange(local)
  }
  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'left' }}>
      <h2>Personalizar Categorias</h2>
      <ul>
        {local.map(cat => (
          <li key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {cat.label}
            {cat.percent === 0 && <button onClick={() => handleRemove(cat.key)}>Remover</button>}
          </li>
        ))}
      </ul>
      <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nova categoria" />
      <button onClick={handleAdd}>Adicionar</button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button style={{ marginTop: 16 }} onClick={handleSave}>Salvar</button>
    </div>
  )
}

function ProfileSelector({ profiles, current, onChange, onAdd }: { profiles: string[], current: string, onChange: (p: string) => void, onAdd: (p: string) => void }) {
  const [newProfile, setNewProfile] = useState('')
  return (
    <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <label>Perfil:&nbsp;
        <select value={current} onChange={e => onChange(e.target.value)}>
          {profiles.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <input type="text" value={newProfile} onChange={e => setNewProfile(e.target.value)} placeholder="Novo perfil" style={{ width: 120 }} />
      <button onClick={() => { if (newProfile.trim()) { onAdd(newProfile.trim()); setNewProfile('') } }}>Adicionar</button>
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
    month: string,
    expensesByMonth: Record<string, Expense[]>,
    editingIndex: number | null,
    editingCategories: boolean
  }>>({})

  // Estados para feedback visual
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para gerenciar problemas de API
  const [apiError, setApiError] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(useOfflineMode.isEnabled);
  
  // Efeito para monitorar o modo offline
  useEffect(() => {
    setIsOffline(useOfflineMode.isEnabled);
    
    // Verificar se API está disponível ao iniciar
    if (!isOffline) {
      checkApiAvailability();
    }
  }, []);
  
  // Função para verificar disponibilidade da API
  const checkApiAvailability = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/profiles`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        setApiError(false);
      } else {
        setApiError(true);
        console.warn('API respondeu com erro:', res.status);
      }
    } catch (err) {
      setApiError(true);
      console.error('API indisponível:', err);
    }
  };
  
  // Toggle modo offline
  const toggleOfflineMode = () => {
    const newValue = !isOffline;
    useOfflineMode.setEnabled(newValue);
    setIsOffline(newValue);
    
    if (!newValue) {
      // Se desativou o modo offline, verifica API
      checkApiAvailability();
    } else {
      setApiError(false); // Reseta erro quando ativa offline
    }
  };

  // Busca perfis do backend ao autenticar
  useEffect(() => {
    if (!user) return;
    setLoading(true); setError(null);
    apiFetch('/api/profiles')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data.map((p: any) => p.name))
          setCurrentProfile(data[0].name)
        } else {
          setProfiles(['Pessoal'])
          setCurrentProfile('Pessoal')
          // Não setar erro aqui, pois é um caso esperado
        }
      })
      .catch(() => {
        setError('Erro ao buscar perfis');
        // Só faz fallback se for erro de rede/autenticação
        setProfiles(['Pessoal'])
        setCurrentProfile('Pessoal')
      })
      .finally(() => setLoading(false));
  }, [user])

  // Busca budgets do backend ao trocar de perfil
  useEffect(() => {
    if (!user || !currentProfile) return;
    setLoading(true); setError(null);
    apiFetch('/api/profiles')
      .then(res => res.json())
      .then((profilesData) => {
        const profile = Array.isArray(profilesData) ? profilesData.find((p: any) => p.name === currentProfile) : null;
        if (profile) {
          apiFetch(`/api/budgets/${profile.id}`)
            .then(res => res.json())
            .then((budgets) => {
              if (Array.isArray(budgets) && budgets.length > 0) {
                setProfileData(prev => ({
                  ...prev,
                  [currentProfile]: {
                    ...(prev[currentProfile] || {}),
                    categories: budgets.map((b: any) => ({ key: b.category, label: b.category, percent: b.percent })),
                  }
                }))
              }
            })
            .catch(() => setError('Erro ao buscar orçamentos'))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => { setError('Erro ao buscar perfis'); setLoading(false); });
  }, [user, currentProfile])

  // Buscar despesas do backend ao trocar de perfil ou mês
  useEffect(() => {
    if (!user || !currentProfile || !profileData[currentProfile]) return;
    apiFetch('/api/profiles')
      .then(res => res.json())
      .then((profilesData) => {
        const profile = Array.isArray(profilesData) ? profilesData.find((p: any) => p.name === currentProfile) : null;
        if (profile) {
          apiFetch(`/api/expenses/${profile.id}`)
            .then(res => res.json())
            .then((expenses) => {
              if (Array.isArray(expenses)) {
                setProfileData(prev => ({
                  ...prev,
                  [currentProfile]: {
                    ...(prev[currentProfile] || {}),
                    expensesByMonth: {
                      ...(prev[currentProfile]?.expensesByMonth || {}),
                      // Agrupa despesas por mês, agora incluindo id
                      ...expenses.reduce((acc: any, e: any) => {
                        const month = e.date.slice(0, 7);
                        acc[month] = acc[month] || [];
                        acc[month].push({
                          id: e.id,
                          value: e.value,
                          date: e.date,
                          description: e.description,
                          category: e.category,
                          recurring: !!e.recurring
                        });
                        return acc;
                      }, {})
                    }
                  }
                }))
              }
            })
        }
      })
  }, [user, currentProfile, profileData[currentProfile]?.month])

  // Adicionar despesa no backend
  const handleAddExpense = async (e: Expense) => {
    setLoading(true); setError(null);
    try {
      if (!profileData[currentProfile]) return;
      const profilesRes = await apiFetch('/api/profiles');
      const profilesData = await profilesRes.json();
      const profile = Array.isArray(profilesData) ? profilesData.find((p: any) => p.name === currentProfile) : null;
      if (!profile) return;
      const res = await apiFetch(`/api/expenses/${profile.id}`, {
        method: 'POST',
        body: JSON.stringify(e)
      });
      if (!res.ok) throw new Error('Erro ao adicionar despesa');
      // Atualiza local após adicionar
      const expRes = await apiFetch(`/api/expenses/${profile.id}`);
      const expenses = await expRes.json();
      if (Array.isArray(expenses)) {
        setProfileData(prev => ({
          ...prev,
          [currentProfile]: {
            ...(prev[currentProfile] || {}),
            expensesByMonth: {
              ...(prev[currentProfile]?.expensesByMonth || {}),
              ...expenses.reduce((acc: any, e: any) => {
                const month = e.date.slice(0, 7);
                acc[month] = acc[month] || [];
                acc[month].push({
                  id: e.id,
                  value: e.value,
                  date: e.date,
                  description: e.description,
                  category: e.category,
                  recurring: !!e.recurring
                });
                return acc;
              }, {})
            }
          }
        }))
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar despesa');
    } finally {
      setLoading(false);
    }
  }

  // Remover despesa no backend
  const handleRemoveExpense = async (index: number) => {
    setLoading(true); setError(null);
    try {
      const data = profileData[currentProfile];
      const expenses = Array.isArray(data.expensesByMonth[data.month]) ? data.expensesByMonth[data.month] : [];
      const expense = expenses[index];
      if (!expense?.id) return;
      const profilesRes = await apiFetch('/api/profiles');
      const profilesData = await profilesRes.json();
      const profile = Array.isArray(profilesData) ? profilesData.find((p: any) => p.name === currentProfile) : null;
      if (!profile) return;
      const res = await apiFetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover despesa');
      // Atualiza local após remover
      const expRes = await apiFetch(`/api/expenses/${profile.id}`);
      const expensesList = await expRes.json();
      if (Array.isArray(expensesList)) {
        setProfileData(prev => ({
          ...prev,
          [currentProfile]: {
            ...(prev[currentProfile] || {}),
            expensesByMonth: {
              ...(prev[currentProfile]?.expensesByMonth || {}),
              ...expensesList.reduce((acc: any, e: any) => {
                const month = e.date.slice(0, 7);
                acc[month] = acc[month] || [];
                acc[month].push({
                  id: e.id,
                  value: e.value,
                  date: e.date,
                  description: e.description,
                  category: e.category,
                  recurring: !!e.recurring
                });
                return acc;
              }, {})
            }
          }
        }))
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover despesa');
    } finally {
      setLoading(false);
    }
  }

  // Editar despesa no backend
  const handleUpdateExpense = async (updated: Expense) => {
    setLoading(true); setError(null);
    try {
      const data = profileData[currentProfile];
      if (data.editingIndex === null) return;
      const expenses = Array.isArray(data.expensesByMonth[data.month]) ? data.expensesByMonth[data.month] : [];
      const expense = expenses[data.editingIndex];
      if (!expense?.id) return;
      const res = await apiFetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Erro ao editar despesa');
      // Atualiza local após editar
      const profilesRes = await apiFetch('/api/profiles');
      const profilesData = await profilesRes.json();
      const profile = Array.isArray(profilesData) ? profilesData.find((p: any) => p.name === currentProfile) : null;
      if (!profile) return;
      const expRes = await apiFetch(`/api/expenses/${profile.id}`);
      const expensesList = await expRes.json();
      if (Array.isArray(expensesList)) {
        setProfileData(prev => ({
          ...prev,
          [currentProfile]: {
            ...(prev[currentProfile] || {}),
            expensesByMonth: {
              ...(prev[currentProfile]?.expensesByMonth || {}),
              ...expensesList.reduce((acc: any, e: any) => {
                const month = e.date.slice(0, 7);
                acc[month] = acc[month] || [];
                acc[month].push({
                  id: e.id,
                  value: e.value,
                  date: e.date,
                  description: e.description,
                  category: e.category,
                  recurring: !!e.recurring
                });
                return acc;
              }, {}),
              editingIndex: null
            }
          }
        }))
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao editar despesa');
    } finally {
      setLoading(false);
    }
  }

  // Adicionar novo perfil (agora via backend)
  const handleAddProfile = async (name: string) => {
    if (profiles.includes(name)) return
    try {
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name })
      })
      if (res.ok) {
        setProfiles(prev => [...prev, name])
        setCurrentProfile(name)
      }
    } catch {
      // erro ao criar perfil
    }
  }

  // Ao autenticar, sempre inicializa perfil se não existir
  async function handleAuth(u: any) {
    setUser(u);
    try {
      const profilesRes = await apiFetch('/api/profiles');
      const profilesData = await profilesRes.json();
      if (Array.isArray(profilesData) && profilesData.length > 0) {
        setProfiles(profilesData.map(p => p.name));
        setCurrentProfile(profilesData[0].name);
        setProfileData(prev => ({
          ...prev,
          [profilesData[0].name]: {
            income: profilesData[0].income || null,
            categories: DEFAULT_PERCENTAGES,
            adjusting: false,
            month: new Date().toISOString().slice(0, 7),
            expensesByMonth: {},
            editingIndex: null,
            editingCategories: false
          }
        }));
      } else {
        // Cria perfil padrão se não existir nenhum
        await apiFetch('/api/profiles', {
          method: 'POST',
          body: JSON.stringify({ name: 'Pessoal' })
        });
        
        setProfiles(['Pessoal']);
        const defaultProfile = 'Pessoal';
        setCurrentProfile(defaultProfile);
        setProfileData({
          [defaultProfile]: {
            income: null,
            categories: DEFAULT_PERCENTAGES,
            adjusting: false,
            month: new Date().toISOString().slice(0, 7),
            expensesByMonth: {},
            editingIndex: null,
            editingCategories: false
          }
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfis:', err);
      
      // Se falhou, ativa modo offline automaticamente
      if (!isOffline) {
        toggleOfflineMode();
      }
      
      setProfiles(['Pessoal']);
      setCurrentProfile('Pessoal');
      setProfileData({
        Pessoal: {
          income: null,
          categories: DEFAULT_PERCENTAGES,
          adjusting: false,
          month: new Date().toISOString().slice(0, 7),
          expensesByMonth: {},
          editingIndex: null,
          editingCategories: false
        }
      });
    }
  }

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  // Adiciona exibição de erro de API
  if (apiError && !isOffline) {
    return (
      <ApiErrorFallback 
        message="Não foi possível conectar ao servidor. Deseja usar o modo offline?"
        retry={() => {
          toggleOfflineMode();
          checkApiAvailability();
        }}
      />
    );
  }

  const data = profileData[currentProfile]
  // Funções para atualizar dados do perfil atual
  const updateProfile = (patch: Partial<typeof data>) => {
    setProfileData(prev => ({
      ...prev,
      [currentProfile]: { ...prev[currentProfile], ...patch }
    }))
  }
  // Funções de backup/importação
  const handleExportBackup = () => {
    const blob = new Blob([
      JSON.stringify({ profiles, currentProfile, profileData }, null, 2)
    ], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'organizador-financeiro-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        if (data && data.profiles && data.currentProfile && data.profileData) {
          setProfiles(data.profiles)
          setCurrentProfile(data.currentProfile)
          setProfileData(data.profileData)
        } else {
          alert('Arquivo inválido!')
        }
      } catch {
        alert('Erro ao importar backup!')
      }
    }
    reader.readAsText(file)
  }

  if (!data || data.income === null) {
    return <>
      <ProfileSelector profiles={profiles} current={currentProfile} onChange={setCurrentProfile} onAdd={handleAddProfile} />
      <Onboarding 
        profileName={currentProfile}
        onFinish={income => updateProfile({ income })} />
    </>
  }
  if (data.adjusting) {
    return <>
      <ProfileSelector profiles={profiles} current={currentProfile} onChange={setCurrentProfile} onAdd={handleAddProfile} />
      <BudgetAdjust categories={data.categories} onChange={cats => updateProfile({ categories: cats, adjusting: false })} />
    </>
  }
  if (data.editingCategories) {
    return <>
      <ProfileSelector profiles={profiles} current={currentProfile} onChange={setCurrentProfile} onAdd={handleAddProfile} />
      <CategoryEdit categories={data.categories} onChange={cats => updateProfile({ categories: cats, editingCategories: false })} />
    </>
  }
  const expenses = Array.isArray(data.expensesByMonth[data.month]) ? data.expensesByMonth[data.month] : []

  // Função para editar despesa: define o índice da despesa a ser editada
  const handleEditExpense = (index: number) => {
    updateProfile({ editingIndex: index });
  };

  if (data.editingIndex !== null) {
    const exp = Array.isArray(expenses) ? expenses[data.editingIndex] : undefined
    if (!exp) return null
    return <>
      <ProfileSelector profiles={profiles} current={currentProfile} onChange={setCurrentProfile} onAdd={handleAddProfile} />
      <ExpenseForm categories={data.categories} onAdd={handleUpdateExpense} key={data.editingIndex} {...exp} />
    </>
  }
  // Exibir loading e erro no topo da tela
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}><b>Carregando...</b></div>;
  }
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}><b>{error}</b></div>;
  }
  return (
    <>
      <ProfileSelector profiles={profiles} current={currentProfile} onChange={setCurrentProfile} onAdd={handleAddProfile} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={handleExportBackup}>Exportar Backup</button>
        <label style={{ cursor: 'pointer', background: '#eee', padding: '6px 12px', borderRadius: 4 }}>
          Importar Backup
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBackup} />
        </label>
      </div>
      <MonthSelector current={data.month} onChange={month => updateProfile({ month })} />
      <SardinhaTip />
      <button onClick={() => updateProfile({ editingCategories: true })} style={{ marginBottom: 16 }}>Personalizar Categorias</button>
      <BudgetOverview
        income={data.income}
        categories={data.categories}
        onEdit={() => updateProfile({ income: null })}
        onAdjust={() => updateProfile({ adjusting: true })}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onRemoveExpense={handleRemoveExpense}
        onEditExpense={handleEditExpense}
      />
      
      {/* Indicador de modo offline */}
      {isOffline && <OfflineIndicator onToggle={toggleOfflineMode} />}
    </>
  )
}

export default App
