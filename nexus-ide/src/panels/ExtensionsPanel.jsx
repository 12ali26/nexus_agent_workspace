import { useState } from 'react'
import { useWorkspaceRegistry } from '../registry/useWorkspaceRegistry'

function ExtensionsPanel() {
  const { availableWorkspaces, installWorkspace, uninstallWorkspace } =
    useWorkspaceRegistry()
  const [searchValue, setSearchValue] = useState('')

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

      <div className="workspace-list">
        {availableWorkspaces.map((workspace) => (
          <article className="workspace-card" key={workspace.id}>
            <div className="workspace-card-copy">
              <h2>{workspace.name}</h2>
              <p title={workspace.description}>{workspace.description}</p>
            </div>

            {workspace.installed ? (
              <button
                className="workspace-action"
                type="button"
                onClick={() => uninstallWorkspace(workspace.id)}
              >
                Uninstall
              </button>
            ) : (
              <button
                className="workspace-action"
                type="button"
                onClick={() => installWorkspace(workspace.id)}
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

export default ExtensionsPanel
