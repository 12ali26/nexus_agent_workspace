import { useEffect, useRef, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { getPrimitiveDefinition } from '../config/primitives'
import { getPrimitiveLabel } from '../primitives/primitivePayloads'
import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import PrimitiveBlock from './PrimitiveBlock'

function truncateTitle(title) {
  return title.length > 12 ? `${title.slice(0, 12)}…` : title
}

function BlockCanvas({ canvasMode, emptyMessage }) {
  const {
    focusPrimitiveBlock,
    duplicatePrimitiveBlock,
    primitiveBlocks,
    renamePrimitiveBlock,
    removePrimitiveBlock,
    reorderPrimitiveBlocks,
    updatePrimitiveBlockLayout,
  } = useRenderBlocks()
  const [activeFocusBlockId, setActiveFocusBlockId] = useState('')
  const previousBlockCountRef = useRef(0)

  useEffect(() => {
    let timeoutId

    if (!primitiveBlocks.length) {
      timeoutId = window.setTimeout(() => setActiveFocusBlockId(''), 0)
      previousBlockCountRef.current = 0
      return () => window.clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => setActiveFocusBlockId((currentBlockId) => {
      const lastBlockId = primitiveBlocks[primitiveBlocks.length - 1].id
      const hasCurrentBlock = primitiveBlocks.some(
        (block) => block.id === currentBlockId,
      )
      const hasNewBlock = primitiveBlocks.length > previousBlockCountRef.current

      return hasNewBlock || !hasCurrentBlock ? lastBlockId : currentBlockId
    }), 0)
    previousBlockCountRef.current = primitiveBlocks.length

    return () => window.clearTimeout(timeoutId)
  }, [primitiveBlocks])

  const activeFocusBlock =
    primitiveBlocks.find((block) => block.id === activeFocusBlockId) ??
    primitiveBlocks[0]

  const handleDragOver = (event) => {
    if (event.dataTransfer.types.includes('application/x-nexus-primitive')) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (event) => {
    const primitiveType = event.dataTransfer.getData(
      'application/x-nexus-primitive',
    )

    if (!primitiveType) {
      return
    }

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()

    window.dispatchEvent(
      new CustomEvent('nexus-add-primitive', {
        detail: {
          position: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          },
          primitiveType,
          source: 'drag',
        },
      }),
    )
  }

  return (
    <div
      id="nexus-canvas"
      className={`domain-canvas-body canvas-mode-${canvasMode}${
        primitiveBlocks.length ? ' has-blocks' : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {primitiveBlocks.length && canvasMode === 'focus' ? (
        <div className="focus-canvas-shell">
          <div className="focus-tab-bar" aria-label="Canvas focus tabs">
            {primitiveBlocks.map((block) => (
              <FocusTab
                block={block}
                isActive={activeFocusBlock?.id === block.id}
                key={block.id}
                onClose={() => removePrimitiveBlock(block.id)}
                onSelect={() => setActiveFocusBlockId(block.id)}
              />
            ))}
          </div>
          {activeFocusBlock && (
            <PrimitiveBlock
              block={activeFocusBlock}
              mode="focus"
              onFocus={focusPrimitiveBlock}
              onLayoutChange={updatePrimitiveBlockLayout}
              onDuplicate={duplicatePrimitiveBlock}
              onRemove={removePrimitiveBlock}
              onRename={renamePrimitiveBlock}
            />
          )}
        </div>
      ) : primitiveBlocks.length ? (
        primitiveBlocks.map((block) => (
          <PrimitiveBlock
            block={block}
            key={block.id}
            mode={canvasMode}
            onFocus={focusPrimitiveBlock}
            onLayoutChange={updatePrimitiveBlockLayout}
            onDuplicate={duplicatePrimitiveBlock}
            onRemove={removePrimitiveBlock}
            onRename={renamePrimitiveBlock}
            onReorder={reorderPrimitiveBlocks}
          />
        ))
      ) : (
        <div className="canvas-empty-picker-hint">
          <LayoutGrid size={32} strokeWidth={1.7} />
          <p>{emptyMessage}</p>
          <span>or type <code>nex add [primitive]</code> in the terminal</span>
        </div>
      )}
    </div>
  )
}

function FocusTab({ block, isActive, onClose, onSelect }) {
  const primitiveDefinition = getPrimitiveDefinition(block.type)
  const Icon = primitiveDefinition?.icon
  const title = block.data?.title ?? getPrimitiveLabel(block.type)

  return (
    <div className={`focus-tab${isActive ? ' is-active' : ''}`}>
      <button
        className="focus-tab-main"
        type="button"
        title={title}
        onClick={onSelect}
      >
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.9}
            style={{ color: primitiveDefinition.color }}
            aria-hidden="true"
          />
        )}
        <strong>{truncateTitle(title)}</strong>
      </button>
      <button
        className="focus-tab-close"
        type="button"
        aria-label={`Remove ${title}`}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}

export default BlockCanvas
