import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import PrimitiveBlock from './PrimitiveBlock'

function BlockCanvas({ emptyMessage }) {
  const {
    focusPrimitiveBlock,
    primitiveBlocks,
    removePrimitiveBlock,
    updatePrimitiveBlockLayout,
  } = useRenderBlocks()

  return (
    <div
      id="nexus-canvas"
      className={`domain-canvas-body${primitiveBlocks.length ? ' has-blocks' : ''}`}
    >
      {primitiveBlocks.length ? (
        primitiveBlocks.map((block) => (
          <PrimitiveBlock
            block={block}
            key={block.id}
            onFocus={focusPrimitiveBlock}
            onLayoutChange={updatePrimitiveBlockLayout}
            onRemove={removePrimitiveBlock}
          />
        ))
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  )
}

export default BlockCanvas
