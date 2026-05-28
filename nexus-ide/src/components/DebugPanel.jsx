import { useEffect, useRef, useState } from 'react'
import { Bug, Download, Trash2, X } from 'lucide-react'

const logColors = {
  api: 'var(--accent-blue)',
  component: 'var(--accent-purple)',
  error: 'var(--accent-red)',
  info: 'var(--text-secondary)',
  warning: '#f0883e',
}

function stringifyConsoleValue(value) {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Error) {
    return value.stack || value.message
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function DebugPanel() {
  const [filter, setFilter] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const logsEndRef = useRef(null)

  useEffect(() => {
    const addLog = (log) => {
      setLogs((currentLogs) => [
        ...currentLogs.slice(-199),
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          type: 'info',
          ...log,
        },
      ])
    }

    const handleError = (event) => addLog(event.detail ?? {})
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        setIsOpen((currentIsOpen) => !currentIsOpen)
      }
    }
    const originalConsoleError = console.error

    console.error = (...args) => {
      originalConsoleError(...args)
      addLog({
        message: args.map(stringifyConsoleValue).join(' '),
        type: 'error',
      })
    }

    window.addEventListener('nexus-error', handleError)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      console.error = originalConsoleError
      window.removeEventListener('nexus-error', handleError)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.type === filter)

  const exportLogs = () => {
    const content = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${String(log.type).toUpperCase()}] ${log.message}`,
      )
      .join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `nexus-debug-${Date.now()}.log`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <div className="debug-title">
          <Bug size={14} color="var(--accent-orange)" />
          <span>NEXUS Debug Console</span>
          <span className="debug-count">{logs.length}</span>
        </div>
        <div className="debug-actions">
          <select
            className="debug-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="api">API</option>
            <option value="component">Components</option>
            <option value="warning">Warnings</option>
          </select>
          <button className="debug-action-btn" type="button" title="Export logs" onClick={exportLogs}>
            <Download size={12} />
          </button>
          <button className="debug-action-btn" type="button" title="Clear logs" onClick={() => setLogs([])}>
            <Trash2 size={12} />
          </button>
          <button className="debug-action-btn" type="button" aria-label="Close debug console" onClick={() => setIsOpen(false)}>
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="debug-logs">
        {filteredLogs.length === 0 && (
          <div className="debug-empty">No logs yet</div>
        )}
        {filteredLogs.map((log) => (
          <div className="debug-log-entry" key={log.id}>
            <span className="debug-log-time">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className="debug-log-type"
              style={{ color: logColors[log.type] || logColors.info }}
            >
              {String(log.type).toUpperCase()}
            </span>
            <span className="debug-log-message">{log.message}</span>
            {log.component && (
              <span className="debug-log-component">{log.component}</span>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <div className="debug-footer">
        Press Ctrl+Shift+D to toggle •{' '}
        {logs.filter((log) => log.type === 'error').length} errors
      </div>
    </div>
  )
}
