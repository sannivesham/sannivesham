import { createContext, useCallback, useContext, useState } from 'react'
import { uid } from '../lib/utils.js'

const ToastContext = createContext(null)

function variantClasses(variant) {
  const base =
    'px-4 py-2.5 rounded-card shadow-lifted text-sm font-medium'
  const variants = {
    default: 'bg-ink text-paper dark:bg-paper dark:text-ink',
    success: 'bg-sage text-paper',
    error: 'bg-rust text-paper',
  }
  return `${base} ${variants[variant] || variants.default}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, variant = 'default') => {
    const id = uid()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div key={t.id} className={variantClasses(t.variant)} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
