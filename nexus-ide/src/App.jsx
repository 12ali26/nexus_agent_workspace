import { useState } from 'react'
import './App.css'
import ActivityBar from './ActivityBar'
import WorkspaceCanvas from './WorkspaceCanvas'
import { panels } from './panels'
import { WorkspaceRegistryProvider } from './registry/WorkspaceRegistryContext'
import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'

function NexusShell() {
  const [activePanel, setActivePanel] = useState('workspaces')
  const { activeWorkspace } = useWorkspaceRegistry()
  const ActivePanel = activePanel ? panels[activePanel] : null

  return (
    <div className="nexus-shell">
      <header className="top-bar">
        <div className="brand-mark" aria-hidden="true">
          N
        </div>
        <div className="brand-text">NEXUS IDE</div>
      </header>

      <div className={`workbench${activePanel ? ' sidebar-open' : ''}`}>
        <aside className="activity-sidebar" aria-label="Primary navigation">
          <ActivityBar activePanel={activePanel} onPanelChange={setActivePanel} />

          {ActivePanel && <ActivePanel />}
        </aside>

        <WorkspaceCanvas />
      </div>

      <footer className="status-bar">
        <span>{activeWorkspace?.name ?? 'No Workspace Loaded'}</span>
        <span>No Agent Connected</span>
      </footer>
    </div>
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
