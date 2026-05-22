import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import WorkspaceBlockCanvas from './WorkspaceBlockCanvas'
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
  const { addPrimitiveBlock } = useRenderBlocks()

  const addToolbarPrimitiveBlock = (renderer) => {
    const primitive = createActuarialPrimitive(renderer)
    addPrimitiveBlock(primitive)
  }

  return (
    <div className="domain-workspace">
      <WorkspaceToolbar
        onRendererClick={addToolbarPrimitiveBlock}
        renderers={actuarialRenderers}
      />
      <WorkspaceBlockCanvas emptyMessage="Actuarial Workspace Ready — Load data or connect an agent to begin" />
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
