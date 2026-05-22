import { useEffect, useState } from 'react'

const initialOutputLines = ['NEXUS Code Runtime ready', 'Awaiting execution...']

function TerminalOutputPrimitive({ headerControls }) {
  const [outputLines, setOutputLines] = useState(initialOutputLines)

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
    <div className="terminal-output-primitive">
      {outputLines.length ? (
        outputLines.map((line) => (
          <div className="terminal-output-line" key={line}>
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
