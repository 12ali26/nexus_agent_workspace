import { useCallback, useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Search } from 'lucide-react'
import './App.css'
import ActivityBar from './ActivityBar'
import ClearCanvasButton from './ClearCanvasButton'
import ExportButton from './ExportButton'
import FileOpenButton from './FileOpenButton'
import NewProjectButton from './NewProjectButton'
import WorkspaceCanvas from './WorkspaceCanvas'
import { DebugPanel } from './components/DebugPanel'
import { AppErrorBoundary } from './components/ErrorBoundary'
import { FirstLaunch } from './components/FirstLaunch'
import { ToastSystem } from './components/ToastSystem'
import { UpdateNotification } from './components/UpdateNotification'
import { AgentProvider } from './context/AgentContext'
import { useAgent } from './context/useAgent'
import { ParameterProvider } from './context/ParameterContext'
import { WorkspaceDataProvider } from './context/WorkspaceDataContext'
import { panels } from './panels'
import { PackRegistryProvider } from './registry/PackRegistryContext'
import { usePackRegistry } from './registry/usePackRegistry'
import { RenderBlocksProvider } from './renderBlocks/RenderBlocksProvider'
import { SettingsProvider } from './settings/SettingsContext'
import { useSettings } from './settings/useSettings'
import { TerminalPanelProvider } from './terminal/TerminalPanelContext'
import { useTerminalPanel } from './terminal/useTerminalPanel'
import { ToastContext } from './toast/toastContext'

function TopMenuItem({ children, onClick, shortcut }) {
  return (
    <button className="menu-item" type="button" onClick={onClick}>
      <span>{children}</span>
      {shortcut && <span className="shortcut">{shortcut}</span>}
    </button>
  )
}

