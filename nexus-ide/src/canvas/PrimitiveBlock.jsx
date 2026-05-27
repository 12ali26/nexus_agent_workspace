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
import TimeSeriesBlockPrimitive from '../primitives/TimeSeriesBlockPrimitive'
import { useSettings } from '../settings/useSettings'

const CodeEditorPrimitive = lazy(
  () => import('../primitives/CodeEditorPrimitive'),
)

const NotebookPrimitive = lazy(() => import('../primitives/NotebookPrimitive'))

const MonteCarloBlockPrimitive = lazy(
  () => import('../primitives/MonteCarloBlockPrimitive'),
)

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
  'monte-carlo': MonteCarloBlockPrimitive,
  notebook: NotebookPrimitive,
  'parameter-node': ParameterNodePrimitive,
  'progress-step': ProgressStepPrimitive,
  'prose-block': ProseBlockPrimitive,
  regression: RegressionBlockPrimitive,
  'stats-block': StatsBlockPrimitive,
  table: TablePrimitive,
  'terminal-output': TerminalOutputPrimitive,
  'time-series': TimeSeriesBlockPrimitive,
}

function PrimitiveBlock({
  block,
  mode = 'float',
  onFocus,
  onLayoutChange,
  onRemove,
  onReorder,
}) {
  const PrimitiveComponent = primitiveComponents[block.type]
  const { exportSettings } = useSettings()
  const [headerControls, setHeaderControls] = useState(null)
  const registerHeaderControls = useCallback(
    (controls) => setHeaderControls(controls),
    [],
  )

  if (!PrimitiveComponent) {
    return null
  }

  const blockArticle = (
    <article
      className={`primitive-block${
        mode === 'float' ? '' : ` primitive-block-${mode}`
      }`}
      onDragOver={(event) => {
        if (mode === 'grid') {
          event.preventDefault()
        }
      }}
      onDrop={(event) => {
        if (mode !== 'grid') {
          return
        }

        event.preventDefault()
        onReorder?.(event.dataTransfer.getData('text/plain'), block.id)
      }}
    >
      <header
        className="primitive-block-header"
        draggable={mode === 'grid'}
        onDragStart={(event) => {
          if (mode !== 'grid') {
            return
          }

          event.dataTransfer.setData('text/plain', block.id)
        }}
      >
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
            blockTitle={block.data.title}
            exportSettings={exportSettings}
            headerControls={registerHeaderControls}
          />
        </Suspense>
      </div>
    </article>
  )

  if (mode !== 'float') {
    return blockArticle
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
      {blockArticle}
    </Rnd>
  )
}

export default PrimitiveBlock
