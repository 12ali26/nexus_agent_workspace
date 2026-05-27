import { useCallback, useEffect } from 'react'
import BlockCanvas from './canvas/BlockCanvas'
import PrimitiveToolbar from './canvas/PrimitiveToolbar'
import { createPrimitivePayload } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'
import WorkspaceTerminalPanel from './terminal/WorkspaceTerminalPanel'
import { useTerminalPanel } from './terminal/useTerminalPanel'

function WorkspaceCanvas() {
  const { activePrimitives, installedPacks } = usePackRegistry()
  const { addPrimitiveBlock, clearCanvas, primitiveBlocks } = useRenderBlocks()
  const {
    appendOutput,
    clearOutput,
    isOpen,
    openTerminal,
    panelHeight,
  } = useTerminalPanel()

  const addToolbarPrimitiveBlock = useCallback((primitiveType) => {
    const primitive = createPrimitivePayload(primitiveType)

    addPrimitiveBlock(primitive)
  }, [addPrimitiveBlock])

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
          appendOutput({
            lines: [`Export ${instruction.data?.format ?? 'pdf'} coming soon`],
            title: 'Export',
          })
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
    clearCanvas,
    clearOutput,
    primitiveBlocks,
  ])

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
