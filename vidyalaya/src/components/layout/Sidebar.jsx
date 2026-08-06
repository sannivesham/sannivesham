import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Library, Calendar, ListTodo, Timer,
  BarChart3, Award, Settings, BookOpen, CalendarClock,
} from 'lucide-react'
import { cn } from '../../lib/utils.js'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/timetable', label: 'Timetable', icon: CalendarClock },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/achievements', label: 'Achievements', icon: Award },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-paper-line dark:border-ink-soft bg-paper dark:bg-ink px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-md bg-ink dark:bg-paper flex items-center justify-center">
          <BookOpen size={16} className="text-paper dark:text-ink" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Vidyalaya</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                  : 'text-ink/65 dark:text-paper/65 hover:bg-ink/5 dark:hover:bg-paper/10',
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2',
            isActive
              ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
              : 'text-ink/65 dark:text-paper/65 hover:bg-ink/5 dark:hover:bg-paper/10',
          )
        }
      >
        <Settings size={17} strokeWidth={2} />
        Settings
      </NavLink>
    </aside>
  )
}
