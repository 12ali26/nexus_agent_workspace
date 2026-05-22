import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'

function WorkspacePanel() {
  const {
    activateWorkspace,
    activeWorkspace,
    availableWorkspaces,
    installWorkspace,
  } = useWorkspaceRegistry()

  return (
    <section className="workspace-panel" aria-label="Workspaces">
      <header className="panel-header">WORKSPACES</header>

      <div className="workspace-list">
        {availableWorkspaces.map((workspace) => {
          const isActive = activeWorkspace?.id === workspace.id

          return (
            <article
              className={`workspace-card${isActive ? ' is-active' : ''}`}
              key={workspace.id}
            >
              <div className="workspace-card-copy">
                <h2>{workspace.name}</h2>
                <p title={workspace.description}>{workspace.description}</p>
              </div>

              {workspace.installed ? (
                <button
                  className="workspace-action"
                  type="button"
                  onClick={() => activateWorkspace(workspace.id)}
                >
                  Activate
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
          )
        })}
      </div>
    </section>
  )
}

export default WorkspacePanel
