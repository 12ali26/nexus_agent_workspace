import { Rnd } from 'react-rnd'
import ChartPrimitive from '../primitives/ChartPrimitive'
import EquationPrimitive from '../primitives/EquationPrimitive'
import TablePrimitive from '../primitives/TablePrimitive'

const primitiveComponents = {
  chart: ChartPrimitive,
  equation: EquationPrimitive,
  table: TablePrimitive,
}

function PrimitiveBlock({ block, onLayoutChange, onRemove }) {
  const PrimitiveComponent = primitiveComponents[block.type]

  if (!PrimitiveComponent) {
    return null
  }

  return (
    <Rnd
      bounds="parent"
      className="primitive-rnd"
      dragHandleClassName="primitive-block-header"
      minHeight={200}
      minWidth={300}
      position={block.position}
      size={block.size}
      onDragStop={(_, dragData) =>
        onLayoutChange(block.id, {
          position: {
            x: dragData.x,
            y: dragData.y,
          },
        })
      }
      onResizeStop={(_, __, ref, ___, position) =>
        onLayoutChange(block.id, {
          position,
          size: {
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          },
        })
      }
    >
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
        <div className="primitive-block-content">
          <PrimitiveComponent {...block.data.props} />
        </div>
      </article>
    </Rnd>
  )
}

export default PrimitiveBlock
