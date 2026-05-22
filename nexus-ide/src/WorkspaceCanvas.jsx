import BlockCanvas from './canvas/BlockCanvas'
import PrimitiveToolbar from './canvas/PrimitiveToolbar'
import { createPrimitivePayload } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

function WorkspaceCanvas() {
  const { activePrimitives, installedPacks } = usePackRegistry()
  const { addPrimitiveBlock } = useRenderBlocks()

  const addToolbarPrimitiveBlock = (primitiveType) => {
    const primitive = createPrimitivePayload(primitiveType)
    addPrimitiveBlock(primitive)
  }

  return (
    <main className="workspace-canvas" aria-label="Workspace canvas">
      <div className="domain-workspace">
        <PrimitiveToolbar
          onPrimitiveClick={addToolbarPrimitiveBlock}
          primitiveTypes={activePrimitives}
        />
        <BlockCanvas
          emptyMessage={
            installedPacks.length
              ? 'Canvas Ready — Add a primitive or load a file to begin'
              : 'Install a pack from the Extensions panel to begin'
          }
        />
      </div>
    </main>
  )
}

export default WorkspaceCanvas
