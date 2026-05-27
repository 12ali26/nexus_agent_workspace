import BlockCanvas from './canvas/BlockCanvas'
import PrimitiveToolbar from './canvas/PrimitiveToolbar'
import { createPrimitivePayload } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'
import WorkspaceTerminalPanel from './terminal/WorkspaceTerminalPanel'
import { useTerminalPanel } from './terminal/useTerminalPanel'

function WorkspaceCanvas() {
  const { activePrimitives, installedPacks } = usePackRegistry()
  const { addPrimitiveBlock } = useRenderBlocks()
  const { isOpen, openTerminal, panelHeight } = useTerminalPanel()

  const addToolbarPrimitiveBlock = (primitiveType) => {
    const primitive = createPrimitivePayload(primitiveType)

    addPrimitiveBlock(primitive)
  }

  return (
    <main className="workspace-canvas" aria-label="Workspace canvas">
      <div
        className={`domain-workspace${
          isOpen ? ' has-workspace-bottom-panel' : ''
        }`}
        style={{ '--terminal-panel-height': `${panelHeight}px` }}
      >
        <PrimitiveToolbar
          onPrimitiveClick={addToolbarPrimitiveBlock}
          primitiveTypes={activePrimitives}
          onTerminalClick={openTerminal}
        />
        <BlockCanvas
          emptyMessage={
            installedPacks.length
              ? 'Canvas Ready — Add a primitive or load a file to begin'
              : 'Install a pack from the Extensions panel to begin'
            }
        />
        {isOpen && <WorkspaceTerminalPanel />}
      </div>
    </main>
  )
}

export default WorkspaceCanvas
