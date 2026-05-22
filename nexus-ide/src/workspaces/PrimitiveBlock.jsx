import { lazy, Suspense } from 'react'
import { Rnd } from 'react-rnd'
import AnnotationPrimitive from '../primitives/AnnotationPrimitive'
import AssumptionFlagPrimitive from '../primitives/AssumptionFlagPrimitive'
import ChartPrimitive from '../primitives/ChartPrimitive'
import EquationPrimitive from '../primitives/EquationPrimitive'
import ProgressStepPrimitive from '../primitives/ProgressStepPrimitive'
import TablePrimitive from '../primitives/TablePrimitive'

const ThreeObjectPrimitive = lazy(
  () => import('../primitives/ThreeObjectPrimitive'),
)

const primitiveComponents = {
  '3d-object': ThreeObjectPrimitive,
  annotation: AnnotationPrimitive,
  'assumption-flag': AssumptionFlagPrimitive,
  chart: ChartPrimitive,
  equation: EquationPrimitive,
  'progress-step': ProgressStepPrimitive,
  table: TablePrimitive,
}

function PrimitiveBlock({ block, onFocus, onLayoutChange, onRemove }) {
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
      style={{ zIndex: block.zIndex }}
      onDragStart={() => onFocus(block.id)}
      onDragStop={(_, dragData) =>
        onLayoutChange(block.id, {
          position: {
            x: dragData.x,
            y: dragData.y,
          },
        })
      }
      onMouseDown={() => onFocus(block.id)}
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
          <Suspense
            fallback={
              <div className="primitive-loading">Loading 3D renderer...</div>
            }
          >
            <PrimitiveComponent {...block.data.props} />
          </Suspense>
        </div>
      </article>
    </Rnd>
  )
}

export default PrimitiveBlock
