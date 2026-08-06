import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { useTimer } from '../../hooks/useTimer.js'
import { useApp } from '../../context/AppContext.jsx'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import { formatDuration } from '../../lib/utils.js'

const PRESETS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }

export default function PomodoroTimer() {
  const { pomodoroStats, setPomodoroStats, recordStudyMinutes } = useApp()
  const [mode, setMode] = useState('focus')
  const [customMinutes, setCustomMinutes] = useState(25)
  const seconds = mode === 'custom' ? customMinutes * 60 : PRESETS[mode]
  const { secondsLeft, running, start, pause, reset, isDone } = useTimer(seconds)

  useEffect(() => {
    if (isDone && mode === 'focus') {
      const minutes = seconds / 60
      recordStudyMinutes(minutes)
      setPomodoroStats((s) => ({
        totalSessions: s.totalSessions + 1,
        totalFocusMinutes: s.totalFocusMinutes + minutes,
        todayFocusMinutes: (s.todayFocusMinutes || 0) + minutes,
        lastSessionDate: new Date().toISOString(),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const progress = 1 - secondsLeft / seconds

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 flex flex-col items-center justify-center py-12">
        <div className="flex gap-2 mb-8">
          {['focus', 'short', 'long', 'custom'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset() }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
                mode === m
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper'
                  : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60'
              }`}
            >
              {m === 'focus' ? '25 min' : m === 'short' ? '5 min break' : m === 'long' ? '15 min break' : 'Custom'}
            </button>
          ))}
        </div>

        {mode === 'custom' && (
          <input
            type="number"
            min={1}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-24 mb-6 px-3 py-1.5 text-center rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
          />
        )}

        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
          <svg width={224} height={224} className="-rotate-90 absolute inset-0">
            <circle cx={112} cy={112} r={100} strokeWidth={8} className="stroke-paper-line dark:stroke-ink-soft" fill="none" />
            <circle
              cx={112} cy={112} r={100} strokeWidth={8} stroke="#E3A008" fill="none"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="font-mono text-5xl font-semibold tabular-nums">{mins}:{secs}</span>
        </div>

        <div className="flex gap-3">
          {!running ? (
            <Button icon={Play} onClick={start} size="lg">Start</Button>
          ) : (
            <Button icon={Pause} onClick={pause} size="lg" variant="secondary">Pause</Button>
          )}
          <Button icon={RotateCcw} onClick={reset} size="lg" variant="ghost">Reset</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Focus Stats</h3>
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-mono text-2xl font-semibold">{formatDuration(pomodoroStats.todayFocusMinutes || 0)}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">Today&rsquo;s focus time</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold">{pomodoroStats.totalSessions}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">Total sessions completed</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold">{formatDuration(pomodoroStats.totalFocusMinutes || 0)}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">Lifetime focus time</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
