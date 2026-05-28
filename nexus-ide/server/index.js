const express = require('express')
const cors = require('cors')
const { exec, execSync, spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')
const { WebSocket, WebSocketServer } = require('ws')
const pty = require('node-pty')
const db = require('./database')

const app = express()
const server = http.createServer(app)
const terminalWss = new WebSocketServer({ server, path: '/terminal' })

function configureTerminalPrompt() {
  try {
    const bashrcAddition = `
# NEXUS IDE Terminal Prompt
parse_git_branch() {
  git branch 2>/dev/null | grep '^\\*' | sed 's/* //'
}

NEXUS_PROMPT() {
  local EXIT=$?
  local RESET='\\[\\033[0m\\]'
  local ORANGE='\\[\\033[38;5;208m\\]'
  local BLUE='\\[\\033[38;5;75m\\]'
  local GREEN='\\[\\033[38;5;71m\\]'
  local RED='\\[\\033[38;5;203m\\]'
  local GREY='\\[\\033[38;5;245m\\]'
  local BOLD='\\[\\033[1m\\]'

  local DIR=$(basename "$PWD")
  local GIT=$(parse_git_branch)

  if [ $EXIT -eq 0 ]; then
    local STATUS="\${GREEN}✓\${RESET}"
  else
    local STATUS="\${RED}✗ $EXIT\${RESET}"
  fi

  PS1="\\n\${ORANGE}\${BOLD}NEXUS\${RESET} \${GREY}›\${RESET} \${BLUE}\${DIR}\${RESET}"
  if [ -n "$GIT" ]; then
    PS1+="\${GREY} on \${RESET}\${GREEN} $GIT\${RESET}"
  fi
  PS1+=" \${STATUS}\\n\${ORANGE}❯\${RESET} "
}

PROMPT_COMMAND=NEXUS_PROMPT
`

    const homeDir = process.env.HOME || '/home/ubuntu'
    const nexusBashrc = `${homeDir}/.nexus_bashrc`
    const mainBashrc = `${homeDir}/.bashrc`

    fs.writeFileSync(nexusBashrc, bashrcAddition)

    const bashrcContent = fs.existsSync(mainBashrc)
      ? fs.readFileSync(mainBashrc, 'utf8')
      : ''

    if (!bashrcContent.includes('.nexus_bashrc')) {
      fs.appendFileSync(mainBashrc, '\n# NEXUS IDE\nsource ~/.nexus_bashrc\n')
    }

    console.log('NEXUS terminal prompt configured')
  } catch (error) {
    console.log('Terminal prompt setup skipped:', error.message)
  }
}

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use('/api', (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'
    console.log(
      `${color}${req.method} ${req.path} ${res.statusCode} ${duration}ms\x1b[0m`,
    )
  })

  next()
})

// SECURITY: This API executes code on the server.
// Add authentication before exposing publicly.
// SECURITY: Each WebSocket connection spawns a real shell.
// Add authentication before exposing publicly.
// Current setup is for local/trusted network use only.

// This is the NEXUS computation backbone. All server-side code execution
// routes through here, while React and the API stay on one port.
function getDatasetMap(data) {
  return data?.datasets && typeof data.datasets === 'object' ? data.datasets : {}
}

