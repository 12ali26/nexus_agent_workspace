import {
  GalleryHorizontal,
  LayoutGrid,
  Maximize2,
  TerminalSquare,
} from 'lucide-react'

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
