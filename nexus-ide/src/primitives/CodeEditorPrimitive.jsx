import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { parseExecutionError, runCode } from '../computation/runner'
import { createDatasetScope } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { useTerminalPanel } from '../terminal/useTerminalPanel'
import { useToast } from '../toast/useToast'
import { api } from '../utils/api'

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
    defaultCode:
      '-- Open the Data menu for table and column names\nSELECT * FROM dataset LIMIT 10;',
  },
]

const codeTemplates = [
  {
    id: 'sql-preview',
    label: 'SQL: Preview Data',
    language: 'sql',
    code: '-- Replace dataset with a table name from the Data menu\nSELECT *\nFROM dataset\nLIMIT 10;',
  },
  {
    id: 'sql-aggregate',
    label: 'SQL: Aggregate',
    language: 'sql',
    code: '-- Replace dataset and column_name with names from the Data menu\nSELECT column_name, COUNT(*) AS count\nFROM dataset\nGROUP BY column_name\nORDER BY count DESC;',
  },
  {
    id: 'python-basics',
    label: 'Python: Basics',
    language: 'python',
    code: 'message = "Hello from NEXUS"\nprint(message)\n\nvalues = [1, 2, 3, 4]\nfor value in values:\n    print(value, value ** 2)\n\ndef average(numbers):\n    return sum(numbers) / len(numbers)\n\nprint("Average:", average(values))',
  },
  {
    id: 'python-pandas',
    label: 'Python: pandas',
    language: 'python',
    code: 'import pandas as pd\n\n# Replace dataset with an alias from the Data menu.\ndf = pd.DataFrame(dataset)\nprint(df.head())\nprint(df.describe(include="all"))',
  },
  {
    id: 'python-api',
    label: 'Python: API',
    language: 'python',
    code: 'import json\nfrom urllib.request import urlopen\n\nurl = "https://api.github.com/repos/python/cpython"\nwith urlopen(url, timeout=10) as response:\n    payload = json.loads(response.read().decode("utf-8"))\n\nprint(payload["full_name"])\nprint(payload["stargazers_count"])',
  },
  {
    id: 'python-ml',
    label: 'Python: scikit-learn',
    language: 'python',
    code: 'import pandas as pd\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestRegressor\nfrom sklearn.metrics import r2_score\n\n# Replace dataset, target_column, and feature_columns.\ndf = pd.DataFrame(dataset).dropna()\ntarget_column = "target"\nfeature_columns = ["feature_1", "feature_2"]\n\nX = df[feature_columns]\ny = df[target_column]\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)\nmodel = RandomForestRegressor(random_state=42)\nmodel.fit(X_train, y_train)\npredictions = model.predict(X_test)\nprint("R2:", r2_score(y_test, predictions))',
  },
  {
    id: 'javascript-fetch',
    label: 'JavaScript: API',
    language: 'javascript',
    code: '(async () => {\n  const response = await fetch("https://api.github.com/repos/nodejs/node");\n  const payload = await response.json();\n  console.log(payload.full_name);\n  console.log(payload.stargazers_count);\n})();',
  },
]

const templatePackageChecks = {
  'python-ml': ['pandas', 'sklearn'],
  'python-pandas': ['pandas'],
}

function CodeEditorPrimitive({ data, headerControls }) {
  const { activeDataset, activeDatasetId, addDataset, datasets } =
    useWorkspaceData()
  const { appendOutput, openOutput } = useTerminalPanel()
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
      datasets: {
        ...createDatasetScope(datasets, activeDatasetId).scope,
        dataset: activeDataset?.rows ?? [],
      },
      rawDatasets: datasets.map((dataset) => ({
        active: dataset.id === activeDatasetId,
        columns: dataset.columns,
        name: dataset.name,
        rows: dataset.rows,
      })),
      ...data,
    }),
    [activeDataset?.rows, activeDatasetId, data, datasets],
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
    openOutput()
    const startedAt = performance.now()

    try {
      const result = await runCode(language, code, executionData)
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt))

      if (
        !window.nexus?.isElectron &&
        !result.output &&
        result.error &&
        /server unavailable|Failed to fetch|NetworkError/i.test(result.error)
      ) {
        showToast(result.error, 'error', 6000)
        return
      }

      const terminalText = result.success
        ? result.output || 'Process completed with no output.'
        : result.error || 'Process failed with no error output.'
      const parsedError = result.success
        ? null
        : parseExecutionError(result.error, language)

      appendOutput({
        durationMs,
        errorDetail: parsedError,
        language,
        lines: terminalText.trimEnd().split('\n'),
        title: result.success ? 'Execution Output' : 'Execution Error',
        tone: result.success ? 'default' : 'error',
      })

      if (result.success) {
        const outputRows = Array.isArray(result.rows)
          ? result.rows
          : detectDatasetOutput(result.output)

        if (outputRows?.length) {
          setPendingDatasetRows(outputRows)
          setPendingDatasetName(language === 'sql' ? 'sql_output' : 'code_output')
        }
      }
    } finally {
      setIsRunning(false)
    }
  }, [
    appendOutput,
    code,
    executionData,
    isRunning,
    language,
    openOutput,
    showToast,
  ])

  const registerPendingDataset = () => {
    if (!pendingDatasetRows?.length) {
      return
    }

    addDataset({
      name: pendingDatasetName || 'code_output',
      rows: pendingDatasetRows,
      source: language === 'sql' ? 'sql' : 'code',
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

  const applyTemplate = useCallback((templateId) => {
    const template = codeTemplates.find((candidate) => candidate.id === templateId)

    if (!template) {
      return
    }

    setLanguage(template.language)
    setCode(template.code)

    ;(templatePackageChecks[template.id] ?? []).forEach((packageName) => {
      api
        .post('/api/check-python-package', { package: packageName })
        .then((result) => {
          if (!result?.available && result?.suggestion) {
            showToast(`${packageName} not available. Run: ${result.suggestion}`)
          }
        })
        .catch(() => {
          // Package checks are advisory; users can still run the code.
        })
    })
  }, [showToast])

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
        <select
          className="primitive-header-select"
          defaultValue=""
          aria-label="Code template"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            applyTemplate(event.target.value)
            event.target.value = ''
          }}
        >
          <option value="">Templates</option>
          {codeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
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
  }, [
    applyTemplate,
    headerControls,
    isRunning,
    language,
    runCurrentCode,
    selectLanguage,
  ])

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
    </div>
  )
}

export default CodeEditorPrimitive
