import { useWorkspaceData } from '../context/useWorkspaceData'

function formatCount(value, label) {
  return `${Number(value).toLocaleString()} ${label}${value === 1 ? '' : 's'}`
}

function WorkspacePanel() {
  const {
    activeDatasetId,
    datasets,
    removeDataset,
    setActiveDataset,
  } = useWorkspaceData()

  return (
    <section className="workspace-panel" aria-label="Workspace data">
      <header className="panel-header">DATA</header>

      {datasets.length ? (
        <div className="workspace-list dataset-list">
          {datasets.map((dataset) => {
            const isActive = dataset.id === activeDatasetId

            return (
              <article
                className={`workspace-card dataset-card${
                  isActive ? ' is-active' : ''
                }`}
                key={dataset.id}
              >
                <button
                  className="dataset-card-main"
                  type="button"
                  onClick={() => setActiveDataset(dataset.id)}
                >
                  <div className="workspace-card-copy">
                    <h2>{dataset.name}</h2>
                    <p title={dataset.columns.join(', ')}>
                      {formatCount(dataset.rows.length, 'row')} ·{' '}
                      {formatCount(dataset.columns.length, 'column')}
                    </p>
                  </div>
                  <span className="dataset-source">{dataset.source}</span>
                </button>

                <div className="dataset-column-preview">
                  {dataset.columns.slice(0, 4).map((column) => (
                    <span key={column}>{column}</span>
                  ))}
                  {dataset.columns.length > 4 && (
                    <span>+{dataset.columns.length - 4}</span>
                  )}
                </div>

                <div className="dataset-card-actions">
                  {isActive && <span className="dataset-active-badge">Active</span>}
                  <button
                    className="workspace-action dataset-remove"
                    type="button"
                    onClick={() => removeDataset(dataset.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="panel-empty">
          No data loaded yet. Use Open File to add CSV or JSON datasets.
        </p>
      )}
    </section>
  )
}

export default WorkspacePanel
