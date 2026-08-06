import { Target } from 'lucide-react'
import Card from '../common/Card.jsx'
import ProgressBar from '../common/ProgressBar.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { formatDuration } from '../../lib/utils.js'

export default function TodayGoal() {
  const { dailyGoal } = useApp()
  const targetMinutes = dailyGoal.target * 60
  const progress = Math.min(100, Math.round(((dailyGoal.progressMinutes || 0) / targetMinutes) * 100))

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-marigold-dark" />
        <h2 className="font-display text-base font-semibold">Today&rsquo;s Goal</h2>
      </div>
      <p className="text-sm text-ink/60 dark:text-paper/60 mb-2">
        {formatDuration(dailyGoal.progressMinutes || 0)} of {formatDuration(targetMinutes)} studied
      </p>
      <ProgressBar value={progress} />
      <p className="text-right text-xs font-mono mt-1.5 text-ink/50 dark:text-paper/50">{progress}%</p>
    </Card>
  )
}
