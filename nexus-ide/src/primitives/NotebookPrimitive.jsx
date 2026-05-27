import Editor from '@monaco-editor/react'
import MDEditor from '@uiw/react-md-editor'
import katex from 'katex'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { runCode } from '../computation/runner'
import { createDatasetScope } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { useToast } from '../toast/useToast'
import LiveTerminal from '../terminal/LiveTerminal'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import 'katex/dist/katex.min.css'

const defaultMarkdown = `## Analysis Notebook

Write your methodology, findings, and conclusions here alongside your code.`

const defaultPythonCode = `# Your workspace data is available as a variable
# Example: print the first few rows
print("Notebook ready")
print(f"Python kernel active")`

const defaultResultsMarkdown = `### Results

Add your interpretation here after running the code above.`

const languageOptions = [
  { id: 'python', label: 'Python' },
  { id: 'r', label: 'R' },
  { id: 'javascript', label: 'JavaScript' },
]

function createCell(type, data = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    data,
  }
}

function createDefaultCells() {
  return [
    createCell('markdown', { content: defaultMarkdown }),
    createCell('code', {
      code: defaultPythonCode,
      executionCount: null,
      language: 'python',
    }),
    createCell('markdown', { content: defaultResultsMarkdown }),
  ]
}

function renderMath(formula, displayMode) {
  try {
    return katex.renderToString(formula, {
      displayMode,
      output: 'html',
      throwOnError: false,
    })
  } catch {
    return formula
  }
}

function renderMarkdownWithMath(content) {
  return content
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) =>
      renderMath(formula.trim(), true),
    )
    .replace(/\$([^$\n]+)\$/g, (_, formula) =>
      renderMath(formula.trim(), false),
    )
}

function parseOutput(output) {
  const trimmedOutput = output.trim()

  if (!trimmedOutput) {
    return {
      outputType: 'text',
      text: 'Process completed with no output.',
    }
  }

  try {
    const parsedOutput = JSON.parse(trimmedOutput)

    if (
      Array.isArray(parsedOutput) &&
      parsedOutput.every(
        (row) => row && typeof row === 'object' && !Array.isArray(row),
      )
    ) {
      return {
        outputType: 'table',
        rows: parsedOutput,
      }
    }

    const chartOutput =
      parsedOutput?.chart ??
      (parsedOutput?.type === 'chart' ? parsedOutput : null)

    if (
      chartOutput &&
      Array.isArray(chartOutput.data) &&
      chartOutput.xKey &&
      chartOutput.yKey
    ) {
      return {
        outputType: 'chart',
        chart: chartOutput,
      }
    }
  } catch {
    // Plain stdout remains text output.
  }

  return {
    outputType: 'text',
    text: trimmedOutput,
  }
}

function buildNotebookCode(language, previousCode, currentCode) {
  if (!previousCode.trim()) {
    return currentCode
  }

  // KERNEL: in Electron this becomes a persistent kernel process per notebook.
  if (language === 'python') {
    return `import contextlib
import io
__nexus_previous_stdout = io.StringIO()
with contextlib.redirect_stdout(__nexus_previous_stdout):
${previousCode
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}

${currentCode}`
  }

  if (language === 'javascript') {
    return `const __nexusLog = console.log;
console.log = () => {};
${previousCode}
console.log = __nexusLog;

${currentCode}`
  }

  if (language === 'r') {
    return `capture.output({
${previousCode}
})

${currentCode}`
  }

  return `${previousCode}\n\n${currentCode}`
}

function getPreviousCode(cells, cellId, language) {
  const codeBlocks = []

  for (const cell of cells) {
    if (cell.id === cellId) {
      break
    }

    if (cell.type === 'code' && cell.data.language === language) {
      codeBlocks.push(cell.data.code ?? '')
    }
  }

  return codeBlocks.join('\n\n')
}

