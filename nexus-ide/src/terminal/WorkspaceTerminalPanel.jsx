import { useCallback, useState } from 'react'
import {
  Maximize2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import LiveTerminal from './LiveTerminal'
import { useTerminalPanel } from './useTerminalPanel'
import { useToast } from '../toast/useToast'

function formatDuration(durationMs) {
  if (typeof durationMs !== 'number') {
    return ''
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`
  }

  return `${(durationMs / 1000).toFixed(2)}s`
}

function getLanguageLabel(language) {
  if (!language) {
    return 'Workspace'
  }

  return language.charAt(0).toUpperCase() + language.slice(1)
}

function WorkspaceTerminalPanel() {
  const {
    activeTab,
    clearOutput,
    closePanel,
    outputEntries,
    panelHeight,
    setActiveTab,
    setPanelHeight,
  } = useTerminalPanel()
  const showToast = useToast()
  const [isMaximized, setIsMaximized] = useState(false)
  const [previousHeight, setPreviousHeight] = useState(280)

  const startResize = useCallback(
    (event) => {
      event.preventDefault()
      const startY = event.clientY
      const startHeight = panelHeight

      const handlePointerMove = (moveEvent) => {
        setPanelHeight(startHeight + startY - moveEvent.clientY)
      }

      const stopResize = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', stopResize)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', stopResize)
    },
    [panelHeight, setPanelHeight],
  )

  const clearActivePanel = () => {
    if (activeTab === 'output') {
      clearOutput()
      return
    }

    window.dispatchEvent(new CustomEvent('nexus-terminal-clear'))
  }

  const toggleMaximize = () => {
    if (isMaximized) {
      setPanelHeight(previousHeight)
      setIsMaximized(false)
      return
    }

    setPreviousHeight(panelHeight)
    setPanelHeight(520)
    setIsMaximized(true)
  }

  return (
    <section
      className="workspace-bottom-panel terminal-panel"
      aria-label="Workspace terminal panel"
    >
      <div
        className="workspace-bottom-resizer terminal-resize-handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize terminal panel"
        onPointerDown={startResize}
      />
      <header className="workspace-bottom-panel-header terminal-panel-header">
        <nav className="workspace-bottom-tabs" aria-label="Panel tabs">
          <button
            className={`terminal-tab${
              activeTab === 'terminal' ? ' active' : ''
            }`}
            type="button"
            onClick={() => setActiveTab('terminal')}
          >
            Terminal
          </button>
          <button
            className={`terminal-tab${activeTab === 'output' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </nav>
        <div className="workspace-bottom-actions terminal-header-actions">
          <button
            className="terminal-action-btn"
            type="button"
            aria-label="New terminal session"
            title="New terminal session"
            onClick={() => showToast('Multiple terminal sessions coming soon')}
          >
            <Plus size={15} strokeWidth={1.9} />
          </button>
          <button
            className="terminal-action-btn"
            type="button"
            aria-label={activeTab === 'output' ? 'Clear output' : 'Clear terminal'}
            title={activeTab === 'output' ? 'Clear Output' : 'Clear Terminal'}
            onClick={clearActivePanel}
          >
            <Trash2 size={15} strokeWidth={1.9} />
          </button>
          <button
            className="terminal-action-btn"
            type="button"
            aria-label="Maximize terminal panel"
            title={isMaximized ? 'Restore' : 'Maximize'}
            onClick={toggleMaximize}
          >
            <Maximize2 size={15} strokeWidth={1.9} />
          </button>
          <button
            className="terminal-action-btn"
            type="button"
            aria-label="Close panel"
            title="Close"
            onClick={closePanel}
          >
            <X size={15} strokeWidth={1.9} />
          </button>
        </div>
      </header>
      <div className="workspace-bottom-panel-body">
        {activeTab === 'terminal' ? (
          <LiveTerminal className="workspace-native-terminal" />
        ) : (
          <div className="workspace-output-log output-panel">
            {outputEntries.length ? (
              outputEntries.map((entry) => {
                const isError = entry.tone === 'error'
                const duration = formatDuration(entry.durationMs)

                return (
                  <article
                    className={`workspace-output-entry${
                      isError ? ' is-error' : ''
                    }`}
                    key={entry.id}
                  >
                    <header className="output-run-header">
                      <span>
                        ▶ Run #{entry.runNumber} •{' '}
                        {getLanguageLabel(entry.language)} • {entry.timestamp}
                      </span>
                      {duration && <span className="run-time">{duration}</span>}
                    </header>
                    <pre className={isError ? 'output-stderr' : 'output-stdout'}>
                      {entry.lines.join('\n')}
                    </pre>
                    <footer className={isError ? 'output-error' : 'output-success'}>
                      {isError ? '✗ Exited with error' : '✓ Exited with code 0'}
                    </footer>
                  </article>
                )
              })
            ) : (
              <div className="workspace-output-empty">
                Run code to see output here
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default WorkspaceTerminalPanel
