import { BookOpenCheck, Clock, Flame, FileCheck2 } from 'lucide-react'
import StatCard from '../components/analytics/StatCard.jsx'
import AnalyticsCharts from '../components/analytics/AnalyticsCharts.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatDuration } from '../lib/utils.js'

export default function Analytics() {
  const { studyLog, files, streak, pomodoroStats } = useApp()

  const totalMinutes = studyLog.reduce((sum, l) => sum + l.minutes, 0)
  const completedCount = files.filter((f) => f.status === 'Completed').length

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-5">Study Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="Total Study Time" value={formatDuration(totalMinutes)} />
        <StatCard icon={FileCheck2} label="Documents Completed" value={completedCount} />
        <StatCard icon={Flame} label="Longest Streak" value={`${streak.longest} days`} />
        <StatCard icon={BookOpenCheck} label="Pomodoro Sessions" value={pomodoroStats.totalSessions} />
      </div>

      <AnalyticsCharts />
    </div>
  )
}
