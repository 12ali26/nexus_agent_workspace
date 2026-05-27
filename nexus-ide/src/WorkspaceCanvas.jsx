import { useCallback, useEffect, useState } from 'react'
import BlockCanvas from './canvas/BlockCanvas'
import PrimitiveToolbar from './canvas/PrimitiveToolbar'
import { exportCanvasToPDF } from './export/exportToPDF'
import { createPrimitivePayload } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'
import { useSettings } from './settings/useSettings'
import WorkspaceTerminalPanel from './terminal/WorkspaceTerminalPanel'
import { useTerminalPanel } from './terminal/useTerminalPanel'

function WorkspaceCanvas({ onOpenPrimitivesPanel }) {
  const { activeProject } = usePackRegistry()
  const { addPrimitiveBlock, clearCanvas, primitiveBlocks } = useRenderBlocks()
  const { exportSettings } = useSettings()
  const {
    appendOutput,
    clearOutput,
    closePanel,
    isOpen,
    openTerminal,
    panelHeight,
  } = useTerminalPanel()
  const [canvasMode, setCanvasModeState] = useState(() => {
    try {
      const storedMode = localStorage.getItem('nexus_canvas_mode')

      return ['float', 'grid', 'focus'].includes(storedMode)
        ? storedMode
        : 'float'
    } catch {
      return 'float'
    }
  })

  const setCanvasMode = useCallback((mode) => {
    if (!['float', 'grid', 'focus'].includes(mode)) {
      return
    }

    setCanvasModeState(mode)
    try {
      localStorage.setItem('nexus_canvas_mode', mode)
    } catch {
      // Canvas mode preference is optional.
    }
  }, [])

  const addPrimitiveFromPicker = useCallback((primitiveType, options = {}) => {
    const primitive = createPrimitivePayload(primitiveType)

    if (!primitive) {
      return
    }

    const canvasElement = document.getElementById('nexus-canvas')
    const canvasRect = canvasElement?.getBoundingClientRect()
    const cascadeOffset = (primitiveBlocks.length % 8) * 24
    const layout = {}

    if (canvasMode === 'float') {
      const width = primitive.size?.width ?? 480
      const height = primitive.size?.height ?? 300
      const fallbackX = canvasRect ? (canvasRect.width - width) / 2 : 80
      const fallbackY = canvasRect ? (canvasRect.height - height) / 2 : 80
      const x = options.position?.x ?? fallbackX + cascadeOffset
      const y = options.position?.y ?? fallbackY + cascadeOffset

      layout.position = {
        x: Math.max(16, Math.round(x)),
        y: Math.max(16, Math.round(y)),
      }
    }

    addPrimitiveBlock(primitive, {
      layout,
      meta: {
        highlight: true,
      },
    })
  }, [addPrimitiveBlock, canvasMode, primitiveBlocks.length])

  const addInstructionPrimitiveBlock = useCallback(
    (instruction) => {
      const instructionData = instruction?.data ?? {}
      const primitiveTypeMap = {
        stats: 'stats-block',
      }
      const primitiveType = primitiveTypeMap[instruction.type] ?? instruction.type
      const primitive = createPrimitivePayload(primitiveType)

      if (!primitive) {
        console.warn(`Unknown nex instruction: ${instruction.type}`)
        return
      }

      if (instruction.type === 'chart') {
        primitive.data.props = {
          ...primitive.data.props,
          chartType: instructionData.chartType,
          data: instructionData.data,
          lineKey: instructionData.yKey,
          title: instructionData.title,
          xKey: instructionData.xKey,
          yLabel: instructionData.yKey,
        }
      } else if (instruction.type === 'equation') {
        primitive.data.props = {
          ...primitive.data.props,
          formula: instructionData.formula ?? primitive.data.props.formula,
          resolvedValue:
            instructionData.resolved ?? primitive.data.props.resolvedValue,
        }
      } else if (instruction.type === 'notebook') {
        primitive.data.title = instructionData.title ?? primitive.data.title
      } else if (instruction.type === 'prose-block') {
        primitive.data.props = {
          ...primitive.data.props,
          content: instructionData.content,
        }
      } else if (instruction.type === 'regression') {
        primitive.data.props = {
          ...primitive.data.props,
          autoRun: instructionData.autoRun,
          dependentVar: instructionData.dependentVar,
          independentVars: instructionData.independentVars,
        }
      } else if (instruction.type === 'annotation') {
        primitive.data.props = {
          ...primitive.data.props,
          annotations: instructionData.annotations,
        }
      } else if (instruction.type === 'assumption-flag') {
        primitive.data.props = {
          ...primitive.data.props,
          assumptions: instructionData.assumptions,
        }
      } else if (instruction.type === 'stats') {
        primitive.data.props = {
          ...primitive.data.props,
          selectedColumn: instructionData.column,
        }
      } else if (instruction.type === 'time-series') {
        primitive.data.props = {
          ...primitive.data.props,
          analysisTab: instructionData.analysisTab,
          dateColumn: instructionData.dateColumn,
          valueColumn: instructionData.valueColumn,
        }
      } else if (instruction.type === 'monte-carlo') {
        primitive.data.props = {
          ...primitive.data.props,
          formula: instructionData.formula,
          initialMode: instructionData.initialMode,
          return: instructionData.return,
          type: instructionData.type,
          vol: instructionData.vol,
          years: instructionData.years,
        }
      }

      addPrimitiveBlock(primitive)
    },
    [addPrimitiveBlock],
  )

  useEffect(() => {
    const handleAddPrimitive = (event) => {
      const primitiveType = event.detail?.primitiveType

      if (typeof primitiveType !== 'string') {
        return
      }

      addPrimitiveFromPicker(primitiveType, {
        position: event.detail?.position,
      })
    }

    window.addEventListener('nexus-add-primitive', handleAddPrimitive)

    return () =>
      window.removeEventListener('nexus-add-primitive', handleAddPrimitive)
  }, [addPrimitiveFromPicker])

  useEffect(() => {
    const handleNexRender = (event) => {
      const instructions = Array.isArray(event.detail) ? event.detail : []

      instructions.forEach((instruction) => {
        if (instruction.type === 'clear-canvas') {
          clearCanvas()
          return
        }

        if (instruction.type === 'clear-outputs') {
          clearOutput()
          return
        }

        if (instruction.type === 'list-blocks') {
          appendOutput({
            lines: primitiveBlocks.length
              ? primitiveBlocks.map(
                  (block, index) =>
                    `${index + 1}. ${block.data?.title ?? block.type} (${block.type})`,
                )
              : ['No blocks on canvas'],
            title: 'Canvas Blocks',
          })
          return
        }

        if (instruction.type === 'export') {
          exportCanvasToPDF(
            activeProject?.projectName || 'NEXUS_Analysis',
            primitiveBlocks,
            exportSettings,
          )
          return
        }

        addInstructionPrimitiveBlock(instruction)
      })
    }

    window.addEventListener('nex-render', handleNexRender)

    return () => window.removeEventListener('nex-render', handleNexRender)
  }, [
    addInstructionPrimitiveBlock,
    appendOutput,
    activeProject,
    clearCanvas,
    clearOutput,
    exportSettings,
    primitiveBlocks,
  ])

  return (
    <main className="workspace-canvas" aria-label="Workspace canvas">
      <div
        className="domain-workspace has-workspace-bottom-panel"
        style={{
          '--terminal-panel-height': isOpen ? `${panelHeight}px` : '0px',
        }}
      >
        <PrimitiveToolbar
          canvasMode={canvasMode}
          onCanvasModeChange={setCanvasMode}
          onPrimitivePanelClick={onOpenPrimitivesPanel}
          onTerminalClick={() => (isOpen ? closePanel() : openTerminal())}
        />
        <BlockCanvas
          canvasMode={canvasMode}
          emptyMessage="Open the Primitives panel to add blocks"
        />
        <WorkspaceTerminalPanel />
      </div>
    </main>
  )
}

export default WorkspaceCanvas
