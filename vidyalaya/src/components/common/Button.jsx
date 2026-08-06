import { cn } from '../../lib/utils.js'

const VARIANTS = {
  primary: 'bg-marigold text-ink hover:bg-marigold-light font-semibold',
  secondary:
    'bg-transparent border border-ink/15 dark:border-paper/20 text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/5',
  ghost: 'bg-transparent text-ink/70 dark:text-paper/70 hover:bg-ink/5 dark:hover:bg-paper/10',
  danger: 'bg-rust text-paper hover:bg-rust-light',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  )
}
