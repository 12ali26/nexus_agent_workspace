import BlockCanvas from './canvas/BlockCanvas'
import PrimitiveToolbar from './canvas/PrimitiveToolbar'
import { createPrimitivePayload } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

function WorkspaceCanvas() {
  const { activePrimitives, installedPacks } = usePackRegistry()
  const { addPrimitiveBlock, primitiveBlocks } = useRenderBlocks()

  const addToolbarPrimitiveBlock = (primitiveType) => {
    const primitive = createPrimitivePayload(primitiveType)

    if (primitiveType === 'stats-block') {
      const latestTableBlock = [...primitiveBlocks]
        .reverse()
        .find((block) => block.type === 'table')

      // Canvas data sharing for Stats is the same mechanism agents will use to
      // inspect existing blocks before generating render instructions.
      primitive.data.props.data = latestTableBlock?.data?.props?.data ?? []
    }

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
