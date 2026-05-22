import ChartPrimitive from '../primitives/ChartPrimitive'
import EquationPrimitive from '../primitives/EquationPrimitive'
import TablePrimitive from '../primitives/TablePrimitive'

const primitiveComponents = {
  chart: ChartPrimitive,
  equation: EquationPrimitive,
  table: TablePrimitive,
}

function PrimitiveBlock({ block, onRemove }) {
  const PrimitiveComponent = primitiveComponents[block.type]

  if (!PrimitiveComponent) {
    return null
  }

  return (
    <article className="primitive-block">
      <header className="primitive-block-header">
        <span>{block.data.title}</span>
        <button
          className="primitive-close"
          type="button"
          aria-label={`Remove ${block.data.title}`}
          onClick={() => onRemove(block.id)}
        >
          x
        </button>
      </header>
      <PrimitiveComponent {...block.data.props} />
    </article>
  )
}

export default PrimitiveBlock
