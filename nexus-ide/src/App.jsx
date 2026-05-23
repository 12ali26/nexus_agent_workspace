import { useRef, useState } from 'react'
import './App.css'
import ActivityBar from './ActivityBar'
import ClearCanvasButton from './ClearCanvasButton'
import FileOpenButton from './FileOpenButton'
import NewProjectButton from './NewProjectButton'
import WorkspaceCanvas from './WorkspaceCanvas'
import { panels } from './panels'
import { PackRegistryProvider } from './registry/PackRegistryContext'
import { usePackRegistry } from './registry/usePackRegistry'
import { RenderBlocksProvider } from './renderBlocks/RenderBlocksProvider'
import { SettingsProvider } from './settings/SettingsContext'
import { useSettings } from './settings/useSettings'
import { ToastContext } from './toast/toastContext'

function NexusShell() {
  const [activePanel, setActivePanel] = useState('workspaces')
  const [isActivitySidebarVisible, setIsActivitySidebarVisible] =
    useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)
  const { activeCapabilities, activeProject, installedPacks } = usePackRegistry()
  const { theme } = useSettings()
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
    <RenderBlocksProvider>
      <ToastContext.Provider value={showToast}>
        <div className="nexus-shell" data-theme={theme}>
          <header className="top-bar">
            <div className="brand-mark" aria-hidden="true">
              N
            </div>
            <div className="brand-text">NEXUS IDE</div>
            <button
              className="top-bar-action sidebar-toggle"
              type="button"
              aria-pressed={!isActivitySidebarVisible}
              onClick={() =>
                setIsActivitySidebarVisible(
                  (currentVisibility) => !currentVisibility,
                )
              }
            >
              {isActivitySidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
            <NewProjectButton />
            <FileOpenButton onToast={showToast} />
            <ClearCanvasButton onToast={showToast} />
          </header>

          <div
            className={`workbench${
              isActivitySidebarVisible && activePanel ? ' sidebar-open' : ''
            }${isActivitySidebarVisible ? '' : ' sidebar-collapsed'}`}
          >
            {isActivitySidebarVisible && (
              <aside
                className="activity-sidebar"
                aria-label="Primary navigation"
              >
                <ActivityBar
                  activePanel={activePanel}
                  onPanelChange={setActivePanel}
                />

                {ActivePanel && <ActivePanel />}
              </aside>
            )}

            <WorkspaceCanvas />
          </div>

          <footer className="status-bar">
            <span className="status-pack-list">
              {activeProject?.projectName ? (
                <span className="status-project-name">
                  {activeProject.projectName}
                </span>
              ) : installedPacks.length ? (
                installedPacks.map((pack) => (
                  <span className="status-pack-badge" key={pack.id}>
                    {pack.name}
                  </span>
                ))
              ) : (
                'No Packs Installed'
              )}
            </span>
            <span>{activeCapabilities.length} capabilities active</span>
            <span>No Agent Connected</span>
          </footer>

          {toastMessage && <div className="toast">{toastMessage}</div>}
        </div>
      </ToastContext.Provider>
    </RenderBlocksProvider>
  )
}

function App() {
  return (
    <SettingsProvider>
      <PackRegistryProvider>
        <NexusShell />
      </PackRegistryProvider>
    </SettingsProvider>
  )
}

export default App
