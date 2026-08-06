import { Trash2, CheckCircle2, Circle } from 'lucide-react'
import EmptyState from '../common/EmptyState.jsx'
import { ListTodo } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const PRIORITY_STYLE = {
  High: 'text-rust border-rust/30 bg-rust/5',
  Medium: 'text-marigold-dark border-marigold/30 bg-marigold/5',
  Low: 'text-sage border-sage/30 bg-sage/5',
}

export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <EmptyState icon={ListTodo} title="No tasks here" description="Add a task to get started." />
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-paper-line dark:border-ink-soft"
        >
          <button onClick={() => onToggle(task.id)} aria-label="Toggle complete">
            {task.completed ? (
              <CheckCircle2 size={18} className="text-sage" />
            ) : (
              <Circle size={18} className="text-ink/30 dark:text-paper/30" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', task.completed && 'line-through text-ink/40 dark:text-paper/40')}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-ink/50 dark:text-paper/50">{task.category}</span>
              {task.dueDate && (
                <span className="text-xs text-ink/50 dark:text-paper/50">
                  · Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border shrink-0', PRIORITY_STYLE[task.priority])}>
            {task.priority}
          </span>

          <button onClick={() => onDelete(task.id)} aria-label="Delete task">
            <Trash2 size={14} className="text-ink/40 dark:text-paper/40 hover:text-rust" />
          </button>
        </li>
      ))}
    </ul>
  )
}
