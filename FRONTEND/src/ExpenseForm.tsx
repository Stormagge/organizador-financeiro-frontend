import { useState } from 'react'
import type { Category } from './BudgetAdjust'

export interface Expense {
  id?: number // Adicionado para integração backend
  value: number
  date: string // ISO
  description: string
  category: Category['key']
  recurring?: boolean
}

interface ExpenseFormProps {
  categories: Category[]
  onAdd: (expense: Expense) => void
}

export function ExpenseForm({ categories, onAdd, value: initialValue = 0, date: initialDate, description: initialDesc = '', category: initialCat, recurring: initialRec = false }: ExpenseFormProps & Partial<Expense>) {
  // Garante que initialValue seja string
  const [value, setValue] = useState(() => {
    if (typeof initialValue === 'number') return initialValue.toString();
    if (typeof initialValue === 'string') return initialValue;
    return '';
  })
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState(initialDesc)
  const [category, setCategory] = useState(initialCat || categories[0]?.key || '')
  const [recurring, setRecurring] = useState(initialRec)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(value.replace(',', '.'))
    if (isNaN(val) || val <= 0) {
      setError('Informe um valor válido')
      return
    }
    if (!category) {
      setError('Selecione uma categoria')
      return
    }
    setError('')
    onAdd({ value: val, date, description, category, recurring })
    // Só limpa se não for edição
    if (!initialValue && !initialDesc && !initialCat && !initialRec && !initialDate) {
      setValue('')
      setDescription('')
      setRecurring(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'left', background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
      <h3>{initialValue || initialDesc || initialCat || initialRec || initialDate ? 'Editar Despesa' : 'Registrar Despesa'}</h3>
      <div style={{ marginBottom: 8 }}>
        <label>Valor (R$):<br />
          <input type="text" value={value} onChange={e => setValue(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Data:<br />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Descrição:<br />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Categoria:<br />
          <select value={category} onChange={e => setCategory(e.target.value as Category['key'])} style={{ width: '100%' }}>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
          Despesa recorrente
        </label>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <button type="submit" style={{ width: '100%' }}>{initialValue || initialDesc || initialCat || initialRec || initialDate ? 'Salvar' : 'Adicionar'}</button>
    </form>
  )
}
