import { useCallback, useEffect, useState } from 'react'
import { Maximize2, Plus, Trash2, X } from 'lucide-react'
import LiveTerminal from './LiveTerminal'
import { useTerminalPanel } from './useTerminalPanel'
import { useToast } from '../toast/useToast'

const maxTerminalSessions = 5

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
    isOpen,
    outputEntries,
    panelHeight,
    setActiveTab,
    setPanelHeight,
  } = useTerminalPanel()
  const showToast = useToast()
  const [activeSessionId, setActiveSessionId] = useState('session-1')
  const [contextMenu, setContextMenu] = useState(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [nextSessionNumber, setNextSessionNumber] = useState(2)
  const [previousHeight, setPreviousHeight] = useState(280)
  const [sessions, setSessions] = useState([
    {
      id: 'session-1',
      label: '1',
    },
  ])

  const startResize = useCallback(
    (event) => {
      if (!isOpen) {
        return
      }

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
    [isOpen, panelHeight, setPanelHeight],
  )

  const addSession = () => {
    if (sessions.length >= maxTerminalSessions) {
      showToast('Maximum 5 terminal sessions')
      return
    }

    const label = String(nextSessionNumber)
    const id = `session-${Date.now()}`

    setSessions((currentSessions) => [
      ...currentSessions,
      {
        id,
        label,
      },
    ])
    setNextSessionNumber((currentNumber) => currentNumber + 1)
    setActiveSessionId(id)
    setActiveTab('terminal')
  }

  const closeSession = (sessionId) => {
    if (sessions.length === 1) {
      showToast('At least one terminal session must stay open')
      setContextMenu(null)
      return
    }

    setSessions((currentSessions) => {
      const remainingSessions = currentSessions.filter(
        (session) => session.id !== sessionId,
      )

      if (activeSessionId === sessionId) {
        setActiveSessionId(remainingSessions[remainingSessions.length - 1].id)
      }

      return remainingSessions
    })
    setContextMenu(null)
  }

  const clearActivePanel = () => {
    if (activeTab === 'output') {
      clearOutput()
      return
    }

    window.dispatchEvent(
      new CustomEvent('nexus-terminal-clear', {
        detail: {
          sessionId: activeSessionId,
        },
      }),
    )
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

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null)

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('keydown', closeContextMenu)

    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('keydown', closeContextMenu)
    }
  }, [])

  return (
    <section
      className={`workspace-bottom-panel terminal-panel${
        isOpen ? '' : ' is-hidden'
      }`}
      aria-hidden={!isOpen}
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

        {activeTab === 'terminal' && (
          <div className="terminal-session-tabs" aria-label="Terminal sessions">
            {sessions.map((session) => (
              <button
                className={`session-tab${
                  activeSessionId === session.id ? ' active' : ''
                }`}
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({
                    sessionId: session.id,
                    x: event.clientX,
                    y: event.clientY,
                  })
                }}
              >
                {session.label}
              </button>
            ))}
            <button
              className="new-session-btn"
              type="button"
              aria-label="New terminal session"
              title="New terminal session"
              onClick={addSession}
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="workspace-bottom-actions terminal-header-actions">
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

      <div className="workspace-bottom-panel-body terminal-body">
        <div
          className="terminal-session-stack"
          style={{
            display: activeTab === 'terminal' ? 'flex' : 'none',
          }}
        >
          {sessions.map((session) => (
            <div
              className="terminal-session-pane"
              key={session.id}
              style={{
                display:
                  activeSessionId === session.id && activeTab === 'terminal'
                    ? 'flex'
                    : 'none',
              }}
            >
              <LiveTerminal
                className="workspace-native-terminal"
                isVisible={
                  isOpen &&
                  activeTab === 'terminal' &&
                  activeSessionId === session.id
                }
                sessionId={session.id}
              />
            </div>
          ))}
        </div>

        <div
          className="workspace-output-log output-panel"
          style={{
            display: activeTab === 'output' ? 'block' : 'none',
          }}
        >
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
                      ▶ Run #{entry.runNumber} • {getLanguageLabel(entry.language)} •{' '}
                      {entry.timestamp}
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
      </div>

      {contextMenu && (
        <div
          className="terminal-session-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => closeSession(contextMenu.sessionId)}
          >
            Close session
          </button>
        </div>
      )}
    </section>
  )
}

export default WorkspaceTerminalPanel
