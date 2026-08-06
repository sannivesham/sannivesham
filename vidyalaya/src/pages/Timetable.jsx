import { useState } from 'react'
import { Plus } from 'lucide-react'
import TimetableBoard from '../components/timetable/TimetableBoard.jsx'
import TimetableForm from '../components/timetable/TimetableForm.jsx'
import Button from '../components/common/Button.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Timetable() {
  const { timetable, setTimetable } = useApp()
  const [formOpen, setFormOpen] = useState(false)

  function handleSave(entry) {
    setTimetable((prev) => [...prev, entry])
  }

  function handleDelete(id) {
    setTimetable((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">Timetable</h1>
        <Button icon={Plus} onClick={() => setFormOpen(true)}>Add Entry</Button>
      </div>

      <TimetableBoard entries={timetable} onDelete={handleDelete} />

      <TimetableForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  )
}
