import PomodoroTimer from '../components/pomodoro/PomodoroTimer.jsx'

export default function Pomodoro() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-5">Pomodoro Timer</h1>
      <PomodoroTimer />
    </div>
  )
}
