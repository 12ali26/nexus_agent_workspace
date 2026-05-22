import { useState } from 'react'
import { createBlockLayout } from './blockLayout'
import PrimitiveBlock from './PrimitiveBlock'
import WorkspaceToolbar from './WorkspaceToolbar'
import { forceOverTimeData } from './sampleData'

const physicsRenderers = ['3D Object', 'Equation', 'Chart', 'Annotation']

function PhysicsWorkspaceCanvas() {
  // Future agent render instructions will append to this same block array,
  // including agent-controlled position and size layout data.
  const [primitiveBlocks, setPrimitiveBlocks] = useState([])
  const [, setMaxZ] = useState(0)

  const addPrimitiveBlock = (renderer) => {
    const primitive = createPhysicsPrimitive(renderer)

    if (!primitive) {
      return
    }

    setMaxZ((currentMaxZ) => {
      const nextZ = currentMaxZ + 1

      setPrimitiveBlocks((currentBlocks) => {
        const layout = createBlockLayout(currentBlocks.length)

        return [
          ...currentBlocks,
          {
            id: crypto.randomUUID(),
            zIndex: nextZ,
            ...layout,
            ...primitive,
          },
        ]
      })

      return nextZ
    })
  }

  const removePrimitiveBlock = (blockId) => {
    setPrimitiveBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId),
    )
  }

  const updatePrimitiveBlockLayout = (blockId, layout) => {
    setPrimitiveBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...layout,
            }
          : block,
      ),
    )
  }

  const focusPrimitiveBlock = (blockId) => {
    setMaxZ((currentMaxZ) => {
      const nextZ = currentMaxZ + 1

      setPrimitiveBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                zIndex: nextZ,
              }
            : block,
        ),
      )

      return nextZ
    })
  }

  return (
    <div className="domain-workspace">
      <WorkspaceToolbar
        onRendererClick={addPrimitiveBlock}
        renderers={physicsRenderers}
      />
      <div
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
          <p>Physics Workspace Ready — Load data or connect an agent to begin</p>
        )}
      </div>
    </div>
  )
}

function createPhysicsPrimitive(renderer) {
  if (renderer === 'Equation') {
    return {
      type: 'equation',
      data: {
        title: 'Force Equation',
        props: {
          formula: 'F = ma',
          resolvedValue: 'F = 120 N',
        },
      },
    }
  }

  if (renderer === 'Chart') {
    return {
      type: 'chart',
      data: {
        title: 'Force Over Time',
        props: {
          data: forceOverTimeData,
          lineKey: 'force',
          title: 'Force Over Time',
          xKey: 'time',
          yLabel: 'Force',
        },
      },
    }
  }

  return null
}

export default PhysicsWorkspaceCanvas
