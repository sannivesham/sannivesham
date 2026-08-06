import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Search, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { formatDate } from '../../lib/utils.js'

export default function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-paper-line dark:border-ink-soft">
      <div>
        <p className="text-xs text-ink/50 dark:text-paper/50 font-mono">{formatDate(new Date())}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/library')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-paper-line dark:border-ink-soft text-sm text-ink/50 dark:text-paper/50 hover:border-marigold/50 transition-colors w-56"
        >
          <Search size={15} />
          Search your library…
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-ink/5 dark:hover:bg-paper/10 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-marigold/20 flex items-center justify-center hover:bg-marigold/30 transition-colors"
          aria-label="Profile"
        >
          <User size={15} className="text-marigold-dark" />
        </button>
      </div>
    </header>
  )
}