function NexusWorkbench() {
  const [activePanel, setActivePanel] = useState('primitives')
  const [isActivitySidebarVisible, setIsActivitySidebarVisible] =
    useState(true)
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false)
  const [isEditingProjectName, setIsEditingProjectName] = useState(false)
  const { activeAgent, isConnected, isThinking } = useAgent()
  const { activeCapabilities, activeProject, setActiveProject } =
    usePackRegistry()
  const { isOpen: isTerminalOpen, openTerminal, closePanel } =
    useTerminalPanel()
  const { theme } = useSettings()
  const ActivePanel = activePanel ? panels[activePanel] : null
  const clearCanvasButtonRef = useRef(null)
  const exportButtonRef = useRef(null)
  const fileOpenButtonRef = useRef(null)
  const newProjectButtonRef = useRef(null)
  const projectNameEditCancelledRef = useRef(false)
  const projectNameInputRef = useRef(null)
  const topMenuRef = useRef(null)
  const [projectNameDraft, setProjectNameDraft] = useState(
    activeProject?.projectName ?? 'Untitled Project',
  )

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    window.dispatchEvent(
      new CustomEvent('nexus-toast', {
        detail: {
          duration,
          message,
          type,
        },
      }),
    )
  }, [])

  const closeMenus = useCallback(() => {
    setIsTopMenuOpen(false)
  }, [])

  const openPrimitivesPanel = useCallback(() => {
    setIsActivitySidebarVisible(true)
    setActivePanel('primitives')
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsActivitySidebarVisible((currentVisibility) => !currentVisibility)
    closeMenus()
  }, [closeMenus])

  const toggleTerminal = useCallback(() => {
    if (isTerminalOpen) {
      closePanel()
    } else {
      openTerminal()
    }
  }, [closePanel, isTerminalOpen, openTerminal])

  const openSettingsPanel = useCallback(() => {
    setIsActivitySidebarVisible(true)
    setActivePanel('settings')
    closeMenus()
  }, [closeMenus])

  const startProjectRename = useCallback(() => {
    setProjectNameDraft(activeProject?.projectName ?? 'Untitled Project')
    setIsEditingProjectName(true)
  }, [activeProject?.projectName])

  const triggerHiddenAction = useCallback(
    (buttonRef) => {
      buttonRef.current?.click()
      closeMenus()
    },
    [closeMenus],
  )

  const saveProjectName = useCallback(() => {
    if (projectNameEditCancelledRef.current) {
      projectNameEditCancelledRef.current = false
      return
    }

    const nextProjectName = projectNameDraft.trim() || 'Untitled Project'

    setProjectNameDraft(nextProjectName)
    setIsEditingProjectName(false)
    setActiveProject({
      ...(activeProject ?? {}),
      projectName: nextProjectName,
    })
  }, [activeProject, projectNameDraft, setActiveProject])

  useEffect(() => {
    if (isEditingProjectName) {
      projectNameInputRef.current?.focus()
      projectNameInputRef.current?.select()
    }
  }, [isEditingProjectName])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        isTopMenuOpen &&
        topMenuRef.current &&
        !topMenuRef.current.contains(event.target)
      ) {
        closeMenus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closeMenus, isTopMenuOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenus()
        setIsEditingProjectName(false)
        return
      }

      if (!event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'o') {
        event.preventDefault()
        fileOpenButtonRef.current?.click()
      } else if (key === 'n') {
        event.preventDefault()
        newProjectButtonRef.current?.click()
      } else if (key === 'e') {
        event.preventDefault()
        exportButtonRef.current?.click()
      } else if (event.key === '\\') {
        event.preventDefault()
        setIsActivitySidebarVisible((currentVisibility) => !currentVisibility)
      } else if (event.key === '`') {
        event.preventDefault()
        toggleTerminal()
      } else if (key === 'p') {
        event.preventDefault()
        openPrimitivesPanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeMenus, openPrimitivesPanel, toggleTerminal])

  return (
    <ToastContext.Provider value={showToast}>
      <div className="nexus-shell" data-theme={theme}>
        <header className="top-bar">
          <div className="top-bar-brand">
            <div className="brand-mark" aria-hidden="true">
              N
            </div>
            <div className="brand-text">NEXUS IDE</div>
          </div>

          <div className="top-bar-project">
            {isEditingProjectName ? (
              <input
                ref={projectNameInputRef}
                className="project-name-input"
                type="text"
                value={projectNameDraft}
                aria-label="Project name"
                onBlur={saveProjectName}
                onChange={(event) => setProjectNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    saveProjectName()
                  } else if (event.key === 'Escape') {
                    projectNameEditCancelledRef.current = true
                    setProjectNameDraft(
                      activeProject?.projectName ?? 'Untitled Project',
                    )
                    setIsEditingProjectName(false)
                  }
                }}
              />
            ) : (
              <button
                className="project-name-button"
                type="button"
                title="Rename project"
                onClick={startProjectRename}
              >
                {activeProject?.projectName ?? 'Untitled Project'}
              </button>
            )}
          </div>

          <div className="top-bar-actions">
            <button
              className="top-icon-btn"
              type="button"
              aria-label="Command palette"
              title="Command Palette"
              onClick={() => showToast('Command Palette coming soon')}
            >
              <Search size={16} strokeWidth={1.9} />
            </button>

            <div className="top-menu-anchor" ref={topMenuRef}>
              <button
                className={`top-icon-btn${isTopMenuOpen ? ' is-active' : ''}`}
                type="button"
                aria-label="Open workspace menu"
                aria-expanded={isTopMenuOpen}
                title="More"
                onClick={() =>
                  setIsTopMenuOpen((currentIsOpen) => !currentIsOpen)
                }
              >
                <MoreHorizontal size={18} strokeWidth={1.9} />
              </button>

              {isTopMenuOpen && (
                <div className="top-menu-dropdown" role="menu">
                  <TopMenuItem
                    shortcut="Ctrl+N"
                    onClick={() => triggerHiddenAction(newProjectButtonRef)}
                  >
                    New Project
                  </TopMenuItem>
                  <TopMenuItem
                    shortcut="Ctrl+O"
                    onClick={() => triggerHiddenAction(fileOpenButtonRef)}
                  >
                    Open File
                  </TopMenuItem>
                  <TopMenuItem
                    shortcut="Ctrl+E"
                    onClick={() => triggerHiddenAction(exportButtonRef)}
                  >
                    Export Canvas
                  </TopMenuItem>
                  <TopMenuItem
                    onClick={() => triggerHiddenAction(clearCanvasButtonRef)}
                  >
                    Clear Canvas
                  </TopMenuItem>
                  <div className="menu-divider" />
                  <TopMenuItem shortcut="Ctrl+\\" onClick={toggleSidebar}>
                    {isActivitySidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                  </TopMenuItem>
                  <div className="menu-divider" />
                  <TopMenuItem onClick={openSettingsPanel}>Settings</TopMenuItem>
                </div>
              )}
            </div>
          </div>

          <div className="top-bar-hidden-actions" aria-hidden="true">
            <NewProjectButton
              buttonRef={newProjectButtonRef}
              buttonClassName="top-bar-hidden-trigger"
            />
            <FileOpenButton
              buttonRef={fileOpenButtonRef}
              buttonClassName="top-bar-hidden-trigger"
              onToast={showToast}
            />
            <ExportButton
              buttonRef={exportButtonRef}
              buttonClassName="top-bar-hidden-trigger"
            />
            <ClearCanvasButton
              buttonRef={clearCanvasButtonRef}
              buttonClassName="top-bar-hidden-trigger"
              onToast={showToast}
            />
          </div>
        </header>

        <div
          className={`workbench${
            isActivitySidebarVisible && activePanel ? ' sidebar-open' : ''
          }${isActivitySidebarVisible ? '' : ' sidebar-collapsed'}`}
        >
          {isActivitySidebarVisible && (
            <aside className="activity-sidebar" aria-label="Primary navigation">
              <ActivityBar
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />

              {ActivePanel && <ActivePanel onClose={() => setActivePanel(null)} />}
            </aside>
          )}

          <WorkspaceCanvas onOpenPrimitivesPanel={openPrimitivesPanel} />
        </div>

        <footer className="status-bar">
          <span className="status-project-name">
            {activeProject?.projectName ?? 'Untitled Project'}
          </span>
          <span className="status-capabilities" title="Active capabilities">
            <span aria-hidden="true">⚡</span>
            {activeCapabilities.length}
          </span>
          <span className="status-agent">
            {isConnected ? (
              <>
                <span className="status-agent-dot" aria-hidden="true" />
                {isThinking
                  ? `${activeAgent.name} — Thinking...`
                  : activeAgent.name}
              </>
            ) : (
              'No Agent Connected'
            )}
          </span>
        </footer>

        <ToastSystem />
        <DebugPanel />
        <UpdateNotification />
      </div>
    </ToastContext.Provider>
  )
}

