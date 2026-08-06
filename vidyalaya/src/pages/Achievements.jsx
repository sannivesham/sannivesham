import BadgeGrid from '../components/achievements/BadgeGrid.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Achievements() {
  const { achievements, BADGE_DEFS } = useApp()

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">Achievements</h1>
      <p className="text-sm text-ink/50 dark:text-paper/50 mb-6">
        {achievements.length} of {BADGE_DEFS.length} badges unlocked
      </p>
      <BadgeGrid badgeDefs={BADGE_DEFS} unlocked={achievements} />
    </div>
  )
}
