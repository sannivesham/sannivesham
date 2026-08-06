import { Flame } from 'lucide-react'
import Card from '../common/Card.jsx'
import { useApp } from '../../context/AppContext.jsx'

export default function StreakCard() {
  const { streak } = useApp()

  return (
    <Card className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-rust/10 flex items-center justify-center shrink-0">
        <Flame size={22} className="text-rust" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-mono text-2xl font-semibold leading-none">
          {streak.current}
          <span className="text-sm text-ink/50 dark:text-paper/50 font-body font-normal ml-1">
            day{streak.current === 1 ? '' : 's'}
          </span>
        </p>
        <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">
          Study streak &middot; best {streak.longest}
        </p>
      </div>
    </Card>
  )
}
