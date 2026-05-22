import { useState } from 'react'
import PrimitiveBlock from './PrimitiveBlock'
import WorkspaceToolbar from './WorkspaceToolbar'
import { mortalityColumns, mortalityTableData } from './sampleData'

const actuarialRenderers = [
  'Table',
  'Equation',
  'Chart',
  'Assumption Flag',
  'Progress Step',
]

function ActuarialWorkspaceCanvas() {
  // Future agent render instructions will append to this same block array.
  const [primitiveBlocks, setPrimitiveBlocks] = useState([])

  const addPrimitiveBlock = (renderer) => {
    const primitive = createActuarialPrimitive(renderer)

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
        renderers={actuarialRenderers}
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
          <p>
            Actuarial Workspace Ready — Load data or connect an agent to begin
          </p>
        )}
      </div>
    </div>
  )
}

function createActuarialPrimitive(renderer) {
  if (renderer === 'Table') {
    return {
      type: 'table',
      data: {
        title: 'Mortality Table',
        props: {
          columns: mortalityColumns,
          data: mortalityTableData,
        },
      },
    }
  }

  if (renderer === 'Equation') {
    return {
      type: 'equation',
      data: {
        title: 'Reserve Formula',
        props: {
          formula: String.raw`q_x = \frac{d_x}{l_x}`,
          resolvedValue: 'qx = 0.00156',
        },
      },
    }
  }

  if (renderer === 'Chart') {
    return {
      type: 'chart',
      data: {
        title: 'Survival Curve',
        props: {
          data: mortalityTableData,
          lineKey: 'lx',
          title: 'Survival Curve',
          xKey: 'age',
          yLabel: 'lx',
        },
      },
    }
  }

  return null
}

export default ActuarialWorkspaceCanvas
