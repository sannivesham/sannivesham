import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import Card from '../common/Card.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ProgressBar from '../common/ProgressBar.jsx'
import { useApp } from '../../context/AppContext.jsx'

export default function ContinueReading() {
  const { files } = useApp()
  const navigate = useNavigate()

  const inProgress = files
    .filter((f) => f.status === 'Reading')
    .sort((a, b) => new Date(b.lastOpened || 0) - new Date(a.lastOpened || 0))
    .slice(0, 3)

  return (
    <Card>
      <h2 className="font-display text-base font-semibold mb-4">Continue Reading</h2>

      {inProgress.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing in progress"
          description="Open a file from your library to start reading."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {inProgress.map((file) => (
            <button
              key={file.id}
              onClick={() => navigate(`/reader/${file.id}`)}
              className="text-left p-3 rounded-lg border border-paper-line dark:border-ink-soft hover:border-marigold/60 transition-colors"
            >
              <p className="text-sm font-medium truncate">{file.title}</p>
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-2">{file.subject || file.category}</p>
              <ProgressBar value={file.readProgress || 0} />
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
