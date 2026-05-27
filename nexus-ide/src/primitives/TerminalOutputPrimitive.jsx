import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'

const initialOutputLines = ['NEXUS Code Runtime ready', 'Awaiting execution...']

function ReadOnlyTerminal({ headerControls, lines, tone = 'default' }) {
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

export function LiveTerminal({ className = '' }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const websocketRef = useRef(null)
  const fitAddonRef = useRef(null)

  useEffect(() => {
    if (!terminalRef.current) {
      return undefined
    }

    const term = new Terminal({
      allowTransparency: true,
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#0d0d0d',
        cursor: '#00ff41',
        foreground: '#00ff41',
        selectionBackground: '#ffffff40',
      },
    })
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    if (window.location.protocol === 'file:') {
      term.writeln('\x1b[31mInteractive terminal requires the NEXUS server.\x1b[0m')
      term.writeln('\x1b[90mRun npm run deploy and open the app on port 8080.\x1b[0m')

      return () => {
        term.dispose()
      }
    }

    const websocketProtocol =
      window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${websocketProtocol}//${window.location.host}/terminal`)
    websocketRef.current = ws

    ws.onopen = () => {
      term.writeln('\x1b[32mNEXUS Terminal connected\x1b[0m')
      term.writeln(
        '\x1b[90mType commands below. Python, R, and system tools available.\x1b[0m',
      )
      term.writeln('')
      fitAddon.fit()
      ws.send(
        JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }),
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'output') {
          term.write(message.data)
        }

        if (message.type === 'exit') {
          term.writeln('\x1b[31m\r\n[Process exited]\x1b[0m')
        }
      } catch {
        // Ignore malformed terminal frames.
      }
    }

    ws.onerror = () => {
      term.writeln('\x1b[31m\r\n[Terminal connection error]\x1b[0m')
    }

    ws.onclose = () => {
      term.writeln('\x1b[31m\r\n[Terminal disconnected]\x1b[0m')
    }

    const inputDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          }),
        )
      }
    })

    resizeObserver.observe(terminalRef.current)

    return () => {
      resizeObserver.disconnect()
      inputDisposable.dispose()
      ws.close()
      term.dispose()
    }
  }, [])

  return (
    <div
      className={`live-terminal-container${className ? ` ${className}` : ''}`}
      ref={terminalRef}
    />
  )
}

function TerminalOutputPrimitive({ headerControls, lines, tone = 'default' }) {
  if (lines) {
    return (
      <ReadOnlyTerminal
        headerControls={headerControls}
        lines={lines}
        tone={tone}
      />
    )
  }

  return <LiveTerminal />
}

export default TerminalOutputPrimitive
