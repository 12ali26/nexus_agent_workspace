import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import WorkspaceBlockCanvas from './WorkspaceBlockCanvas'
import WorkspaceToolbar from './WorkspaceToolbar'
import { forceOverTimeData, physicsAnnotations } from './sampleData'

const physicsRenderers = ['3D Object', 'Equation', 'Chart', 'Annotation']

function PhysicsWorkspaceCanvas() {
  const { addPrimitiveBlock } = useRenderBlocks()

  const addToolbarPrimitiveBlock = (renderer) => {
    const primitive = createPhysicsPrimitive(renderer)
    addPrimitiveBlock(primitive)
  }

  return (
    <div className="domain-workspace">
      <WorkspaceToolbar
        onRendererClick={addToolbarPrimitiveBlock}
        renderers={physicsRenderers}
      />
      <WorkspaceBlockCanvas emptyMessage="Physics Workspace Ready — Load data or connect an agent to begin" />
    </div>
  )
}

function createPhysicsPrimitive(renderer) {
  if (renderer === '3D Object') {
    return {
      type: '3d-object',
      data: {
        title: 'Structural Beam Model',
        props: {},
      },
    }
  }

  if (renderer === 'Equation') {
    return {
      type: 'equation',
      data: {
        title: 'Force Equation',
        props: {
          formula: 'F = ma',
          resolvedValue: 'F = 120 N (m = 60kg, a = 2ms⁻²)',
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

  if (renderer === 'Annotation') {
    return {
      type: 'annotation',
      data: {
        title: 'Engineering Annotations',
        props: {
          annotations: physicsAnnotations,
        },
      },
    }
  }

  return null
}

export default PhysicsWorkspaceCanvas
