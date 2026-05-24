import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { runCode } from '../computation/runner'
import { createDatasetScope } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'
import { useToast } from '../toast/useToast'

const languageOptions = [
  {
    id: 'javascript',
    label: 'JavaScript',
    defaultCode: '// Write your code here\nconsole.log("Hello from NEXUS");',
  },
  {
    id: 'python',
    label: 'Python',
    defaultCode: '# Write your code here\nprint("Hello from NEXUS")',
  },
  {
    id: 'r',
    label: 'R',
    defaultCode: '# Write your code here\nprint("Hello from NEXUS")',
  },
  {
    id: 'sql',
    label: 'SQL',
    defaultCode: '-- Write your query here\nSELECT * FROM data;',
  },
]

function CodeEditorPrimitive({ data, headerControls }) {
  const { addPrimitiveBlock } = useRenderBlocks()
  const { activeDatasetId, addDataset, datasetAliases, datasets } =
    useWorkspaceData()
  const showToast = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [pendingDatasetRows, setPendingDatasetRows] = useState(null)
  const [pendingDatasetName, setPendingDatasetName] = useState('code_output')
  const [language, setLanguage] = useState(languageOptions[0].id)
  const activeLanguage = useMemo(
    () =>
      languageOptions.find((option) => option.id === language) ??
      languageOptions[0],
    [language],
  )
  const [code, setCode] = useState(activeLanguage.defaultCode)
  const executionData = useMemo(
    () => ({
      datasets: createDatasetScope(datasets, activeDatasetId).scope,
      rawDatasets: datasets.map((dataset) => ({
        columns: dataset.columns,
        name: dataset.name,
        rows: dataset.rows,
      })),
      ...data,
    }),
    [activeDatasetId, data, datasets],
  )

  const detectDatasetOutput = (output) => {
    try {
      const parsedOutput = JSON.parse(output.trim())

      if (
        Array.isArray(parsedOutput) &&
        parsedOutput.every(
          (row) => row && typeof row === 'object' && !Array.isArray(row),
        )
      ) {
        return parsedOutput
      }
    } catch {
      return null
    }

    return null
  }

  const runCurrentCode = useCallback(async () => {
    if (isRunning) {
      return
    }

    setIsRunning(true)

    try {
      const result = await runCode(language, code, executionData)

      if (
        !window.nexus?.isElectron &&
        !result.output &&
        result.error &&
        /server unavailable|Failed to fetch|NetworkError/i.test(result.error)
      ) {
        showToast(result.error)
        return
      }

      const terminalText = result.success
        ? result.output || 'Process completed with no output.'
        : result.error || 'Process failed with no error output.'

      addPrimitiveBlock({
        type: 'terminal-output',
        data: {
          title: result.success ? 'Execution Output' : 'Execution Error',
          props: {
            lines: terminalText.trimEnd().split('\n'),
            tone: result.success ? 'default' : 'error',
          },
        },
      })

      if (result.success && language === 'python') {
        const outputRows = detectDatasetOutput(result.output)

        if (outputRows?.length) {
          setPendingDatasetRows(outputRows)
          setPendingDatasetName('python_output')
        }
      }
    } finally {
      setIsRunning(false)
    }
  }, [
    addPrimitiveBlock,
    code,
    executionData,
    isRunning,
    language,
    showToast,
  ])

  const registerPendingDataset = () => {
    if (!pendingDatasetRows?.length) {
      return
    }

    addDataset({
      name: pendingDatasetName || 'code_output',
      rows: pendingDatasetRows,
      source: 'code',
    })
    setPendingDatasetRows(null)
    showToast('Code output registered as dataset')
  }

  const selectLanguage = useCallback((nextLanguage) => {
    const nextLanguageOption =
      languageOptions.find((option) => option.id === nextLanguage) ??
      languageOptions[0]

    setLanguage(nextLanguageOption.id)
    setCode(nextLanguageOption.defaultCode)
  }, [])

  useEffect(() => {
    headerControls?.(
      <div className="primitive-header-controls">
        <select
          className="primitive-header-select"
          value={language}
          aria-label="Code language"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => selectLanguage(event.target.value)}
        >
          {languageOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={runCurrentCode}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>,
    )

    return () => headerControls?.(null)
  }, [headerControls, isRunning, language, runCurrentCode, selectLanguage])

  return (
    <div className="code-editor-primitive">
      <div className="code-editor-pane">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          options={{
            automaticLayout: true,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          onChange={(value) => setCode(value ?? '')}
        />
      </div>

      <aside className="available-data-panel">
        <h4>Available Data</h4>
        {datasetAliases.length ? (
          datasetAliases.map(({ dataset, variableName }) => (
            <article key={dataset.id}>
              <strong>{variableName}</strong>
              <span>{dataset.name}</span>
              <p>{dataset.columns.join(', ')}</p>
            </article>
          ))
        ) : (
          <p>No datasets loaded</p>
        )}

        {pendingDatasetRows?.length > 0 && (
          <div className="pending-dataset-panel">
            <label>
              <span>Register Output</span>
              <input
                type="text"
                value={pendingDatasetName}
                onChange={(event) => setPendingDatasetName(event.target.value)}
              />
            </label>
            <button type="button" onClick={registerPendingDataset}>
              Register Dataset
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

export default CodeEditorPrimitive
