import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'bg-paper dark:bg-ink-light rounded-card shadow-lifted w-full max-w-lg',
          'max-h-[85vh] overflow-y-auto',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-line dark:border-ink-soft sticky top-0 bg-paper dark:bg-ink-light">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-ink/5 dark:hover:bg-paper/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
