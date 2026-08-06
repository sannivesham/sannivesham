import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Library, ListTodo, CalendarClock, Timer } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/timetable', label: 'Plan', icon: CalendarClock },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/pomodoro', label: 'Focus', icon: Timer },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper dark:bg-ink border-t border-paper-line dark:border-ink-soft flex items-center justify-around py-2">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium',
              isActive ? 'text-marigold-dark' : 'text-ink/50 dark:text-paper/50',
            )
          }
        >
          <Icon size={19} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
