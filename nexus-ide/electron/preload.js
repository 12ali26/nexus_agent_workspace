const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nexus', {
  runCode: (language, code, data) =>
    ipcRenderer.invoke('run-code', { language, code, data }),
  platform: process.platform,
  isElectron: true,
})
