/**
 * Format date as day label (day and month, e.g., "15 דצמ")
 */
export function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

/**
 * Format date with weekday for display
 */
export function formatDateWithWeekday(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })
}
