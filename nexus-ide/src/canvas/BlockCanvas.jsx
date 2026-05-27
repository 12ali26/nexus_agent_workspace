import { useEffect, useRef, useState } from 'react'
import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import { getPrimitiveLabel } from '../primitives/primitivePayloads'
import PrimitiveBlock from './PrimitiveBlock'

function BlockCanvas({ canvasMode, emptyMessage }) {
  const {
    focusPrimitiveBlock,
    primitiveBlocks,
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

  return (
    <div
      id="nexus-canvas"
      className={`domain-canvas-body canvas-mode-${canvasMode}${
        primitiveBlocks.length ? ' has-blocks' : ''
      }`}
    >
      {primitiveBlocks.length && canvasMode === 'focus' ? (
        <div className="focus-canvas-shell">
          <div className="focus-tab-bar" aria-label="Canvas focus tabs">
            {primitiveBlocks.map((block) => (
              <div
                className={`focus-tab${
                  activeFocusBlock?.id === block.id ? ' is-active' : ''
                }`}
                key={block.id}
              >
                <button
                  className="focus-tab-main"
                  type="button"
                  onClick={() => setActiveFocusBlockId(block.id)}
                >
                  <span>{getPrimitiveLabel(block.type)}</span>
                  <strong>{block.data?.title ?? block.type}</strong>
                </button>
                <button
                  className="focus-tab-close"
                  type="button"
                  aria-label={`Remove ${block.data?.title ?? block.type}`}
                  onClick={() => removePrimitiveBlock(block.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          {activeFocusBlock && (
            <PrimitiveBlock
              block={activeFocusBlock}
              mode="focus"
              onFocus={focusPrimitiveBlock}
              onLayoutChange={updatePrimitiveBlockLayout}
              onRemove={removePrimitiveBlock}
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
            onRemove={removePrimitiveBlock}
            onReorder={reorderPrimitiveBlocks}
          />
        ))
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  )
}

export default BlockCanvas
