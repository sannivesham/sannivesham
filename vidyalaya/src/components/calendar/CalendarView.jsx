import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, isSameDay } from '../../lib/utils.js'
import { useApp } from '../../context/AppContext.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

export default function CalendarView() {
  const { tasks, timetable } = useApp()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(new Date())

  const cells = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor])

  function eventsFor(day) {
    if (!day) return []
    const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(t.dueDate, day))
    const dayTimetable = timetable.filter((s) => s.days?.includes(day.getDay()))
    return [...dayTasks.map((t) => ({ type: 'task', ...t })), ...dayTimetable.map((s) => ({ type: 'timetable', ...s }))]
  }

  const selectedEvents = eventsFor(selected)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-ink/40 dark:text-paper/40 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            const events = eventsFor(day)
            const isSelected = day && isSameDay(day, selected)
            const isToday = day && isSameDay(day, new Date())
            return (
              <button
                key={idx}
                disabled={!day}
                onClick={() => day && setSelected(day)}
                className={cn(
                  'aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-colors',
                  !day && 'invisible',
                  isSelected && 'bg-ink text-paper dark:bg-paper dark:text-ink',
                  !isSelected && isToday && 'border border-marigold',
                  !isSelected && !isToday && 'hover:bg-ink/5 dark:hover:bg-paper/10',
                )}
              >
                {day?.getDate()}
                {events.length > 0 && (
                  <span className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-marigold' : 'bg-marigold')} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold mb-3">
          {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-paper/50">Nothing scheduled.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((ev, idx) => (
              <li key={idx} className="p-3 rounded-lg border border-paper-line dark:border-ink-soft text-sm">
                <p className="font-medium">{ev.title || ev.subject}</p>
                <p className="text-xs text-ink/50 dark:text-paper/50 capitalize">
                  {ev.type === 'task' ? `Task · ${ev.priority} priority` : `Timetable · ${ev.time}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
