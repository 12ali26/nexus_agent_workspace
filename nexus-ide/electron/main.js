const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const { spawn } = require('child_process')

let mainWindow

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
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    show: false,
  })

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url: externalUrl }) => {
    shell.openExternal(externalUrl)
    return { action: 'deny' }
  })
}

function createRuntimeScript(language, code, data) {
  if (language === 'python') {
    const script = data
      ? `import json\ndata = json.loads(${JSON.stringify(JSON.stringify(data))})\n${code}`
      : code

    return {
      command: 'python3',
      args: ['-c', script],
    }
  }

  if (language === 'r') {
    const script = data
      ? `data <- jsonlite::fromJSON(${JSON.stringify(JSON.stringify(data))})\n${code}`
      : code

    return {
      command: 'Rscript',
      args: ['-e', script],
    }
  }

  if (language === 'javascript') {
    return {
      command: 'node',
      args: ['-e', code],
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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
