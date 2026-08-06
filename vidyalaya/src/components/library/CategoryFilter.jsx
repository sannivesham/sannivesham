import { cn, CATEGORIES } from '../../lib/utils.js'

export default function CategoryFilter({ active, onChange }) {
  const options = ['All', ...CATEGORIES, 'Favorites']

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            active === opt
              ? 'bg-ink text-paper border-ink dark:bg-paper dark:text-ink dark:border-paper'
              : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60 hover:border-marigold/60',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
