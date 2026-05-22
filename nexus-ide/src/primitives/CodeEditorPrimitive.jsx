import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { runCode } from '../computation/runner'
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
  const showToast = useToast()
  const [language, setLanguage] = useState(languageOptions[0].id)
  const activeLanguage = useMemo(
    () =>
      languageOptions.find((option) => option.id === language) ??
      languageOptions[0],
    [language],
  )
  const [code, setCode] = useState(activeLanguage.defaultCode)

  const runCurrentCode = useCallback(async () => {
    // ELECTRON: replace this with child_process.spawn() call to real language runtime
    const result = await runCode(language, code, data)
    showToast(result.output)
  }, [code, data, language, showToast])

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
        >
          Run
        </button>
      </div>,
    )

    return () => headerControls?.(null)
  }, [headerControls, language, runCurrentCode, selectLanguage])

  return (
    <div className="code-editor-primitive">
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
  )
}

export default CodeEditorPrimitive
