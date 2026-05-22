import { useState } from 'react'
import './App.css'
import WorkspaceCanvas from './WorkspaceCanvas'
import WorkspacePanel from './WorkspacePanel'
import { WorkspaceRegistryProvider } from './registry/WorkspaceRegistryContext'
import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'

const activityItems = [
  {
    label: 'Workspace',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.1l2 2H18.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      </svg>
    ),
  },
  {
    label: 'Extensions',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h3v5H6V6a2 2 0 0 1 2-2Zm5 0h3a2 2 0 0 1 2 2v3h-5V4ZM6 11h5v5H8a2 2 0 0 1-2-2v-3Zm7 0h5v3a2 2 0 0 1-2 2h-3v-5Z" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
  {
    label: 'Agent',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v3" />
        <path d="M8 8h8a3 3 0 0 1 3 3v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4a3 3 0 0 1 3-3Z" />
        <path d="M9 13h.01M15 13h.01M10 16h4" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="m19 13 .1-2 1.8-1.2-2-3.4-2.1.9a7 7 0 0 0-1.7-1L14.8 4h-5.6l-.3 2.3a7 7 0 0 0-1.7 1l-2.1-.9-2 3.4L4.9 11l.1 2-1.8 1.2 2 3.4 2.1-.9a7 7 0 0 0 1.7 1l.3 2.3h5.6l.3-2.3a7 7 0 0 0 1.7-1l2.1.9 2-3.4L19 13Z" />
      </svg>
    ),
  },
]

function NexusShell() {
  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(true)
  const { activeWorkspace } = useWorkspaceRegistry()

  return (
    <div className="nexus-shell">
      <header className="top-bar">
        <div className="brand-mark" aria-hidden="true">
          N
        </div>
        <div className="brand-text">NEXUS IDE</div>
      </header>

      <div className={`workbench${isWorkspacePanelOpen ? ' sidebar-open' : ''}`}>
        <aside className="activity-sidebar" aria-label="Primary navigation">
          <nav className="activity-rail">
            {activityItems.map((item, index) => (
              <button
                className={`activity-button${index === 0 ? ' is-active' : ''}`}
                key={item.label}
                type="button"
                aria-label={item.label}
                title={item.label}
                aria-expanded={
                  item.label === 'Workspace' ? isWorkspacePanelOpen : undefined
                }
                onClick={
                  item.label === 'Workspace'
                    ? () => setIsWorkspacePanelOpen((isOpen) => !isOpen)
                    : undefined
                }
              >
                {item.icon}
              </button>
            ))}
          </nav>

          {isWorkspacePanelOpen && <WorkspacePanel />}
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
