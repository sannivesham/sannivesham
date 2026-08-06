import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'

const QUOTES = [
  'Small steps, repeated daily, outrun big leaps taken rarely.',
  'The page you read today is the exam question you already know tomorrow.',
  'Discipline is choosing between what you want now and what you want most.',
  'Consistency turns ordinary effort into extraordinary results.',
  'You don\u2019t need more time — you need fewer distractions.',
  'Every hour of focus is a deposit in your future self.',
]

function quoteOfDay() {
  const day = new Date().getDate() + new Date().getMonth()
  return QUOTES[day % QUOTES.length]
}

export default function WelcomeBanner() {
  const { profile } = useApp()
  const quote = useMemo(quoteOfDay, [])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="index-card p-6 mb-6">
      <p className="text-xs uppercase tracking-wide text-marigold-dark font-semibold mb-1">
        {greeting}
      </p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-3">
        {profile.name}
      </h1>
      <p className="text-sm text-ink/60 dark:text-paper/60 italic notebook-rule py-1">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  )
}
