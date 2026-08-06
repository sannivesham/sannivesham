import { User } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import ProgressRing from '../components/common/ProgressRing.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatDuration } from '../lib/utils.js'

export default function Profile() {
  const { profile, files, streak, studyLog, achievements, BADGE_DEFS } = useApp()

  const totalMinutes = studyLog.reduce((sum, l) => sum + l.minutes, 0)
  const completedCount = files.filter((f) => f.status === 'Completed').length
  const completionPct = files.length ? Math.round((completedCount / files.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-marigold/20 flex items-center justify-center shrink-0">
          <User size={26} className="text-marigold-dark" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">{profile.name}</h1>
          {profile.email && <p className="text-sm text-ink/50 dark:text-paper/50">{profile.email}</p>}
          <p className="text-xs text-ink/40 dark:text-paper/40 mt-1 font-mono">
            Joined {new Date(profile.joined).toLocaleDateString()}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex flex-col items-center text-center">
          <ProgressRing value={completionPct} />
          <p className="text-xs text-ink/50 dark:text-paper/50 mt-2">Overall Completion</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="font-mono text-2xl font-semibold">{streak.current}</p>
          <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">Day Streak</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="font-mono text-2xl font-semibold">{formatDuration(totalMinutes)}</p>
          <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">Total Study Time</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="font-mono text-2xl font-semibold">{achievements.length}/{BADGE_DEFS.length}</p>
          <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">Achievements</p>
        </Card>
      </div>
    </div>
  )
}
