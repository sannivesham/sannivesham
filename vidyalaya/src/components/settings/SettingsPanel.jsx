import { useState } from 'react'
import { Download, Upload, Trash2 } from 'lucide-react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function SettingsPanel() {
  const { tasks, timetable, files, streak, dailyGoal, studyLog, profile, setProfile } = useApp()
  const { showToast } = useToast()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)

  function handleExport() {
    const data = { tasks, timetable, files, streak, dailyGoal, studyLog, profile, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vidyalaya-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Backup downloaded', 'success')
  }

  function handleSaveProfile(e) {
    e.preventDefault()
    setProfile((p) => ({ ...p, name, email }))
    showToast('Profile updated', 'success')
  }

  function handleClearData() {
    if (!confirm('This clears all locally stored data (tasks, timetable, library metadata). Continue?')) return
    localStorage.clear()
    showToast('Local data cleared — reload to see changes', 'success')
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Profile</h3>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            />
          </div>
          <Button type="submit" className="self-start">Save Profile</Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Theme</h3>
        <ThemeSwitcher />
      </Card>

      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Data</h3>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" icon={Download} onClick={handleExport} className="self-start">
            Export Data
          </Button>
          <label className="inline-flex">
            <Button variant="secondary" icon={Upload} as="span" className="self-start pointer-events-none">
              Import Data
            </Button>
            <input type="file" accept="application/json" className="hidden" disabled />
          </label>
          <Button variant="danger" icon={Trash2} onClick={handleClearData} className="self-start mt-2">
            Clear All Local Data
          </Button>
        </div>
      </Card>
    </div>
  )
}