function NexusShell() {
  return (
    <ParameterProvider>
      <WorkspaceDataProvider>
        <TerminalPanelProvider>
          <RenderBlocksProvider>
            <NexusWorkbench />
          </RenderBlocksProvider>
        </TerminalPanelProvider>
      </WorkspaceDataProvider>
    </ParameterProvider>
  )
}

function App() {
  const [showFirstLaunch, setShowFirstLaunch] = useState(() => {
    try {
      return !localStorage.getItem('nexus_launched')
    } catch {
      return false
    }
  })

  const handleFirstLaunchComplete = useCallback(() => {
    try {
      localStorage.setItem('nexus_launched', 'true')
    } catch {
      // Ignore storage failures and continue into the workspace.
    }
    setShowFirstLaunch(false)
  }, [])

  if (showFirstLaunch) {
    return (
      <AppErrorBoundary>
        <FirstLaunch onComplete={handleFirstLaunchComplete} />
        <ToastSystem />
        <DebugPanel />
      </AppErrorBoundary>
    )
  }

  return (
    <AppErrorBoundary>
      <SettingsProvider>
        <PackRegistryProvider>
          <AgentProvider>
            <NexusShell />
          </AgentProvider>
        </PackRegistryProvider>
      </SettingsProvider>
    </AppErrorBoundary>
  )
}

export default App
