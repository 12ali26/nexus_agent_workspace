const express = require('express')
const cors = require('cors')
const { exec, execSync, spawn } = require('child_process')
const { randomUUID } = require('crypto')
const path = require('path')
const http = require('http')
const fs = require('fs')
const { WebSocket, WebSocketServer } = require('ws')
const pty = require('node-pty')
const Database = require('better-sqlite3')
const db = require('./database')

const app = express()
const server = http.createServer(app)
const terminalWss = new WebSocketServer({ noServer: true })

function isAuthDisabled() {
  return process.env.NEXUS_AUTH_DISABLED === 'true'
}

function getAuthConfig() {
  const username = process.env.NEXUS_AUTH_USER
  const password = process.env.NEXUS_AUTH_PASSWORD

  if (isAuthDisabled()) {
    return null
  }

  if ((username && !password) || (!username && password)) {
    return { invalid: true }
  }

  if (!username && !password) {
    return null
  }

  return { username, password }
}

function getBasicAuthUsername(req) {
  const header = req.headers.authorization || ''
  const [scheme, encoded] = header.split(' ')

  if (scheme !== 'Basic' || !encoded) {
    return ''
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')

    return separatorIndex === -1 ? '' : decoded.slice(0, separatorIndex)
  } catch {
    return ''
  }
}

function getRequestActor(req) {
  return getBasicAuthUsername(req) || 'local-user'
}

function writeActivityEvent({
  actor = 'local-user',
  id,
  metadata = {},
  projectId = 'project_default',
  summary,
  type,
}) {
  if (!summary || !type) {
    return null
  }

  const eventId = id || randomUUID()
  const safeMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {}

  db.prepare(
    `
      INSERT OR REPLACE INTO activity_events
        (id, project_id, actor, type, summary, metadata, created_at)
      VALUES
        (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `,
  ).run(
    eventId,
    projectId,
    actor || 'local-user',
    type,
    summary,
    JSON.stringify(safeMetadata),
  )

  return {
    actor: actor || 'local-user',
    createdAt: new Date().toISOString(),
    id: eventId,
    metadata: safeMetadata,
    projectId,
    summary,
    type,
  }
}

function isAuthenticated(req) {
  const authConfig = getAuthConfig()

  if (!authConfig) {
    return true
  }

  if (authConfig.invalid) {
    return false
  }

  const header = req.headers.authorization || ''
  const [scheme, encoded] = header.split(' ')

  if (scheme !== 'Basic' || !encoded) {
    return false
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')

    if (separatorIndex === -1) {
      return false
    }

    const username = decoded.slice(0, separatorIndex)
    const password = decoded.slice(separatorIndex + 1)

    return username === authConfig.username && password === authConfig.password
  } catch {
    return false
  }
}

function requestAuth(res) {
  res.setHeader('WWW-Authenticate', 'Basic realm="NEXUS IDE"')
  res.status(401).send('Authentication required')
}

function authMiddleware(req, res, next) {
  if (req.path === '/api/health' || req.path === '/api/security/status') {
    next()
    return
  }

  if (isAuthenticated(req)) {
    next()
    return
  }

  writeActivityEvent({
    actor: getRequestActor(req),
    metadata: {
      method: req.method,
      path: req.path,
      remoteAddress: req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
    projectId: 'security',
    summary: `Unauthorized request blocked: ${req.method} ${req.path}`,
    type: 'security',
  })
  requestAuth(res)
}

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
app.use(authMiddleware)
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

function sanitizeSqlIdentifier(value, fallback = 'column') {
  const sanitized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!sanitized) {
    return fallback
  }

  return /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized
}

function quoteSqlIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

function getUniqueSqlIdentifier(baseName, usedNames) {
  let identifier = baseName
  let suffix = 2

  while (usedNames.has(identifier)) {
    identifier = `${baseName}_${suffix}`
    suffix += 1
  }

  usedNames.add(identifier)
  return identifier
}

function stripSqlComments(sql) {
  return String(sql ?? '')
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
}

function validateReadOnlySql(sql) {
  const trimmedSql = stripSqlComments(sql)

  if (!trimmedSql) {
    return 'Enter a SQL query to run.'
  }

  const withoutTrailingSemicolon = trimmedSql.replace(/;\s*$/, '')

  if (withoutTrailingSemicolon.includes(';')) {
    return 'Only one SQL statement can run at a time.'
  }

  if (!/^(select|with)\b/i.test(withoutTrailingSemicolon)) {
    return 'Only read-only SELECT queries are supported.'
  }

  const blockedPattern =
    /\b(attach|alter|create|delete|detach|drop|insert|pragma|reindex|replace|update|vacuum)\b/i

  if (blockedPattern.test(withoutTrailingSemicolon)) {
    return 'This SQL runner only supports read-only queries.'
  }

  return ''
}

