import { useState } from 'react'
import { createBlockLayout } from './blockLayout'
import PrimitiveBlock from './PrimitiveBlock'
import WorkspaceToolbar from './WorkspaceToolbar'
import {
  actuarialAssumptions,
  actuarialProgressSteps,
  mortalityColumns,
  mortalityTableData,
} from './sampleData'

const actuarialRenderers = [
  'Table',
  'Equation',
  'Chart',
  'Assumption Flag',
  'Progress Step',
]

function ActuarialWorkspaceCanvas() {
  // Future agent render instructions will append to this same block array,
  // including agent-controlled position and size layout data.
  const [primitiveBlocks, setPrimitiveBlocks] = useState([])
  const [, setMaxZ] = useState(0)

  const addPrimitiveBlock = (renderer) => {
    const primitive = createActuarialPrimitive(renderer)

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
        renderers={actuarialRenderers}
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

  if (renderer === 'Assumption Flag') {
    return {
      type: 'assumption-flag',
      data: {
        title: 'Assumption Flags',
        // Assumption data is part of the future agent render-instruction payload.
        props: {
          assumptions: actuarialAssumptions,
        },
      },
    }
  }

  if (renderer === 'Progress Step') {
    return {
      type: 'progress-step',
      data: {
        title: 'Calculation Progress',
        // Step data is part of the future agent render-instruction payload.
        props: {
          steps: actuarialProgressSteps,
        },
      },
    }
  }

  return null
}

export default ActuarialWorkspaceCanvas
