import { useNavigate } from 'react-router-dom'
import { Upload, CalendarPlus, ListPlus, BookOpenCheck, Star, BarChart3 } from 'lucide-react'
import Card from '../common/Card.jsx'

const ACTIONS = [
  { label: 'Upload File', icon: Upload, to: '/library?upload=1' },
  { label: 'Create Timetable', icon: CalendarPlus, to: '/timetable' },
  { label: 'Add Task', icon: ListPlus, to: '/tasks' },
  { label: 'Continue Reading', icon: BookOpenCheck, to: '/library' },
  { label: 'Favorites', icon: Star, to: '/library?filter=favorites' },
  { label: 'Progress', icon: BarChart3, to: '/analytics' },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <h2 className="font-display text-base font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-paper-line dark:border-ink-soft hover:border-marigold/60 hover:bg-marigold/5 transition-colors text-center"
          >
            <Icon size={18} className="text-marigold-dark" strokeWidth={1.75} />
            <span className="text-[11px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
