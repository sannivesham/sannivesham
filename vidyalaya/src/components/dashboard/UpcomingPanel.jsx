import { useNavigate } from 'react-router-dom'
import { CalendarClock, ListTodo } from 'lucide-react'
import Card from '../common/Card.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { formatTime, cn } from '../../lib/utils.js'

const PRIORITY_DOT = {
  High: 'bg-rust',
  Medium: 'bg-marigold',
  Low: 'bg-sage',
}

export default function UpcomingPanel() {
  const { tasks, timetable } = useApp()
  const navigate = useNavigate()

  const upcomingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    .slice(0, 4)

  const today = new Date().getDay()
  const upcomingSlots = timetable
    .filter((s) => s.days?.includes(today))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ListTodo size={16} className="text-marigold-dark" />
          <h2 className="font-display text-base font-semibold">Upcoming Tasks</h2>
        </div>
        {upcomingTasks.length === 0 ? (
          <EmptyState title="All caught up" description="No pending tasks." />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcomingTasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[t.priority])} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  {t.dueDate && (
                    <p className="text-xs text-ink/50 dark:text-paper/50">
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => navigate('/tasks')}
          className="text-xs text-marigold-dark font-medium mt-4 hover:underline"
        >
          View all tasks &rarr;
        </button>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={16} className="text-marigold-dark" />
          <h2 className="font-display text-base font-semibold">Today&rsquo;s Timetable</h2>
        </div>
        {upcomingSlots.length === 0 ? (
          <EmptyState title="Nothing scheduled" description="No sessions planned for today." />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcomingSlots.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#E3A008' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.subject}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50 font-mono">{formatTime(`1970-01-01T${s.time}`)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => navigate('/timetable')}
          className="text-xs text-marigold-dark font-medium mt-4 hover:underline"
        >
          View full timetable &rarr;
        </button>
      </Card>
    </div>
  )
}
