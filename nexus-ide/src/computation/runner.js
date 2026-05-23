// This is the computational backbone of NEXUS — agents, code execution, and
// formula engines all route through here.
export async function runCode(language, code, data) {
  // ELECTRON: full computation via IPC.
  if (window.nexus?.isElectron) {
    return window.nexus.runCode(language, code, data)
  }

  // BROWSER: mock response so npm run dev remains fully browser-only.
  return {
    success: false,
    output: '',
    error:
      'Code execution is available in NEXUS Desktop. Download the app to run code.',
    renderInstructions: [],
  }
}
