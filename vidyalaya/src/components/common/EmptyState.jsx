export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-marigold/15 flex items-center justify-center mb-4">
          <Icon size={22} className="text-marigold-dark" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink/60 dark:text-paper/60 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
