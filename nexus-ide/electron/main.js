const { app, BrowserWindow, ipcMain, shell } = require('electron')
const http = require('http')
const path = require('path')
const isDev = require('electron-is-dev')
const { spawn } = require('child_process')
const { checkForUpdates, installUpdate } = require('./updater')

let mainWindow
let serverProcess

function getServerPath() {
  return isDev
    ? path.join(__dirname, '../server/index.js')
    : path.join(process.resourcesPath, 'server/index.js')
}

function getIconPath() {
  return isDev
    ? path.join(__dirname, '../assets/icons/png/512x512.png')
    : path.join(process.resourcesPath, 'assets/icons/png/512x512.png')
}

function startServer() {
  return new Promise((resolve) => {
    const serverPath = getServerPath()
    const nodePathEntries = [
      path.join(process.resourcesPath || '', 'app.asar', 'node_modules'),
      path.join(process.resourcesPath || '', 'app', 'node_modules'),
      path.join(__dirname, '../node_modules'),
      process.env.NODE_PATH,
    ].filter(Boolean)
    let isResolved = false

    const resolveOnce = () => {
      if (!isResolved) {
        isResolved = true
        resolve()
      }
    }

    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ELECTRON: 'true',
        NODE_ENV: 'production',
        NODE_PATH: nodePathEntries.join(path.delimiter),
        PORT: '8080',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString()
      console.log('Server:', message.trim())
      if (message.includes('running on')) {
        resolveOnce()
      }
    })

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString().trim())
    })

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error.message)
      resolveOnce()
    })

    serverProcess.on('exit', (code) => {
      if (!isResolved) {
        console.error(`Server exited before ready with code ${code}`)
        resolveOnce()
      }
    })

    setTimeout(resolveOnce, 3000)
  })
}

async function waitForServer(url, retries = 20) {
  for (let index = 0; index < retries; index += 1) {
    const isReady = await new Promise((resolve) => {
      const request = http.get(url, (response) => {
        response.resume()
        resolve(response.statusCode >= 200 && response.statusCode < 500)
      })

      request.on('error', () => resolve(false))
      request.setTimeout(1000, () => {
        request.destroy()
        resolve(false)
      })
    })

    if (isReady) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return false
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
  serverProcess = null
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0b0f14',
    show: false,
    icon: getIconPath(),
  })

  const url = isDev
    ? 'http://localhost:5173'
    : 'http://localhost:8080'

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (!isDev) {
      setTimeout(() => checkForUpdates(), 3000)
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url: externalUrl }) => {
    shell.openExternal(externalUrl)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createRuntimeScript(language, code, data) {
  const datasetMap =
    data?.datasets && typeof data.datasets === 'object' ? data.datasets : {}
  const safeVariableNames = Object.keys(datasetMap).filter((name) =>
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(name),
  )
  const serializedDatasets = JSON.stringify(datasetMap)

  if (language === 'python') {
    const variableLines = safeVariableNames
      .map((name) => `${name} = datasets.get(${JSON.stringify(name)}, [])`)
      .join('\n')
    const script =
      `import json\n` +
      `datasets = json.loads(${JSON.stringify(serializedDatasets)})\n` +
      `${variableLines}\n` +
      `${code}`

    return {
      command: 'python3',
      args: ['-c', script],
    }
  }

  if (language === 'r') {
    const script =
      `datasets <- jsonlite::fromJSON(${JSON.stringify(serializedDatasets)})\n` +
      `${code}`

    return {
      command: 'Rscript',
      args: ['-e', script],
    }
  }

  if (language === 'javascript') {
    const variableLines = safeVariableNames
      .map((name) => `const ${name} = datasets[${JSON.stringify(name)}];`)
      .join('\n')
    const script =
      `const datasets = ${serializedDatasets};\n` +
      `${variableLines}\n` +
      `${code}`

    return {
      command: 'node',
      args: ['-e', script],
    }
  }

  return null
}

ipcMain.handle('run-code', async (_event, { language, code, data }) => {
  return new Promise((resolve) => {
    const runtime = createRuntimeScript(language, code, data)

    if (!runtime) {
      resolve({
        success: false,
        output: '',
        error: `${language} runtime not supported yet`,
        renderInstructions: [],
      })
      return
    }

    const childProcess = spawn(runtime.command, runtime.args)
    let output = ''
    let error = ''
    let isResolved = false

    const resolveOnce = (result) => {
      if (isResolved) {
        return
      }

      isResolved = true
      resolve(result)
    }

    childProcess.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })

    childProcess.stderr.on('data', (chunk) => {
      error += chunk.toString()
    })

    childProcess.on('error', (runtimeError) => {
      resolveOnce({
        success: false,
        output,
        error: runtimeError.message,
        renderInstructions: [],
      })
    })

    childProcess.on('close', (code) => {
      resolveOnce({
        success: code === 0,
        output,
        error,
        renderInstructions: [],
      })
    })
  })
})

ipcMain.handle('check-for-updates', () => checkForUpdates())
ipcMain.handle('install-update', () => installUpdate())

app.whenReady().then(async () => {
  if (!isDev) {
    await startServer()
    await waitForServer('http://localhost:8080/api/health')
  }

  createWindow()
})

app.on('window-all-closed', () => {
  stopServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  stopServer()
})
