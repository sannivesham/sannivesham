import Card from '../common/Card.jsx'

export default function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-marigold/15 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-marigold-dark" strokeWidth={1.75} />
        </div>
      )}
      <div>
        <p className="font-mono text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-ink/40 dark:text-paper/40 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}
