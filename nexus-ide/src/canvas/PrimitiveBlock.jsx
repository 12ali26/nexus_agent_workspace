import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { Rnd } from 'react-rnd'
import { BlockErrorBoundary } from '../components/ErrorBoundary'
import { LoadingState } from '../components/BlockStates'
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
import { getPrimitiveDefinition } from '../config/primitives'
import { getPrimitiveLabel } from '../primitives/primitivePayloads'
import { useSettings } from '../settings/useSettings'
import { useTerminalPanel } from '../terminal/useTerminalPanel'
import { useToast } from '../toast/useToast'

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

const dataBlockTypes = new Set(['table', 'stats-block', 'regression'])

function getBlockSummary(block) {
  const props = block.data?.props ?? {}

  if (block.type === 'table') {
    const rows = props.data?.length ?? props.rows?.length ?? 0
    const columns =
      props.columns?.length ??
      (rows && props.data?.[0] ? Object.keys(props.data[0]).length : 0)

    return rows || columns ? `${rows} rows × ${columns} cols` : 'Data table'
  }

  if (block.type === 'chart') {
    const xKey = props.xKey ?? 'x'
    const yKey = props.lineKey ?? props.yKey ?? 'y'
    return `${xKey} by ${yKey}`
  }

  if (block.type === 'stats-block') {
    return props.selectedColumn ? `stats: ${props.selectedColumn}` : 'Stats'
  }

  if (block.type === 'regression') {
    return props.rSquared ? `R² = ${Number(props.rSquared).toFixed(3)}` : 'Regression'
  }

  if (block.type === 'monte-carlo') {
    return props.simulations ? `${props.simulations} sims` : 'Simulation'
  }

  if (block.type === 'notebook') {
    return props.cells?.length ? `${props.cells.length} cells` : 'Notebook'
  }

  return getPrimitiveLabel(block.type)
}

function BlockMenuItem({ children, onClick }) {
  return (
    <button className="block-menu-item" type="button" onClick={onClick}>
      {children}
    </button>
  )
}

