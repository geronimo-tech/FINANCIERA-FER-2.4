export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatDate(dateString: string): string {
  // Parse the date string as local time to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatShortDate(dateString: string): string {
  // Parse the date string as local time to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(0)}%`
}
