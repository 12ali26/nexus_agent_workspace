import { useState } from 'react'
import PrimitiveBlock from './PrimitiveBlock'
import WorkspaceToolbar from './WorkspaceToolbar'
import { forceOverTimeData } from './sampleData'

const physicsRenderers = ['3D Object', 'Equation', 'Chart', 'Annotation']

function PhysicsWorkspaceCanvas() {
  // Future agent render instructions will append to this same block array.
  const [primitiveBlocks, setPrimitiveBlocks] = useState([])

  const addPrimitiveBlock = (renderer) => {
    const primitive = createPhysicsPrimitive(renderer)

    if (!primitive) {
      return
    }

    setPrimitiveBlocks((currentBlocks) => [
      ...currentBlocks,
      {
        id: crypto.randomUUID(),
        ...primitive,
      },
    ])
  }

  const removePrimitiveBlock = (blockId) => {
    setPrimitiveBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId),
    )
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
          <div className="primitive-stack">
            {primitiveBlocks.map((block) => (
              <PrimitiveBlock
                block={block}
                key={block.id}
                onRemove={removePrimitiveBlock}
              />
            ))}
          </div>
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
