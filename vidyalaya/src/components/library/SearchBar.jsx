import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative mb-5">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title, subject, tag…"
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm focus:border-marigold outline-none transition-colors"
      />
    </div>
  )
}
