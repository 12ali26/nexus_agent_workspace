import { useCallback } from 'react'
import LiveTerminal from './LiveTerminal'
import { useTerminalPanel } from './useTerminalPanel'

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

  return (
    <section
      className="workspace-bottom-panel"
      aria-label="Workspace terminal panel"
    >
      <div
        className="workspace-bottom-resizer"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize terminal panel"
        onPointerDown={startResize}
      />
      <header className="workspace-bottom-panel-header">
        <nav className="workspace-bottom-tabs" aria-label="Panel tabs">
          <button
            className={activeTab === 'terminal' ? 'is-active' : undefined}
            type="button"
            onClick={() => setActiveTab('terminal')}
          >
            Terminal
          </button>
          <button
            className={activeTab === 'output' ? 'is-active' : undefined}
            type="button"
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </nav>
        <div className="workspace-bottom-actions">
          {activeTab === 'output' && (
            <button type="button" onClick={clearOutput}>
              Clear Output
            </button>
          )}
          <button type="button" aria-label="Close panel" onClick={closePanel}>
            x
          </button>
        </div>
      </header>
      <div className="workspace-bottom-panel-body">
        {activeTab === 'terminal' ? (
          <LiveTerminal className="workspace-native-terminal" />
        ) : (
          <div className="workspace-output-log">
            {outputEntries.length ? (
              outputEntries.map((entry) => (
                <article
                  className={`workspace-output-entry${
                    entry.tone === 'error' ? ' is-error' : ''
                  }`}
                  key={entry.id}
                >
                  <header>
                    <strong>{entry.title}</strong>
                    <span>{entry.timestamp}</span>
                  </header>
                  <pre>{entry.lines.join('\n')}</pre>
                </article>
              ))
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
