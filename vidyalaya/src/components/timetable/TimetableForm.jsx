import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { WEEKDAYS, uid, cn } from '../../lib/utils.js'

const COLORS = ['#E3A008', '#5C8374', '#B23A2E', '#3B6EA5', '#8B5CF6']

const EMPTY = { subject: '', time: '09:00', duration: 60, days: [], color: COLORS[0] }

export default function TimetableForm({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleDay(idx) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(idx) ? f.days.filter((d) => d !== idx) : [...f.days, idx],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.subject || form.days.length === 0) return
    onSave({ id: uid(), ...form })
    setForm(EMPTY)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New timetable entry">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => update('time', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Duration (min)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={form.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Repeat on</label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((day, idx) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(idx)}
                className={cn(
                  'w-9 h-9 rounded-full text-xs font-medium border transition-colors',
                  form.days.includes(idx)
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper'
                    : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60',
                )}
              >
                {day[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => update('color', c)}
                className={cn('w-7 h-7 rounded-full border-2', form.color === c ? 'border-ink dark:border-paper' : 'border-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add to Timetable</Button>
        </div>
      </form>
    </Modal>
  )
}
