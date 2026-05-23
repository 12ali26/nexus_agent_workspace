import { useState } from 'react'
import { getPrimitiveLabel } from '../primitives/primitivePayloads'
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

            <div className="extension-chip-group">
              <span className="extension-chip-label">Primitives</span>
              <div className="extension-renderers" aria-label="Included primitives">
                {extension.primitives.map((primitive) => (
                  <span className="extension-renderer-chip" key={primitive}>
                    {getPrimitiveLabel(primitive)}
                  </span>
                ))}
              </div>
            </div>

            <div className="extension-chip-group">
              <span className="extension-chip-label">Capabilities</span>
              <div className="extension-renderers" aria-label="Included capabilities">
                {extension.capabilities.map((capability) => (
                  <span className="extension-capability-chip" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            {extension.installed ? (
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
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredExtensions = availableExtensions.filter((extension) =>
    extension.name.toLowerCase().includes(normalizedSearchValue),
  )
  const installedExtensions = filteredExtensions.filter(
    (extension) => extension.installed,
  )
  const availableUninstalledExtensions = filteredExtensions.filter(
    (extension) => !extension.installed,
  )

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
          title="Installed"
          extensions={installedExtensions}
          onInstall={installExtension}
          onUninstall={uninstallExtension}
        />
        <ExtensionSection
          title="Available"
          extensions={availableUninstalledExtensions}
          onInstall={installExtension}
          onUninstall={uninstallExtension}
        />
        {!filteredExtensions.length && (
          <p className="panel-empty">No extensions found</p>
        )}
      </div>
    </section>
  )
}

export default ExtensionsPanel
