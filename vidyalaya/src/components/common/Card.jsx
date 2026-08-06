import { cn } from '../../lib/utils.js'

export default function Card({ children, className, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'bg-white/60 dark:bg-ink-light/60 border border-paper-line dark:border-ink-soft',
        'rounded-card shadow-card p-5',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
