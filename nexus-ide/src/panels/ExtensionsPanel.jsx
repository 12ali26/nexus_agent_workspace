import { useState } from 'react'
import { useWorkspaceRegistry } from '../registry/useWorkspaceRegistry'
import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'

function formatRendererName(renderer) {
  return renderer
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ExtensionSection({ title, workspaces, onInstall, onUninstall }) {
  if (!workspaces.length) {
    return null
  }

  return (
    <section className="extension-section" aria-label={title}>
      <h2 className="extension-section-heading">{title}</h2>
      <div className="workspace-list extension-list">
        {workspaces.map((workspace) => (
          <article className="workspace-card extension-card" key={workspace.id}>
            <div className="workspace-card-copy">
              <h3>{workspace.name}</h3>
              <p title={workspace.description}>{workspace.description}</p>
            </div>

            <dl className="extension-meta">
              <div>
                <dt>Version</dt>
                <dd>{workspace.version}</dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{workspace.author}</dd>
              </div>
            </dl>

            <div className="extension-renderers" aria-label="Included renderers">
              {workspace.renderers.map((renderer) => (
                <span className="extension-renderer-chip" key={renderer}>
                  {formatRendererName(renderer)}
                </span>
              ))}
            </div>

            {workspace.installed ? (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onUninstall(workspace.id)}
              >
                Uninstall
              </button>
            ) : (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onInstall(workspace.id)}
              >
                Install
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function ExtensionsPanel() {
  const {
    activeWorkspace,
    availableWorkspaces,
    installWorkspace,
    uninstallWorkspace,
  } = useWorkspaceRegistry()
  const { clearCanvas } = useRenderBlocks()
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredWorkspaces = availableWorkspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(normalizedSearchValue),
  )
  const installedWorkspaces = filteredWorkspaces.filter(
    (workspace) => workspace.installed,
  )
  const availableExtensionWorkspaces = filteredWorkspaces.filter(
    (workspace) => !workspace.installed,
  )

  const handleUninstall = (workspaceId) => {
    if (activeWorkspace?.id === workspaceId) {
      clearCanvas()
    }

    uninstallWorkspace(workspaceId)
  }

  // Remote registry fetching will plug in here later for marketplace search.
  return (
    <section className="workspace-panel" aria-label="Extensions">
      <header className="panel-header">EXTENSIONS</header>

      <div className="panel-search">
        <input
          type="search"
          placeholder="Search extensions"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="extensions-scroll">
        <ExtensionSection
          title="Installed"
          workspaces={installedWorkspaces}
          onInstall={installWorkspace}
          onUninstall={handleUninstall}
        />
        <ExtensionSection
          title="Available"
          workspaces={availableExtensionWorkspaces}
          onInstall={installWorkspace}
          onUninstall={handleUninstall}
        />
        {!filteredWorkspaces.length && (
          <p className="panel-empty">No extensions found</p>
        )}
      </div>
    </section>
  )
}

export default ExtensionsPanel
