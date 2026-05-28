import { AlertTriangle, Database, RefreshCw } from 'lucide-react'

export function EmptyState({
  icon: Icon = Database,
  message = 'No data available',
}) {
  return (
    <div className="block-empty-state">
      <Icon size={24} color="var(--text-muted)" />
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="block-error-state">
      <AlertTriangle size={20} color="var(--accent-red)" />
      <div className="block-error-content">
        <div className="block-error-title">Error</div>
        <div className="block-error-message">{message}</div>
        {onRetry && (
          <button className="block-error-retry" type="button" onClick={onRetry}>
            <RefreshCw size={12} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="block-empty-state">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  )
}
