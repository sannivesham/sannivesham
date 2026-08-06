import { Award, Lock } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function BadgeGrid({ badgeDefs, unlocked }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badgeDefs.map((badge) => {
        const isUnlocked = unlocked.includes(badge.id)
        return (
          <div
            key={badge.id}
            className={cn(
              'flex flex-col items-center text-center p-5 rounded-card border',
              isUnlocked
                ? 'border-marigold/40 bg-marigold/5'
                : 'border-paper-line dark:border-ink-soft opacity-50',
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                isUnlocked ? 'bg-marigold/20' : 'bg-ink/5 dark:bg-paper/10',
              )}
            >
              {isUnlocked ? (
                <Award size={20} className="text-marigold-dark" />
              ) : (
                <Lock size={16} className="text-ink/30 dark:text-paper/30" />
              )}
            </div>
            <p className="text-xs font-medium leading-tight">{badge.label}</p>
          </div>
        )
      })}
    </div>
  )
}
