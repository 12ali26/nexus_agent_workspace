import { getPrimitiveLabel } from '../primitives/primitivePayloads'

function PrimitiveToolbar({ onPrimitiveClick, onTerminalClick, primitiveTypes }) {
  return (
    <div className="workspace-toolbar" aria-label="Available primitives">
      {primitiveTypes.map((primitiveType) => (
        <button
          className="renderer-button"
          key={primitiveType}
          type="button"
          onClick={() => onPrimitiveClick?.(primitiveType)}
        >
          {getPrimitiveLabel(primitiveType)}
        </button>
      ))}
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
