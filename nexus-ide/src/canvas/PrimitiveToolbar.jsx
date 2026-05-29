import {
  Database,
  GalleryHorizontal,
  LayoutGrid,
  Maximize2,
  TerminalSquare,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sanitizeDataName } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'

const canvasModes = [
  { icon: GalleryHorizontal, id: 'float', label: 'Float' },
  { icon: LayoutGrid, id: 'grid', label: 'Grid' },
  { icon: Maximize2, id: 'focus', label: 'Focus' },
]

function PrimitiveToolbar({
  canvasMode,
  onCanvasModeChange,
  onPrimitivePanelClick,
  onTerminalClick,
}) {
  const { datasetAliases } = useWorkspaceData()
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false)
  const dataMenuRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        isDataMenuOpen &&
        dataMenuRef.current &&
        !dataMenuRef.current.contains(event.target)
      ) {
        setIsDataMenuOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDataMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDataMenuOpen])

  return (
    <div className="workspace-toolbar" aria-label="Workspace controls">
      <button
        className="toolbar-icon-btn"
        type="button"
        aria-label="Open primitives"
        title="Primitives"
        onClick={onPrimitivePanelClick}
      >
        <LayoutGrid size={16} strokeWidth={1.9} />
      </button>

      <div className="workspace-data-menu-anchor" ref={dataMenuRef}>
        <button
          className={`toolbar-icon-btn${isDataMenuOpen ? ' is-active' : ''}`}
          type="button"
          aria-label="Available data"
          aria-expanded={isDataMenuOpen}
          title="Available Data"
          onClick={() => setIsDataMenuOpen((currentValue) => !currentValue)}
        >
          <Database size={16} strokeWidth={1.9} />
        </button>

        {isDataMenuOpen && (
          <div className="workspace-data-menu" role="menu">
            <header>
              <strong>Available Data</strong>
              <span>{datasetAliases.length}</span>
            </header>

            {datasetAliases.length ? (
              <div className="workspace-data-list">
                {datasetAliases.map(({ dataset, variableName }) => (
                  <article className="workspace-data-item" key={dataset.id}>
                    <div>
                      <strong>{variableName}</strong>
                      <span>{dataset.name}</span>
                    </div>
                    <small>
                      {Number(dataset.rows.length).toLocaleString()} rows ·{' '}
                      {Number(dataset.columns.length).toLocaleString()} columns
                    </small>
                    <p>
                      {dataset.columns
                        .map((column) => {
                          const sqlColumn = sanitizeDataName(column)

                          return sqlColumn === column
                            ? column
                            : `${column} (${sqlColumn})`
                        })
                        .join(', ')}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="workspace-data-empty">No datasets loaded</p>
            )}
          </div>
        )}
      </div>

      <div className="canvas-mode-actions" aria-label="Canvas modes">
        {canvasModes.map((mode) => {
          const Icon = mode.icon

          return (
            <button
              className={`mode-icon-btn${
                canvasMode === mode.id ? ' is-active' : ''
              }`}
              key={mode.id}
              type="button"
              aria-label={`${mode.label} mode`}
              aria-pressed={canvasMode === mode.id}
              title={mode.label}
              onClick={() => onCanvasModeChange(mode.id)}
            >
              <Icon size={15} strokeWidth={1.9} />
            </button>
          )
        })}
      </div>

      <button
        className="toolbar-icon-btn workspace-terminal-button"
        type="button"
        aria-label="Toggle terminal"
        title="Terminal"
        onClick={onTerminalClick}
      >
        <TerminalSquare size={16} strokeWidth={1.9} />
      </button>
    </div>
  )
}

export default PrimitiveToolbar
