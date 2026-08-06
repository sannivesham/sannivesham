import { useNavigate } from 'react-router-dom'
import { FileText, Star, CheckCircle2, Circle, BookOpen } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useApp } from '../../context/AppContext.jsx'

const STATUS_ICON = {
  'Not Started': Circle,
  Reading: BookOpen,
  Completed: CheckCircle2,
}

const STATUS_COLOR = {
  'Not Started': 'text-ink/40 dark:text-paper/40',
  Reading: 'text-marigold-dark',
  Completed: 'text-sage',
}

export default function FileCard({ file }) {
  const navigate = useNavigate()
  const { setFiles } = useApp()
  const StatusIcon = STATUS_ICON[file.status] || Circle

  function toggleFavorite(e) {
    e.stopPropagation()
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, favorite: !f.favorite } : f)))
  }

  return (
    <button
      onClick={() => navigate(`/reader/${file.id}`)}
      className="index-card p-4 pl-8 text-left w-full hover:shadow-lifted hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <FileText size={18} className="text-ink/40 dark:text-paper/40 shrink-0" strokeWidth={1.75} />
        <button onClick={toggleFavorite} aria-label="Toggle favorite" className="shrink-0">
          <Star
            size={16}
            className={file.favorite ? 'fill-marigold text-marigold' : 'text-ink/25 dark:text-paper/25'}
          />
        </button>
      </div>

      <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2">{file.title}</p>
      <p className="text-xs text-ink/50 dark:text-paper/50 mb-3">
        {file.category}{file.subject ? ` · ${file.subject}` : ''}
      </p>

      <div className={cn('flex items-center gap-1.5 text-xs font-medium', STATUS_COLOR[file.status])}>
        <StatusIcon size={13} />
        {file.status}
      </div>
    </button>
  )
}
