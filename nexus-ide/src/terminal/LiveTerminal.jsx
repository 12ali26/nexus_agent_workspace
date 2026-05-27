import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'

const terminalTheme = {
  background: '#0b0f14',
  foreground: '#e6edf3',
  cursor: '#ff7b1c',
  cursorAccent: '#0b0f14',
  selectionBackground: '#ff7b1c33',
  black: '#0b0f14',
  red: '#f85149',
  green: '#3fb950',
  yellow: '#e3b341',
  blue: '#4ea1ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#e6edf3',
  brightBlack: '#484f58',
  brightRed: '#ff7b72',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#ffffff',
}

function writeWelcome(term) {
  term.writeln('\x1b[38;2;255;123;28m╔═══════════════════════════════════════╗\x1b[0m')
  term.writeln(
    '\x1b[38;2;255;123;28m║  \x1b[1;37mNEXUS IDE\x1b[0m\x1b[38;2;139;148;158m  —  Terminal v0.1\x1b[0m\x1b[38;2;255;123;28m          ║\x1b[0m',
  )
  term.writeln(
    '\x1b[38;2;255;123;28m║  \x1b[38;2;78;161;255mPython 3.x  •  R 4.x  •  Node 20\x1b[0m\x1b[38;2;255;123;28m    ║\x1b[0m',
  )
  term.writeln('\x1b[38;2;255;123;28m╚═══════════════════════════════════════╝\x1b[0m')
  term.writeln('')
  term.writeln(' \x1b[38;2;63;185;80mType  nex help  for workspace commands\x1b[0m')
  term.writeln(' \x1b[38;2;139;148;158mType  python3   to start Python REPL\x1b[0m')
  term.writeln(' \x1b[38;2;139;148;158mType  R         to start R console\x1b[0m')
  term.writeln('')
  term.writeln('\x1b[38;2;43;52;66m─────────────────────────────────────────\x1b[0m')
  term.writeln('')
}

function LiveTerminal({ className = '' }) {
  const terminalRef = useRef(null)

  useEffect(() => {
    if (!terminalRef.current) {
      return undefined
    }

    let resizeObserver
    let inputDisposable
    let ws
    let term
    let isDisposed = false

    async function initializeTerminal() {
      await document.fonts?.load?.('13px "JetBrains Mono"')

      if (isDisposed || !terminalRef.current) {
        return
      }

      term = new Terminal({
        allowTransparency: true,
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 13,
        letterSpacing: 0.3,
        lineHeight: 1.6,
        macOptionIsMeta: true,
        rightClickSelectsWord: true,
        scrollback: 5000,
        theme: terminalTheme,
      })
      const fitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()

      term.loadAddon(fitAddon)
      term.loadAddon(webLinksAddon)
      term.open(terminalRef.current)
      fitAddon.fit()

      const clearTerminal = () => term?.clear()
      window.addEventListener('nexus-terminal-clear', clearTerminal)

      if (window.location.protocol === 'file:') {
        term.writeln(
          '\x1b[31mInteractive terminal requires the NEXUS server.\x1b[0m',
        )
        term.writeln(
          '\x1b[90mRun npm run deploy and open the app on port 8080.\x1b[0m',
        )

        resizeObserver = {
          disconnect: () =>
            window.removeEventListener('nexus-terminal-clear', clearTerminal),
        }
        return
      }

      const websocketProtocol =
        window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(
        `${websocketProtocol}//${window.location.host}/terminal`,
      )

      ws.onopen = () => {
        writeWelcome(term)
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

      inputDisposable = term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }))
        }
      })

      resizeObserver = new ResizeObserver(() => {
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

      const originalDisconnect = resizeObserver.disconnect.bind(resizeObserver)
      resizeObserver.disconnect = () => {
        window.removeEventListener('nexus-terminal-clear', clearTerminal)
        originalDisconnect()
      }
    }

    initializeTerminal()

    return () => {
      isDisposed = true
      resizeObserver?.disconnect()
      inputDisposable?.dispose()
      ws?.close()
      term?.dispose()
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
