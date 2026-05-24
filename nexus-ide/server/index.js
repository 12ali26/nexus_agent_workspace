const express = require('express')
const cors = require('cors')
const { spawn } = require('child_process')
const path = require('path')

const app = express()

app.use(cors())
app.use(express.json())

// SECURITY: This API executes code on the server.
// Add authentication before exposing publicly.

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

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 8080
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NEXUS IDE running on http://0.0.0.0:${PORT}`)
})
