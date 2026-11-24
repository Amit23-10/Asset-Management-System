export function formatDateDisplay(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '—'
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`
  return value
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function currentPeriodLabel(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const days = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return `01-${mm}-${year} - ${days}-${mm}-${year}`
}

export function cellText(value: unknown, type?: 'text' | 'number' | 'date'): string {
  if (value === undefined || value === null || value === '') return '—'
  if (type === 'date') return formatDateDisplay(value)
  if (type === 'number') return typeof value === 'number' ? value.toLocaleString() : String(value)
  return String(value)
}