function getSafeVariableNames(datasetMap) {
  return Object.keys(datasetMap).filter((name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
}

function createRuntimeScript(language, code, data) {
  const datasetMap = getDatasetMap(data)
  const safeVariableNames = getSafeVariableNames(datasetMap)
  const serializedDatasets = JSON.stringify(datasetMap)

  if (language === 'python') {
    const variableLines = safeVariableNames
      .map((name) => `${name} = datasets.get(${JSON.stringify(name)}, [])`)
      .join('\n')
    const fullCode =
      `import json\n` +
      `datasets = json.loads(${JSON.stringify(serializedDatasets)})\n` +
      `${variableLines}\n` +
      `${code}`

    return {
      args: ['-c', fullCode],
      command: 'python3',
    }
  }

  if (language === 'r') {
    const fullCode =
      `datasets <- jsonlite::fromJSON(${JSON.stringify(serializedDatasets)})\n` +
      `${code}`

    return {
      args: ['-e', fullCode],
      command: 'Rscript',
    }
  }

  if (language === 'javascript') {
    const variableLines = safeVariableNames
      .map((name) => `const ${name} = datasets[${JSON.stringify(name)}];`)
      .join('\n')
    const fullCode =
      `const datasets = ${serializedDatasets};\n` +
      `${variableLines}\n` +
      `${code}`

    return {
      args: ['-e', fullCode],
      command: 'node',
    }
  }

  return null
}

app.post('/api/run', async (req, res) => {
  const { language, code, data } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const runtime = createRuntimeScript(language, code, data)

  if (!runtime) {
    res.write(`data: ${JSON.stringify({ error: 'Unsupported language' })}\n\n`)
    res.end()
    return
  }

  const proc = spawn(runtime.command, runtime.args, { timeout: 30000 })
  let exited = false

  proc.stdout.on('data', (chunk) => {
    res.write(`data: ${JSON.stringify({ output: chunk.toString() })}\n\n`)
  })

  proc.stderr.on('data', (chunk) => {
    res.write(`data: ${JSON.stringify({ error: chunk.toString() })}\n\n`)
  })

  proc.on('close', (code) => {
    if (!exited) {
      exited = true
      res.write(`data: ${JSON.stringify({ done: true, exitCode: code })}\n\n`)
      res.end()
    }
  })

  proc.on('error', (err) => {
    if (!exited) {
      exited = true
      res.write(
        `data: ${JSON.stringify({ error: err.message, done: true })}\n\n`,
      )
      res.end()
    }
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', runtimes: ['python3', 'node', 'Rscript'] })
})

const runtimeCheckCommands = new Set([
  'python3 --version',
  'Rscript --version',
  'R --version',
])

app.post('/api/check-runtime', (req, res) => {
  const { command } = req.body

  if (!runtimeCheckCommands.has(command)) {
    res.status(400).json({
      available: false,
      error: true,
      message: 'Unsupported runtime check',
    })
    return
  }

  exec(command, { timeout: 5000 }, (error) => {
    res.json({ available: !error })
  })
})

// ── Project endpoints ────────────────────────────────────

app.post('/api/project', (req, res) => {
  const { id, name } = req.body

  if (!id || !name) {
    res.status(400).json({ error: 'Project id and name are required' })
    return
  }

  db.prepare(
    `
      INSERT OR REPLACE INTO projects (id, name, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
    `,
  ).run(id, name)

  res.json({ success: true })
})

app.get('/api/project/:id', (req, res) => {
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .get(req.params.id)

  res.json(project || null)
})

// ── Dataset endpoints ────────────────────────────────────

app.post('/api/datasets', (req, res) => {
  const { columns, id, name, projectId, rows, source } = req.body

  if (!id || !projectId || !name || !Array.isArray(columns) || !Array.isArray(rows)) {
    res.status(400).json({ error: 'Invalid dataset payload' })
    return
  }

  db.prepare(
    `
      INSERT OR REPLACE INTO datasets (id, project_id, name, source, columns, rows)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    projectId,
    name,
    source || 'file',
    JSON.stringify(columns),
    JSON.stringify(rows),
  )

  res.json({ success: true })
})

app.get('/api/datasets/:projectId', (req, res) => {
  const datasets = db
    .prepare('SELECT * FROM datasets WHERE project_id = ? ORDER BY created_at ASC')
    .all(req.params.projectId)
    .map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      source: dataset.source,
      columns: JSON.parse(dataset.columns),
      rows: JSON.parse(dataset.rows),
    }))

  res.json(datasets)
})

app.delete('/api/datasets/:id', (req, res) => {
  db.prepare('DELETE FROM datasets WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// ── Canvas state endpoints ───────────────────────────────

app.post('/api/canvas', (req, res) => {
  const { blocks, projectId } = req.body

  if (!projectId || !Array.isArray(blocks)) {
    res.status(400).json({ error: 'Invalid canvas payload' })
    return
  }

  db.prepare(
    `
      INSERT OR REPLACE INTO canvas_state (project_id, blocks, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
    `,
  ).run(projectId, JSON.stringify(blocks))

  res.json({ success: true })
})

app.get('/api/canvas/:projectId', (req, res) => {
  const state = db
    .prepare('SELECT * FROM canvas_state WHERE project_id = ?')
    .get(req.params.projectId)

  res.json({ blocks: state ? JSON.parse(state.blocks) : [] })
})

// NEX CLI endpoint — receives commands from terminal and broadcasts to canvas.
// AGENT: agents can also POST here to push render instructions.
app.post('/api/nex', (req, res) => {
  const { instructions } = req.body

  if (!Array.isArray(instructions)) {
    res.status(400).json({ error: 'Invalid instructions' })
    return
  }

  terminalWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'nex-render',
          instructions,
        }),
      )
    }
  })

  res.json({ success: true, count: instructions.length })
})

app.use('/api', (req, res) => {
  res.status(404).json({
    error: true,
    message: `API route not found: ${req.path}`,
  })
})

terminalWss.on('connection', (ws) => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: process.env,
  })

  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }))
    }
  })

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString())

      if (parsedMessage.type === 'input') {
        ptyProcess.write(parsedMessage.data)
      }

      if (parsedMessage.type === 'resize') {
        ptyProcess.resize(parsedMessage.cols, parsedMessage.rows)
      }
    } catch {
      // Ignore malformed terminal messages.
    }
  })

  ws.on('close', () => {
    ptyProcess.kill()
  })

  ptyProcess.onExit(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'exit' }))
      ws.close()
    }
  })
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Global error handler — catches unhandled route errors.
app.use((err, req, res) => {
  console.error('Server error:', err.message)
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    path: req.path,
  })
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

const PORT = process.env.PORT || 8080
server.listen(PORT, '0.0.0.0', () => {
  configureTerminalPrompt()

  try {
    execSync('cp cli/nex.js /usr/local/bin/nex && chmod +x /usr/local/bin/nex')
    console.log('nex CLI installed')
  } catch {
    console.log('nex CLI install skipped')
  }

  console.log(`NEXUS IDE running on http://0.0.0.0:${PORT}`)
})
