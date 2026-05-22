import { useState } from 'react'
import { getPrimitiveLabel } from '../primitives/primitivePayloads'
import { usePackRegistry } from '../registry/usePackRegistry'

function ExtensionSection({ onInstall, onUninstall, packs, title }) {
  if (!packs.length) {
    return null
  }

  return (
    <section className="extension-section" aria-label={title}>
      <h2 className="extension-section-heading">{title}</h2>
      <div className="workspace-list extension-list">
        {packs.map((pack) => (
          <article className="workspace-card extension-card" key={pack.id}>
            <div className="workspace-card-copy">
              <h3>{pack.name}</h3>
              <p title={pack.description}>{pack.description}</p>
            </div>

            <dl className="extension-meta">
              <div>
                <dt>Version</dt>
                <dd>{pack.version}</dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{pack.author}</dd>
              </div>
            </dl>

            <div className="extension-renderers" aria-label="Included primitives">
              {pack.primitives.map((primitive) => (
                <span className="extension-renderer-chip" key={primitive}>
                  {getPrimitiveLabel(primitive)}
                </span>
              ))}
            </div>

            {pack.installed ? (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onUninstall(pack.id)}
              >
                Uninstall
              </button>
            ) : (
              <button
                className="workspace-action"
                type="button"
                onClick={() => onInstall(pack.id)}
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
  const { availablePacks, installPack, uninstallPack } = usePackRegistry()
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredPacks = availablePacks.filter((pack) =>
    pack.name.toLowerCase().includes(normalizedSearchValue),
  )
  const installedPacks = filteredPacks.filter((pack) => pack.installed)
  const availableExtensionPacks = filteredPacks.filter((pack) => !pack.installed)

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
          packs={installedPacks}
          onInstall={installPack}
          onUninstall={uninstallPack}
        />
        <ExtensionSection
          title="Available"
          packs={availableExtensionPacks}
          onInstall={installPack}
          onUninstall={uninstallPack}
        />
        {!filteredPacks.length && <p className="panel-empty">No packs found</p>}
      </div>
    </section>
  )
}

export default ExtensionsPanel
