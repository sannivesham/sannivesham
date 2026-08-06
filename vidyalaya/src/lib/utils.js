export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date, opts = {}) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...opts,
  }).format(new Date(date))
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function percent(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function uid() {
  return crypto.randomUUID()
}

export function isToday(date) {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export const CATEGORIES = [
  'ECE', 'Programming', 'AI & ML', 'College Subjects',
  'ISRO', 'GATE', 'Notes', 'Placements', 'Personal',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

export const TASK_CATEGORIES = ['Study', 'Personal', 'Project', 'Assignment']

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
