import { usePackRegistry } from '../registry/usePackRegistry'

function WorkspacePanel() {
  const { installedPacks, uninstallPack } = usePackRegistry()

  return (
    <section className="workspace-panel" aria-label="Packs">
      <header className="panel-header">PACKS</header>

      {installedPacks.length ? (
        <div className="workspace-list">
          {installedPacks.map((pack) => (
            <article className="workspace-card" key={pack.id}>
              <div className="workspace-card-copy">
                <h2>{pack.name}</h2>
                <p title={pack.description}>{pack.description}</p>
              </div>

              {pack.core ? (
                <span className="workspace-action is-readonly">Core</span>
              ) : (
                <button
                  className="workspace-action"
                  type="button"
                  onClick={() => uninstallPack(pack.id)}
                >
                  Uninstall
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-empty">No packs installed. Visit Extensions to add packs.</p>
      )}
    </section>
  )
}

export default WorkspacePanel
