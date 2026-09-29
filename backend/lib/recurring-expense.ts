export function addPeriod(dateStr: string, recurrence: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (recurrence === 'annual') {
    return `${year + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  // monthly — preserva el día del mes
  const newMonth = month + 1
  const newYear = newMonth > 12 ? year + 1 : year
  const actualMonth = newMonth > 12 ? 1 : newMonth
  return `${newYear}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
