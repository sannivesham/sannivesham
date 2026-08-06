import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import { PRIORITIES, TASK_CATEGORIES, uid } from '../../lib/utils.js'

const EMPTY = { title: '', category: TASK_CATEGORIES[0], priority: 'Medium', dueDate: '', repeat: 'none' }

export default function TaskForm({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title) return
    onSave({ id: uid(), completed: false, createdAt: new Date().toISOString(), ...form })
    setForm(EMPTY)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5">Task</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            >
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
            >
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Due date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Repeat</label>
          <select
            value={form.repeat}
            onChange={(e) => update('repeat', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-paper-line dark:border-ink-soft bg-transparent text-sm outline-none focus:border-marigold"
          >
            <option value="none">Doesn&rsquo;t repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Task</Button>
        </div>
      </form>
    </Modal>
  )
}
