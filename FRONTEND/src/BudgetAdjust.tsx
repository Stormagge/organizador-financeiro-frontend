import { useState } from 'react'

export type CategoryKey = 'fixos' | 'conforto' | 'metas' | 'prazeres' | 'liberdade' | 'conhecimento'

export interface Category {
  key: CategoryKey
  label: string
  percent: number
}

export interface BudgetAdjustProps {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

const MIN_PERCENTS: Record<CategoryKey, number> = {
  fixos: 0,
  conforto: 0,
  metas: 0,
  prazeres: 5, // inegociável
  liberdade: 5, // mínimo sugerido
  conhecimento: 5, // mínimo sugerido
}

export function BudgetAdjust({ categories, onChange }: BudgetAdjustProps) {
  const [local, setLocal] = useState(categories)
  const [error, setError] = useState('')

  const handlePercentChange = (key: CategoryKey, value: number) => {
    setLocal(prev => prev.map(cat => cat.key === key ? { ...cat, percent: value } : cat))
  }

  const handleSave = () => {
    const total = local.reduce((sum, c) => sum + c.percent, 0)
    if (total !== 100) {
      setError('A soma dos percentuais deve ser 100%')
      return
    }
    for (const cat of local) {
      if (cat.percent < MIN_PERCENTS[cat.key]) {
        setError(`O percentual mínimo para ${cat.label} é ${MIN_PERCENTS[cat.key]}%`)
        return
      }
    }
    setError('')
    onChange(local)
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'left' }}>
      <h2>Ajuste de Percentuais</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Categoria</th>
            <th style={{ textAlign: 'right' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {local.map(cat => (
            <tr key={cat.key}>
              <td>{cat.label}</td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  min={MIN_PERCENTS[cat.key]}
                  max={100}
                  value={cat.percent}
                  onChange={e => handlePercentChange(cat.key, Number(e.target.value))}
                  style={{ width: 60, textAlign: 'right' }}
                />
                %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button style={{ marginTop: 24 }} onClick={handleSave}>Salvar</button>
    </div>
  )
}
