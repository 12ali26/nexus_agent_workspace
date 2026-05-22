import { useRef, useState } from 'react'
import './App.css'
import ActivityBar from './ActivityBar'
import ClearCanvasButton from './ClearCanvasButton'
import FileOpenButton from './FileOpenButton'
import WorkspaceCanvas from './WorkspaceCanvas'
import { panels } from './panels'
import { WorkspaceRegistryProvider } from './registry/WorkspaceRegistryContext'
import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'
import { RenderBlocksProvider } from './renderBlocks/RenderBlocksProvider'

function NexusShell() {
  const [activePanel, setActivePanel] = useState('workspaces')
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)
  const { activeWorkspace } = useWorkspaceRegistry()
  const ActivePanel = activePanel ? panels[activePanel] : null

  const showToast = (message) => {
    setToastMessage(message)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  return (
    <RenderBlocksProvider
      key={activeWorkspace?.id ?? 'no-workspace'}
      workspaceId={activeWorkspace?.id}
    >
      <div className="nexus-shell">
        <header className="top-bar">
          <div className="brand-mark" aria-hidden="true">
            N
          </div>
          <div className="brand-text">NEXUS IDE</div>
          <FileOpenButton onToast={showToast} />
          <ClearCanvasButton onToast={showToast} />
        </header>

        <div className={`workbench${activePanel ? ' sidebar-open' : ''}`}>
          <aside className="activity-sidebar" aria-label="Primary navigation">
            <ActivityBar
              activePanel={activePanel}
              onPanelChange={setActivePanel}
            />

            {ActivePanel && <ActivePanel />}
          </aside>

          <WorkspaceCanvas />
        </div>

        <footer className="status-bar">
          <span>{activeWorkspace?.name ?? 'No Workspace Loaded'}</span>
          <span>No Agent Connected</span>
        </footer>

        {toastMessage && <div className="toast">{toastMessage}</div>}
      </div>
    </RenderBlocksProvider>
  )
}

function App() {
  return (
    <WorkspaceRegistryProvider>
      <NexusShell />
    </WorkspaceRegistryProvider>
  )
}

export default App
