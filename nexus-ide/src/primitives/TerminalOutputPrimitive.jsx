import { useEffect, useState } from 'react'

const initialOutputLines = ['NEXUS Code Runtime ready', 'Awaiting execution...']

function TerminalOutputPrimitive({ headerControls, lines, tone = 'default' }) {
  const [outputLines, setOutputLines] = useState(lines ?? initialOutputLines)

  useEffect(() => {
    headerControls?.(
      <div className="primitive-header-controls">
        <button
          className="primitive-header-action"
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => setOutputLines([])}
        >
          Clear
        </button>
      </div>,
    )

    return () => headerControls?.(null)
  }, [headerControls])

  // ELECTRON: pipe child_process stdout/stderr here in real time
  return (
    <div
      className={`terminal-output-primitive${
        tone === 'error' ? ' is-error' : ''
      }`}
    >
      {outputLines.length ? (
        outputLines.map((line, index) => (
          <div className="terminal-output-line" key={`${line}-${index}`}>
            <span aria-hidden="true">&gt;</span>
            <span>{line}</span>
          </div>
        ))
      ) : (
        <div className="terminal-output-empty">Terminal cleared</div>
      )}
    </div>
  )
}

export default TerminalOutputPrimitive
