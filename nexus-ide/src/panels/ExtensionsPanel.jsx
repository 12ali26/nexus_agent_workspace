import { useState } from 'react'
import { useActivity } from '../activity/useActivity'
import { usePackRegistry } from '../registry/usePackRegistry'

function ExtensionSection({ extensions, onInstall, onUninstall, title }) {
  if (!extensions.length) {
    return null
  }

  return (
    <section className="extension-section" aria-label={title}>
      <h2 className="extension-section-heading">{title}</h2>
      <div className="workspace-list extension-list">
        {extensions.map((extension) => (
          <article className="workspace-card extension-card" key={extension.id}>
            <div className="workspace-card-copy">
              <h3>{extension.name}</h3>
              <p title={extension.description}>{extension.description}</p>
            </div>

            <dl className="extension-meta">
              <div>
                <dt>Version</dt>
                <dd>{extension.version}</dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{extension.author}</dd>
              </div>
            </dl>

            {extension.core ? (
              <span className="workspace-action is-readonly">Core</span>
            ) : extension.installed ? (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onUninstall(extension.id)}
              >
                Uninstall
              </button>
            ) : (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onInstall(extension.id)}
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
    availableExtensions,
    installExtension,
    uninstallExtension,
  } = usePackRegistry()
  const { logActivity } = useActivity()
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredExtensions = availableExtensions.filter((extension) =>
    extension.name.toLowerCase().includes(normalizedSearchValue),
  )
  const communityExtensions = filteredExtensions.filter(
    (extension) => !extension.core,
  )
  const logExtensionAction = (extensionId, action) => {
    const extension = availableExtensions.find(
      (candidate) => candidate.id === extensionId,
    )

    logActivity({
      metadata: { extensionId },
      summary: `${action === 'install' ? 'Installed' : 'Uninstalled'} extension ${extension?.name ?? extensionId}`,
      type: 'extension',
    })
  }
  const installAndLog = (extensionId) => {
    installExtension(extensionId)
    logExtensionAction(extensionId, 'install')
  }
  const uninstallAndLog = (extensionId) => {
    uninstallExtension(extensionId)
    logExtensionAction(extensionId, 'uninstall')
  }

  // Remote registry fetching will plug in here later for marketplace search.
  return (
    <section className="workspace-panel" aria-label="Extensions">
      <header className="panel-header">EXTENSIONS</header>

      <div className="panel-search">
        <input
          type="search"
          placeholder="Search packs"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="extensions-scroll">
        <ExtensionSection
          title="Community"
          extensions={communityExtensions}
          onInstall={installAndLog}
          onUninstall={uninstallAndLog}
        />
        {!communityExtensions.length && (
          <p className="panel-empty">
            Core primitives are built in. Community extensions will appear here.
          </p>
        )}
      </div>
    </section>
  )
}

export default ExtensionsPanel
