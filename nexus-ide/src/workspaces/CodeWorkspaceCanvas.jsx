import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import WorkspaceBlockCanvas from './WorkspaceBlockCanvas'
import WorkspaceToolbar from './WorkspaceToolbar'
import {
  codeExecutionChartData,
  codeTableColumns,
  codeTableData,
} from './sampleData'

const codeRenderers = ['Code Editor', 'Terminal', 'Table', 'Chart', 'Equation']

function CodeWorkspaceCanvas() {
  const { addPrimitiveBlock } = useRenderBlocks()

  const addToolbarPrimitiveBlock = (renderer) => {
    const primitive = createCodePrimitive(renderer)
    addPrimitiveBlock(primitive)
  }

  return (
    <div className="domain-workspace">
      <WorkspaceToolbar
        onRendererClick={addToolbarPrimitiveBlock}
        renderers={codeRenderers}
      />
      <WorkspaceBlockCanvas emptyMessage="Code Workspace Ready — Write code or connect an agent to begin" />
    </div>
  )
}

function createCodePrimitive(renderer) {
  if (renderer === 'Code Editor') {
    return {
      type: 'code-editor',
      data: {
        title: 'Code Editor',
        props: {},
      },
    }
  }

  if (renderer === 'Terminal') {
    return {
      type: 'terminal-output',
      data: {
        title: 'Terminal Output',
        props: {},
      },
    }
  }

  if (renderer === 'Table') {
    return {
      type: 'table',
      data: {
        title: 'Runtime Matrix',
        props: {
          columns: codeTableColumns,
          data: codeTableData,
        },
      },
    }
  }

  if (renderer === 'Chart') {
    return {
      type: 'chart',
      data: {
        title: 'Execution Pipeline',
        props: {
          data: codeExecutionChartData,
          lineKey: 'duration',
          title: 'Execution Pipeline',
          xKey: 'step',
          yLabel: 'ms',
        },
      },
    }
  }

  if (renderer === 'Equation') {
    return {
      type: 'equation',
      data: {
        title: 'Complexity Estimate',
        props: {
          formula: String.raw`T(n) = O(n \log n)`,
          resolvedValue: 'Estimated runtime: desktop execution required',
        },
      },
    }
  }

  return null
}

export default CodeWorkspaceCanvas
