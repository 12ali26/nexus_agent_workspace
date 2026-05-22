import { getPrimitiveLabel } from '../primitives/primitivePayloads'

function PrimitiveToolbar({ onPrimitiveClick, primitiveTypes }) {
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
    </div>
  )
}

export default PrimitiveToolbar
