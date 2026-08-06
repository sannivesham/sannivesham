import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { WEEKDAYS } from '../../lib/utils.js'
import EmptyState from '../common/EmptyState.jsx'
import { CalendarClock } from 'lucide-react'

// punch-card style grid: rows = time slots present in data, columns = weekdays
export default function TimetableBoard({ entries, onDelete }) {
  const [view, setView] = useState('weekly') // daily | weekly

  if (entries.length === 0) {
    return <EmptyState icon={CalendarClock} title="No timetable yet" description="Add your first study slot to build your weekly rhythm." />
  }

  const today = new Date().getDay()
  const visibleEntries = view === 'daily' ? entries.filter((e) => e.days.includes(today)) : entries
  const sorted = [...visibleEntries].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['daily', 'weekly'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
              view === v
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper'
                : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="border border-paper-line dark:border-ink-soft rounded-card overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-paper-dim/60 dark:bg-ink-soft/40 text-[10px] font-mono uppercase tracking-wide">
          <div className="p-2" />
          {WEEKDAYS.map((d) => (
            <div key={d} className="p-2 text-center border-l border-paper-line dark:border-ink-soft">{d}</div>
          ))}
        </div>

        {sorted.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[80px_repeat(7,1fr)] border-t border-paper-line dark:border-ink-soft">
            <div className="p-2 text-[11px] font-mono flex items-center gap-1">
              <span className="punch-hole" />
              {entry.time}
            </div>
            {WEEKDAYS.map((_, idx) => (
              <div key={idx} className="p-1.5 border-l border-paper-line dark:border-ink-soft flex items-center justify-center">
                {entry.days.includes(idx) && (
                  <div
                    className="w-full text-center text-[10px] font-medium rounded px-1 py-1.5 flex items-center justify-between gap-1 group"
                    style={{ backgroundColor: `${entry.color}22`, color: entry.color }}
                  >
                    <span className="truncate">{entry.subject}</span>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