function PrimitiveBlock({
  block,
  mode = 'float',
  onDataChange,
  onDuplicate,
  onFocus,
  onLayoutChange,
  onRemove,
  onRename,
  onReorder,
}) {
  const PrimitiveComponent = primitiveComponents[block.type]
  const { exportSettings } = useSettings()
  const { clearOutput } = useTerminalPanel()
  const showToast = useToast()
  const [headerControls, setHeaderControls] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const registerHeaderControls = useCallback(
    (controls) => setHeaderControls(controls),
    [],
  )
  const primitiveDefinition = getPrimitiveDefinition(block.type)
  const PrimitiveIcon = primitiveDefinition?.icon
  const blockTitle = block.data?.title ?? getPrimitiveLabel(block.type)
  const blockSummary = useMemo(() => getBlockSummary(block), [block])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    const handlePointerDown = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isMenuOpen])

  if (!PrimitiveComponent) {
    return null
  }

  const stopHeaderAction = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const renameBlock = () => {
    const nextTitle = window.prompt('Rename block', blockTitle)

    if (nextTitle) {
      onRename?.(block.id, nextTitle)
    }

    setIsMenuOpen(false)
  }

  const toastPlaceholder = (message) => {
    showToast(message)
    setIsMenuOpen(false)
  }

  const closeBlock = () => {
    setIsMenuOpen(false)
    onRemove(block.id)
  }

  const blockArticle = (
    <article
      className={`primitive-block${
        mode === 'float' ? '' : ` primitive-block-${mode}`
      }${block.meta?.highlight ? ' primitive-block-highlight' : ''}${
        isCollapsed ? ' is-collapsed' : ''
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
        onClick={() => {
          if (isCollapsed) {
            setIsCollapsed(false)
          }
        }}
        onDragStart={(event) => {
          if (mode !== 'grid') {
            return
          }

          event.dataTransfer.setData('text/plain', block.id)
        }}
      >
        <span className="block-drag-handle" aria-hidden="true">
          ⠿
        </span>
        {PrimitiveIcon && (
          <PrimitiveIcon
            className="block-type-icon"
            size={14}
            strokeWidth={1.9}
            style={{ color: primitiveDefinition.color }}
            aria-hidden="true"
          />
        )}
        <span className="block-title" title={blockTitle}>
          {blockTitle}
        </span>
        {isCollapsed && <span className="block-summary">{blockSummary}</span>}
        {block.meta?.source === 'agent' && (
          <span className="primitive-agent-badge">Agent</span>
        )}
        <div className="primitive-block-header-actions block-controls">
          {headerControls}
          <button
            className="block-icon-btn"
            type="button"
            aria-label={isCollapsed ? 'Expand block' : 'Collapse block'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            onMouseDown={stopHeaderAction}
            onClick={(event) => {
              stopHeaderAction(event)
              setIsCollapsed((current) => !current)
            }}
          >
            {isCollapsed ? (
              <ChevronRight size={15} strokeWidth={1.9} />
            ) : (
              <ChevronDown size={15} strokeWidth={1.9} />
            )}
          </button>
          <div className="block-options-anchor" ref={menuRef}>
            <button
              className="block-icon-btn"
              type="button"
              aria-label="Block options"
              aria-expanded={isMenuOpen}
              title="Options"
              onMouseDown={stopHeaderAction}
              onClick={(event) => {
                stopHeaderAction(event)
                setIsMenuOpen((current) => !current)
              }}
            >
              <MoreHorizontal size={16} strokeWidth={1.9} />
            </button>
            {isMenuOpen && (
              <div
                className="block-options-menu"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <BlockMenuItem onClick={renameBlock}>Rename</BlockMenuItem>
                <BlockMenuItem
                  onClick={() => {
                    setIsMenuOpen(false)
                    onDuplicate?.(block.id)
                  }}
                >
                  Duplicate
                </BlockMenuItem>
                {dataBlockTypes.has(block.type) && (
                  <BlockMenuItem
                    onClick={() => toastPlaceholder('CSV export coming soon')}
                  >
                    Export as CSV
                  </BlockMenuItem>
                )}
                {block.type === 'code-editor' && (
                  <>
                    <BlockMenuItem
                      onClick={() => toastPlaceholder('Run from menu coming soon')}
                    >
                      Run
                    </BlockMenuItem>
                    <BlockMenuItem
                      onClick={() => {
                        clearOutput()
                        setIsMenuOpen(false)
                      }}
                    >
                      Clear Output
                    </BlockMenuItem>
                    <BlockMenuItem
                      onClick={() =>
                        toastPlaceholder('Language menu coming soon')
                      }
                    >
                      Change Language
                    </BlockMenuItem>
                  </>
                )}
                {block.type === 'notebook' && (
                  <>
                    <BlockMenuItem
                      onClick={() => toastPlaceholder('Run All from menu coming soon')}
                    >
                      Run All
                    </BlockMenuItem>
                    <BlockMenuItem
                      onClick={() =>
                        toastPlaceholder('Notebook outputs can be cleared in the header')
                      }
                    >
                      Clear All Outputs
                    </BlockMenuItem>
                    <BlockMenuItem
                      onClick={() =>
                        toastPlaceholder('Use the notebook export button')
                      }
                    >
                      Export as PDF
                    </BlockMenuItem>
                  </>
                )}
                <BlockMenuItem
                  onClick={() => toastPlaceholder('Block PNG export coming soon')}
                >
                  Export block as PNG
                </BlockMenuItem>
                <div className="block-menu-divider" />
                <BlockMenuItem onClick={closeBlock}>Close</BlockMenuItem>
              </div>
            )}
          </div>
          <button
            className="block-icon-btn primitive-close"
            type="button"
            aria-label={`Remove ${blockTitle}`}
            title="Close"
            onMouseDown={stopHeaderAction}
            onClick={(event) => {
              stopHeaderAction(event)
              onRemove(block.id)
            }}
          >
            <X size={15} strokeWidth={1.9} />
          </button>
        </div>
      </header>
      <div
        className={`primitive-block-content${
          isCollapsed ? ' is-collapsed' : ''
        }`}
      >
        <Suspense
          fallback={
            <LoadingState message="Loading renderer..." />
          }
        >
          <BlockErrorBoundary blockType={block.type}>
            <PrimitiveComponent
              {...block.data.props}
              blockId={block.id}
              blockTitle={blockTitle}
              exportSettings={exportSettings}
              headerControls={registerHeaderControls}
              updateBlockData={onDataChange}
            />
          </BlockErrorBoundary>
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
      minHeight={isCollapsed ? 28 : 200}
      minWidth={300}
      position={block.position}
      size={
        isCollapsed
          ? {
              width: block.size.width,
              height: 28,
            }
          : block.size
      }
      style={{ zIndex: block.zIndex }}
      enableResizing={!isCollapsed}
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
