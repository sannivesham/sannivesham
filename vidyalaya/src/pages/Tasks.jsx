import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import TaskList from '../components/tasks/TaskList.jsx'
import TaskForm from '../components/tasks/TaskForm.jsx'
import Button from '../components/common/Button.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Tasks() {
  const { tasks, setTasks } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [filter, setFilter] = useState('pending')

  function handleSave(task) {
    setTasks((prev) => [task, ...prev])
  }

  function handleToggle(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = useMemo(() => {
    if (filter === 'pending') return tasks.filter((t) => !t.completed)
    if (filter === 'completed') return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <Button icon={Plus} onClick={() => setFormOpen(true)}>Add Task</Button>
      </div>

      <div className="flex gap-2 mb-5">
        {['pending', 'completed', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
              filter === f
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink border-ink dark:border-paper'
                : 'border-paper-line dark:border-ink-soft text-ink/60 dark:text-paper/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <TaskList tasks={filtered} onToggle={handleToggle} onDelete={handleDelete} />

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  )
}
