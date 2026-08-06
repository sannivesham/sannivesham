import { cn } from '../../lib/utils.js'

export default function ProgressBar({ value = 0, className, colorClassName = 'bg-marigold' }) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-paper-line dark:bg-ink-soft overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colorClassName)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}
