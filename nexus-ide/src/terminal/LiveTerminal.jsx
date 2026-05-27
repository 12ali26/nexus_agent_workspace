import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { getThemeToken } from '../styles/themeTokens'
import 'xterm/css/xterm.css'

function LiveTerminal({ className = '' }) {
  const terminalRef = useRef(null)

  useEffect(() => {
    if (!terminalRef.current) {
      return undefined
    }

    const term = new Terminal({
      allowTransparency: true,
      cursorBlink: true,
      fontFamily: getThemeToken('--font-mono', 'Menlo, Monaco, "Courier New", monospace'),
      fontSize: 13,
      theme: {
        background: getThemeToken('--bg-base', '#0b0f14'),
        cursor: getThemeToken('--accent-green', '#3fb950'),
        foreground: getThemeToken('--accent-green', '#3fb950'),
        selectionBackground: getThemeToken('--accent-orange-dim', '#ff7b1c22'),
      },
    })
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    if (window.location.protocol === 'file:') {
      term.writeln(
        '\x1b[31mInteractive terminal requires the NEXUS server.\x1b[0m',
      )
      term.writeln(
        '\x1b[90mRun npm run deploy and open the app on port 8080.\x1b[0m',
      )

      return () => {
        term.dispose()
      }
    }

    const websocketProtocol =
      window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(
      `${websocketProtocol}//${window.location.host}/terminal`,
    )

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

        if (message.type === 'nex-render') {
          window.dispatchEvent(
            new CustomEvent('nex-render', {
              detail: message.instructions,
            }),
          )
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

export default LiveTerminal
