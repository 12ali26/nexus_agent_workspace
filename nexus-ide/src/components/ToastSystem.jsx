import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  XCircle,
} from 'lucide-react'

const toastIcons = {
  error: XCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
}

const toastColors = {
  error: 'var(--accent-red)',
  info: 'var(--accent-blue)',
  success: 'var(--accent-green)',
  warning: '#f0883e',
}

export function ToastSystem() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (event) => {
      const {
        duration = 4000,
        id,
        message,
        type = 'info',
      } = event.detail ?? {}
      const toastId = id || `toast-${Date.now()}-${Math.random()}`

      if (!message) {
        return
      }

      setToasts((currentToasts) => [
        ...currentToasts.slice(-4),
        {
          duration,
          id: toastId,
          message,
          type: toastIcons[type] ? type : 'info',
        },
      ])

      if (duration > 0) {
        window.setTimeout(() => {
          setToasts((currentToasts) =>
            currentToasts.filter((toast) => toast.id !== toastId),
          )
        }, duration)
      }
    }

    window.addEventListener('nexus-toast', handleToast)

    return () => window.removeEventListener('nexus-toast', handleToast)
  }, [])

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]

        return (
          <div className={`toast toast-${toast.type}`} key={toast.id}>
            <Icon size={14} color={toastColors[toast.type]} />
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              type="button"
              aria-label="Dismiss toast"
              onClick={() =>
                setToasts((currentToasts) =>
                  currentToasts.filter((item) => item.id !== toast.id),
                )
              }
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
