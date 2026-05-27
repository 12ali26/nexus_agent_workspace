import { lazy, Suspense, useCallback, useState } from 'react'
import { Rnd } from 'react-rnd'
import AnnotationPrimitive from '../primitives/AnnotationPrimitive'
import AssumptionFlagPrimitive from '../primitives/AssumptionFlagPrimitive'
import ChartPrimitive from '../primitives/ChartPrimitive'
import EquationPrimitive from '../primitives/EquationPrimitive'
import FormulaBlockPrimitive from '../primitives/FormulaBlockPrimitive'
import ParameterNodePrimitive from '../primitives/ParameterNodePrimitive'
import ProgressStepPrimitive from '../primitives/ProgressStepPrimitive'
import ProseBlockPrimitive from '../primitives/ProseBlockPrimitive'
import RegressionBlockPrimitive from '../primitives/RegressionBlockPrimitive'
import StatsBlockPrimitive from '../primitives/StatsBlockPrimitive'
import TablePrimitive from '../primitives/TablePrimitive'
import TerminalOutputPrimitive from '../primitives/TerminalOutputPrimitive'

const CodeEditorPrimitive = lazy(
  () => import('../primitives/CodeEditorPrimitive'),
)

const NotebookPrimitive = lazy(() => import('../primitives/NotebookPrimitive'))

const ThreeObjectPrimitive = lazy(
  () => import('../primitives/ThreeObjectPrimitive'),
)

const primitiveComponents = {
  '3d-object': ThreeObjectPrimitive,
  annotation: AnnotationPrimitive,
  'assumption-flag': AssumptionFlagPrimitive,
  chart: ChartPrimitive,
  'code-editor': CodeEditorPrimitive,
  equation: EquationPrimitive,
  'formula-block': FormulaBlockPrimitive,
  notebook: NotebookPrimitive,
  'parameter-node': ParameterNodePrimitive,
  'progress-step': ProgressStepPrimitive,
  'prose-block': ProseBlockPrimitive,
  regression: RegressionBlockPrimitive,
  'stats-block': StatsBlockPrimitive,
  table: TablePrimitive,
  'terminal-output': TerminalOutputPrimitive,
}

function PrimitiveBlock({ block, onFocus, onLayoutChange, onRemove }) {
  const PrimitiveComponent = primitiveComponents[block.type]
  const [headerControls, setHeaderControls] = useState(null)
  const registerHeaderControls = useCallback(
    (controls) => setHeaderControls(controls),
    [],
  )

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
          <span>
            {block.data.title}
            {block.meta?.source === 'agent' && (
              <span className="primitive-agent-badge">Agent</span>
            )}
          </span>
          <div className="primitive-block-header-actions">
            {headerControls}
            <button
              className="primitive-close"
              type="button"
              aria-label={`Remove ${block.data.title}`}
              onClick={() => onRemove(block.id)}
            >
              x
            </button>
          </div>
        </header>
        <div className="primitive-block-content">
          <Suspense
            fallback={
              <div className="primitive-loading">Loading renderer...</div>
            }
          >
            <PrimitiveComponent
              {...block.data.props}
              blockId={block.id}
              headerControls={registerHeaderControls}
            />
          </Suspense>
        </div>
      </article>
    </Rnd>
  )
}

export default PrimitiveBlock