function OutputPreview({ output }) {
  if (output.outputType === 'table') {
    const columns = Object.keys(output.rows?.[0] ?? {})

    return (
      <div className="notebook-output-table-wrap">
        <table className="notebook-output-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {output.rows.slice(0, 20).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column}>{String(row?.[column] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (output.outputType === 'chart') {
    const chart = output.chart

    return (
      <div className="notebook-output-chart">
        <strong>{chart.title ?? 'Chart Output'}</strong>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={chart.data}
            margin={{ top: 10, right: 16, bottom: 6, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--color-chart-grid)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey={chart.xKey}
              stroke="var(--color-text-muted)"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              width={46}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-panel-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text)',
              }}
            />
            <Line
              type="monotone"
              dataKey={chart.yKey}
              stroke="var(--color-accent-strong)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-accent-strong)', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return <pre>{output.text}</pre>
}

function NotebookPrimitive({ headerControls }) {
  const showToast = useToast()
  const { activeDatasetId, datasetAliases, datasets } = useWorkspaceData()
  const [cells, setCells] = useState(createDefaultCells)
  const [selectedCellId, setSelectedCellId] = useState('')
  const [editingMarkdownId, setEditingMarkdownId] = useState('')
  const [runningCellId, setRunningCellId] = useState('')
  const [executionCounter, setExecutionCounter] = useState(0)
  const cellsRef = useRef(cells)
  const executionCounterRef = useRef(executionCounter)
  const executionData = useMemo(
    () => ({
      datasets: createDatasetScope(datasets, activeDatasetId).scope,
      rawDatasets: datasets.map((dataset) => ({
        columns: dataset.columns,
        name: dataset.name,
        rows: dataset.rows,
      })),
    }),
    [activeDatasetId, datasets],
  )

  useEffect(() => {
    cellsRef.current = cells
  }, [cells])

  useEffect(() => {
    executionCounterRef.current = executionCounter
  }, [executionCounter])

  const updateCell = useCallback((cellId, updater) => {
    setCells((currentCells) =>
      currentCells.map((cell) =>
        cell.id === cellId
          ? {
              ...cell,
              data:
                typeof updater === 'function'
                  ? updater(cell.data)
                  : { ...cell.data, ...updater },
            }
          : cell,
      ),
    )
  }, [])

  const removeOutputForCell = useCallback((cellId, currentCells) => {
    const nextCells = []
    let skipNextOutput = false

    currentCells.forEach((cell) => {
      if (skipNextOutput && cell.type === 'output') {
        skipNextOutput = false
        return
      }

      skipNextOutput = cell.id === cellId
      nextCells.push(cell)
    })

    return nextCells
  }, [])

  const insertOutputForCell = useCallback(
    (cellId, output) => {
      setCells((currentCells) => {
        const withoutPreviousOutput = removeOutputForCell(cellId, currentCells)
        const cellIndex = withoutPreviousOutput.findIndex(
          (cell) => cell.id === cellId,
        )

        if (cellIndex === -1) {
          return currentCells
        }

        return [
          ...withoutPreviousOutput.slice(0, cellIndex + 1),
          createCell('output', {
            ...output,
            sourceCellId: cellId,
          }),
          ...withoutPreviousOutput.slice(cellIndex + 1),
        ]
      })
    },
    [removeOutputForCell],
  )

  const runCell = useCallback(
    async (cellId, sourceCells = cellsRef.current) => {
      const cell = sourceCells.find((currentCell) => currentCell.id === cellId)

      if (!cell || cell.type !== 'code') {
        return
      }

      setRunningCellId(cellId)

      const language = cell.data.language ?? 'python'
      const currentCode = cell.data.code ?? ''
      const previousCode = getPreviousCode(sourceCells, cellId, language)
      const code = buildNotebookCode(language, previousCode, currentCode)

      try {
        const result = await runCode(language, code, executionData)
        const nextExecutionCount = executionCounterRef.current + 1

        executionCounterRef.current = nextExecutionCount
        setExecutionCounter(nextExecutionCount)
        updateCell(cellId, { executionCount: nextExecutionCount })

        const output = result.success
          ? parseOutput(result.output)
          : {
              outputType: 'error',
              text: result.error || 'Cell failed with no error output.',
            }

        insertOutputForCell(cellId, output)
      } finally {
        setRunningCellId('')
      }
    },
    [executionData, insertOutputForCell, updateCell],
  )

  const addCell = useCallback((type) => {
    // AGENT: can add cells to active notebook via render instructions.
    const cellData =
      type === 'code'
        ? { code: '', executionCount: null, language: 'python' }
        : type === 'terminal'
          ? {}
        : type === 'equation'
          ? { formula: String.raw`E = mc^2` }
          : { content: '' }

    const cell = createCell(type, cellData)

    setCells((currentCells) => [...currentCells, cell])
    setSelectedCellId(cell.id)
  }, [])

  const deleteCell = useCallback((cellId) => {
    setCells((currentCells) =>
      currentCells.filter(
        (cell) =>
          cell.id !== cellId &&
          !(cell.type === 'output' && cell.data.sourceCellId === cellId),
      ),
    )
  }, [])

  const moveCell = useCallback((cellId, direction) => {
    setCells((currentCells) => {
      const cellIndex = currentCells.findIndex((cell) => cell.id === cellId)
      const targetIndex = cellIndex + direction

      if (
        cellIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= currentCells.length
      ) {
        return currentCells
      }

      const nextCells = [...currentCells]
      const [cell] = nextCells.splice(cellIndex, 1)
      nextCells.splice(targetIndex, 0, cell)
      return nextCells
    })
  }, [])

  const clearOutputs = useCallback(() => {
    setCells((currentCells) =>
      currentCells
        .filter((cell) => cell.type !== 'output')
        .map((cell) =>
          cell.type === 'code'
            ? { ...cell, data: { ...cell.data, executionCount: null } }
            : cell,
        ),
    )
  }, [])

  const runAll = useCallback(async () => {
    const codeCellIds = cellsRef.current
      .filter((cell) => cell.type === 'code')
      .map((cell) => cell.id)

    for (const cellId of codeCellIds) {
      await runCell(cellId, cellsRef.current)
    }
  }, [runCell])

  useEffect(() => {
    headerControls?.(
      <div className="primitive-header-controls notebook-header-controls">
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={runAll}
        >
          Run All
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => addCell('markdown')}
        >
          Markdown
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => addCell('code')}
        >
          Code
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => addCell('equation')}
        >
          Equation
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => addCell('terminal')}
        >
          Terminal
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={clearOutputs}
        >
          Clear Outputs
        </button>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => showToast('Export coming soon')}
        >
          Export
        </button>
      </div>,
    )

    return () => headerControls?.(null)
  }, [addCell, clearOutputs, headerControls, runAll, showToast])

  return (
    <div className="notebook-primitive" data-color-mode="dark">
      {datasetAliases.length > 0 && (
        <aside className="notebook-data-panel">
          <strong>Available Data</strong>
          <div>
            {datasetAliases.map(({ dataset, variableName }) => (
              <span key={dataset.id} title={dataset.columns.join(', ')}>
                {variableName} ({dataset.columns.length} cols)
              </span>
            ))}
          </div>
        </aside>
      )}

      <div className="notebook-cell-list">
        {cells.map((cell, index) => (
          <section
            className={`notebook-cell notebook-cell-${cell.type}${
              selectedCellId === cell.id ? ' is-selected' : ''
            }`}
            key={cell.id}
            onClick={() => setSelectedCellId(cell.id)}
          >
            <div className="notebook-cell-gutter">
              {cell.type === 'code' ? (
                <span>
                  [
                  {runningCellId === cell.id
                    ? '*'
                    : (cell.data.executionCount ?? ' ')}
                  ]
                </span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            <div className="notebook-cell-main">
              <div className="notebook-cell-controls">
                <span>{cell.type}</span>
                <button
                  type="button"
                  aria-label="Move cell up"
                  onClick={() => moveCell(cell.id, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Move cell down"
                  onClick={() => moveCell(cell.id, 1)}
                >
                  ▼
                </button>
                <button
                  type="button"
                  aria-label="Delete cell"
                  onClick={() => deleteCell(cell.id)}
                >
                  x
                </button>
              </div>

              {cell.type === 'markdown' && (
                <div
                  className="notebook-markdown-cell"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setEditingMarkdownId('')
                    }
                  }}
                  onDoubleClick={() => setEditingMarkdownId(cell.id)}
                >
                  {editingMarkdownId === cell.id ? (
                    <MDEditor
                      value={cell.data.content}
                      preview="edit"
                      hideToolbar
                      textareaProps={{ 'aria-label': 'Notebook markdown' }}
                      onChange={(content) =>
                        updateCell(cell.id, { content: content ?? '' })
                      }
                    />
                  ) : (
                    <MDEditor.Markdown
                      source={renderMarkdownWithMath(cell.data.content ?? '')}
                      style={{ background: 'transparent', color: 'inherit' }}
                    />
                  )}
                </div>
              )}

              {cell.type === 'code' && (
                <div className="notebook-code-cell">
                  <div className="notebook-code-toolbar">
                    <select
                      value={cell.data.language}
                      onChange={(event) =>
                        updateCell(cell.id, { language: event.target.value })
                      }
                    >
                      {languageOptions.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={runningCellId === cell.id}
                      onClick={() => runCell(cell.id)}
                    >
                      {runningCellId === cell.id ? 'Running...' : '▶'}
                    </button>
                  </div>
                  <div className="notebook-code-editor">
                    <Editor
                      height="100%"
                      language={cell.data.language}
                      theme="vs-dark"
                      value={cell.data.code ?? ''}
                      options={{
                        automaticLayout: true,
                        fontSize: 13,
                        lineNumbersMinChars: 3,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                      }}
                      onChange={(code) =>
                        updateCell(cell.id, { code: code ?? '' })
                      }
                    />
                  </div>
                </div>
              )}

              {cell.type === 'equation' && (
                <div className="notebook-equation-cell">
                  <input
                    type="text"
                    value={cell.data.formula ?? ''}
                    onChange={(event) =>
                      updateCell(cell.id, { formula: event.target.value })
                    }
                  />
                  <div
                    className="notebook-equation-preview"
                    dangerouslySetInnerHTML={{
                      __html: renderMath(cell.data.formula ?? '', true),
                    }}
                  />
                </div>
              )}

              {cell.type === 'terminal' && (
                <div className="notebook-terminal-cell">
                  <LiveTerminal className="notebook-terminal-instance" />
                </div>
              )}

              {cell.type === 'output' && (
                <div
                  className={`notebook-output-cell${
                    cell.data.outputType === 'error' ? ' is-error' : ''
                  }`}
                >
                  <button type="button" onClick={() => deleteCell(cell.id)}>
                    Clear
                  </button>
                  <OutputPreview output={cell.data} />
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default NotebookPrimitive
