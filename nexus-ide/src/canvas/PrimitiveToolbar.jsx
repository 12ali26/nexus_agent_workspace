const canvasModes = [
  { icon: '⠿', id: 'float', label: 'Float' },
  { icon: '⊞', id: 'grid', label: 'Grid' },
  { icon: '⬜', id: 'focus', label: 'Focus' },
]

function PrimitiveToolbar({
  canvasMode,
  onCanvasModeChange,
  onTerminalClick,
}) {
  return (
    <div className="workspace-toolbar" aria-label="Available primitives">
      <div className="primitive-toolbar-spacer" aria-hidden="true" />
      <div className="canvas-mode-actions" aria-label="Canvas modes">
        {canvasModes.map((mode) => (
          <button
            className={`renderer-button canvas-mode-button${
              canvasMode === mode.id ? ' is-active' : ''
            }`}
            key={mode.id}
            type="button"
            aria-pressed={canvasMode === mode.id}
            onClick={() => onCanvasModeChange(mode.id)}
          >
            <span aria-hidden="true">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
      <button
        className="renderer-button workspace-terminal-button"
        type="button"
        onClick={onTerminalClick}
      >
        Terminal
      </button>
    </div>
  )
}

export default PrimitiveToolbar
