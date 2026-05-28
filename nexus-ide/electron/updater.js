const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const { autoUpdater } = require('electron-updater')

// NEXUS Auto-Updater
// Checks GitHub releases for new versions and prompts the renderer when ready.
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

function sendToFocusedWindow(channel, payload) {
  const win = BrowserWindow.getFocusedWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload)
  }
}

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
})

autoUpdater.on('update-available', (info) => {
  sendToFocusedWindow('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes,
  })
})

autoUpdater.on('update-not-available', () => {
  console.log('NEXUS is up to date')
})

autoUpdater.on('update-downloaded', (info) => {
  sendToFocusedWindow('update-downloaded', {
    version: info.version,
  })
})

autoUpdater.on('error', (error) => {
  console.error('Update error:', error.message)
})

function checkForUpdates() {
  if (isDev) {
    return null
  }

  return autoUpdater.checkForUpdates()
}

function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

module.exports = {
  checkForUpdates,
  installUpdate,
}
