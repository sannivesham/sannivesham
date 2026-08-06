import { Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { cn } from '../../lib/utils.js'

const ACCENT_COLORS = {
  marigold: '#E3A008',
  sage: '#5C8374',
  rust: '#B23A2E',
}

export default function ThemeSwitcher() {
  const { theme, setTheme, accent, setAccent, THEMES, ACCENTS } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium mb-2">Appearance</p>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm capitalize font-medium transition-colors',
                theme === t
                  ? 'border-marigold bg-marigold/10'
                  : 'border-paper-line dark:border-ink-soft',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2">Accent color</p>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a}
              onClick={() => setAccent(a)}
              className="w-9 h-9 rounded-full flex items-center justify-center border-2"
              style={{
                backgroundColor: ACCENT_COLORS[a],
                borderColor: accent === a ? 'currentColor' : 'transparent',
              }}
              aria-label={a}
            >
              {accent === a && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
