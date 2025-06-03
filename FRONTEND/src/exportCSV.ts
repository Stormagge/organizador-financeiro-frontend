import type { Expense } from './ExpenseForm'

export function exportExpensesToCSV(expenses: Expense[], filename = 'despesas.csv') {
  if (!expenses.length) return
  const header = 'Valor (R$);Data;Descrição;Categoria;Recorrente\n'
  const rows = expenses.map(e => [
    e.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    e.date,
    e.description?.replace(/;/g, ',') || '',
    e.category,
    e.recurring ? 'Sim' : 'Não',
  ].join(';'))
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
