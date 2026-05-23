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
app.post('/api/run', async (req, res) => {
  const { language, code, data } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  let command
  let args

  if (language === 'python') {
    const fullCode = data
      ? `import json\ndata = ${JSON.stringify(data)}\n${code}`
      : code
    command = 'python3'
    args = ['-c', fullCode]
  } else if (language === 'r') {
    const fullCode = data
      ? `data <- jsonlite::fromJSON('${JSON.stringify(data)}')\n${code}`
      : code
    command = 'Rscript'
    args = ['-e', fullCode]
  } else if (language === 'javascript') {
    command = 'node'
    args = ['-e', code]
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Unsupported language' })}\n\n`)
    res.end()
    return
  }

  const proc = spawn(command, args, { timeout: 30000 })
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