function normalizeSqlValue(value) {
  if (value === undefined) {
    return null
  }

  if (value === null || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return JSON.stringify(value)
}

function getSqlDatasets(data) {
  const rawDatasets = Array.isArray(data?.rawDatasets) ? data.rawDatasets : []

  if (rawDatasets.length) {
    return rawDatasets
      .map((dataset) => ({
        active: Boolean(dataset.active),
        columns: Array.isArray(dataset.columns) ? dataset.columns : [],
        name: dataset.name || 'dataset',
        rows: Array.isArray(dataset.rows) ? dataset.rows : [],
      }))
      .filter((dataset) => dataset.rows.length)
      .sort((a, b) => Number(b.active) - Number(a.active))
  }

  return Object.entries(getDatasetMap(data))
    .filter(([, rows]) => Array.isArray(rows) && rows.length)
    .map(([name, rows]) => ({
      columns: Array.from(
        new Set(rows.flatMap((row) => Object.keys(row ?? {}))),
      ),
      name,
      rows,
    }))
}

function createSqlTables(memoryDb, data) {
  const usedTableNames = new Set()
  const tableAliases = []

  getSqlDatasets(data).forEach((dataset, datasetIndex) => {
    const tableName = getUniqueSqlIdentifier(
      sanitizeSqlIdentifier(dataset.name, `dataset_${datasetIndex + 1}`),
      usedTableNames,
    )
    const usedColumnNames = new Set()
    const columnPairs = dataset.columns.map((column, columnIndex) => ({
      original: column,
      sql: getUniqueSqlIdentifier(
        sanitizeSqlIdentifier(column, `column_${columnIndex + 1}`),
        usedColumnNames,
      ),
    }))

    if (!columnPairs.length) {
      return
    }

    memoryDb
      .prepare(
        `CREATE TABLE ${quoteSqlIdentifier(tableName)} (${columnPairs
          .map(({ sql }) => `${quoteSqlIdentifier(sql)} ANY`)
          .join(', ')})`,
      )
      .run()

    const placeholders = columnPairs.map(() => '?').join(', ')
    const insertStatement = memoryDb.prepare(
      `INSERT INTO ${quoteSqlIdentifier(tableName)} (${columnPairs
        .map(({ sql }) => quoteSqlIdentifier(sql))
        .join(', ')}) VALUES (${placeholders})`,
    )
    const insertRows = memoryDb.transaction((rows) => {
      rows.forEach((row) => {
        insertStatement.run(
          ...columnPairs.map(({ original }) => normalizeSqlValue(row?.[original])),
        )
      })
    })

    insertRows(dataset.rows)
    tableAliases.push({
      columns: columnPairs.map(({ original, sql }) => ({ original, sql })),
      name: dataset.name,
      rows: dataset.rows.length,
      tableName,
    })
  })

  if (tableAliases.length && !usedTableNames.has('dataset')) {
    memoryDb
      .prepare(
        `CREATE TEMP VIEW ${quoteSqlIdentifier('dataset')} AS SELECT * FROM ${quoteSqlIdentifier(
          tableAliases[0].tableName,
        )}`,
      )
      .run()
    tableAliases.unshift({
      ...tableAliases[0],
      name: `${tableAliases[0].name} (active alias)`,
      tableName: 'dataset',
    })
  }

  return tableAliases
}

function runSqlQuery(code, data) {
  const validationError = validateReadOnlySql(code)

  if (validationError) {
    return { error: validationError, output: '', success: false }
  }

  const memoryDb = new Database(':memory:')

  try {
    const tableAliases = createSqlTables(memoryDb, data)
    const query = stripSqlComments(code).replace(/;\s*$/, '')
    const rows = memoryDb.prepare(query).all()

    return {
      output: JSON.stringify(rows, null, 2),
      rows,
      success: true,
      tableAliases,
    }
  } catch (error) {
    return {
      error: error.message,
      output: '',
      success: false,
    }
  } finally {
    memoryDb.close()
  }
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

  if (language === 'sql') {
    const result = runSqlQuery(code, data)

    if (result.success) {
      res.write(
        `data: ${JSON.stringify({
          output: result.output || '[]',
          rows: result.rows,
          tableAliases: result.tableAliases,
        })}\n\n`,
      )
      res.write(`data: ${JSON.stringify({ done: true, exitCode: 0 })}\n\n`)
    } else {
      res.write(`data: ${JSON.stringify({ error: result.error })}\n\n`)
      res.write(`data: ${JSON.stringify({ done: true, exitCode: 1 })}\n\n`)
    }

    res.end()
    return
  }

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

const pythonPackageChecks = new Map([
  ['numpy', 'numpy'],
  ['pandas', 'pandas'],
  ['sklearn', 'sklearn'],
  ['scikit-learn', 'sklearn'],
])

app.post('/api/check-python-package', (req, res) => {
  const packageName = pythonPackageChecks.get(String(req.body?.package ?? ''))

  if (!packageName) {
    res.status(400).json({
      available: false,
      error: true,
      message: 'Unsupported package check',
    })
    return
  }

  exec(
    `python3 -c "import ${packageName}"`,
    { timeout: 5000 },
    (error) => {
      res.json({
        available: !error,
        package: packageName,
        suggestion: error ? `pip install ${packageName}` : '',
      })
    },
  )
})

app.get('/api/security/status', (req, res) => {
  const authConfig = getAuthConfig()

  res.json({
    actor: getRequestActor(req),
    authDisabled: isAuthDisabled(),
    authEnabled: Boolean(authConfig && !authConfig.invalid),
    configInvalid: Boolean(authConfig?.invalid),
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

app.get('/api/projects', (_req, res) => {
  const projects = db
    .prepare(
      `
        SELECT id, name, created_at, updated_at
        FROM projects
        ORDER BY updated_at DESC
      `,
    )
    .all()
    .map((project) => ({
      createdAt: new Date(project.created_at * 1000).toISOString(),
      id: project.id,
      name: project.name,
      updatedAt: new Date(project.updated_at * 1000).toISOString(),
    }))

  res.json(projects)
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

app.delete('/api/datasets/project/:projectId', (req, res) => {
  db.prepare('DELETE FROM datasets WHERE project_id = ?').run(
    req.params.projectId,
  )
  res.json({ success: true })
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

app.delete('/api/canvas/:projectId', (req, res) => {
  db.prepare('DELETE FROM canvas_state WHERE project_id = ?').run(
    req.params.projectId,
  )
  res.json({ success: true })
})

// ── Activity timeline endpoints ──────────────────────────

app.post('/api/activity', (req, res) => {
  const { actor, id, metadata, projectId, summary, type } = req.body

  if (!projectId || !summary || !type) {
    res.status(400).json({ error: 'Invalid activity payload' })
    return
  }

  const event = writeActivityEvent({
    actor: actor || getRequestActor(req),
    id,
    metadata,
    projectId,
    summary,
    type,
  })

  res.json(event)
})

app.get('/api/activity/:projectId', (req, res) => {
  const rows = db
    .prepare(
      `
        SELECT id, project_id, actor, type, summary, metadata, created_at
        FROM activity_events
        WHERE project_id IN (?, 'security')
        ORDER BY created_at DESC
        LIMIT 500
      `,
    )
    .all(req.params.projectId)

  res.json(
    rows.map((row) => ({
      actor: row.actor,
      createdAt: new Date(row.created_at * 1000).toISOString(),
      id: row.id,
      metadata: JSON.parse(row.metadata || '{}'),
      projectId: row.project_id,
      summary: row.summary,
      type: row.type,
    })),
  )
})

app.delete('/api/activity/:projectId', (req, res) => {
  db.prepare('DELETE FROM activity_events WHERE project_id = ?').run(
    req.params.projectId,
  )
  res.json({ success: true })
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

server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost')

  if (pathname !== '/terminal') {
    socket.destroy()
    return
  }

  if (!isAuthenticated(req)) {
    writeActivityEvent({
      actor: getRequestActor(req),
      metadata: {
        path: pathname,
        remoteAddress: req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
      projectId: 'security',
      summary: 'Unauthorized terminal connection blocked',
      type: 'security',
    })
    socket.write(
      'HTTP/1.1 401 Unauthorized\r\n' +
        'WWW-Authenticate: Basic realm="NEXUS IDE"\r\n' +
        'Connection: close\r\n' +
        '\r\n',
    )
    socket.destroy()
    return
  }

  terminalWss.handleUpgrade(req, socket, head, (ws) => {
    terminalWss.emit('connection', ws, req)
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

  const authConfig = getAuthConfig()

  if (!authConfig) {
    console.warn(
      'SECURITY WARNING: NEXUS_AUTH_USER/NEXUS_AUTH_PASSWORD are not set. Code execution and terminal routes are exposed to anyone who can reach this server.',
    )
  } else if (authConfig.invalid) {
    console.warn(
      'SECURITY WARNING: NEXUS auth config is invalid. Set both NEXUS_AUTH_USER and NEXUS_AUTH_PASSWORD, or set NEXUS_AUTH_DISABLED=true for local-only development.',
    )
  }

  console.log(`NEXUS IDE running on http://0.0.0.0:${PORT}`)
})
