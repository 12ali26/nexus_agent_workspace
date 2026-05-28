// This is the computational backbone of NEXUS — agents, code execution, and
// formula engines all route through here.
export function parseExecutionError(stderr, language) {
  if (!stderr) {
    return null
  }

  if (language === 'python') {
    if (stderr.includes('ModuleNotFoundError')) {
      const match = stderr.match(/No module named '([^']+)'/)
      const moduleName = match?.[1] || 'unknown'

      return {
        message: `Module '${moduleName}' not found`,
        suggestion: `pip install ${moduleName}`,
        type: 'missing_module',
      }
    }

    if (stderr.includes('SyntaxError')) {
      return {
        message: stderr,
        type: 'syntax',
      }
    }

    if (/timed out|timeout/i.test(stderr)) {
      return {
        message: 'Execution timed out after 30 seconds',
        type: 'timeout',
      }
    }
  }

  if (language === 'r') {
    if (stderr.includes('there is no package called')) {
      const match = stderr.match(/there is no package called '([^']+)'/)
      const packageName = match?.[1] || 'unknown'

      return {
        message: `Package '${packageName}' not installed`,
        suggestion: `install.packages("${packageName}")`,
        type: 'missing_module',
      }
    }
  }

  return {
    message: stderr,
    type: 'runtime',
  }
}

export async function runCode(language, code, data) {
  // ELECTRON: full computation via IPC.
  if (window.nexus?.isElectron) {
    return window.nexus.runCode(language, code, data)
  }

  const apiUrl = `${window.location.origin}/api/run`
  const output = []
  const errors = []

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, data }),
    })

    if (!response.ok || !response.body) {
      window.dispatchEvent(
        new CustomEvent('nexus-error', {
          detail: {
            message: `Code execution server unavailable (${response.status})`,
            status: response.status,
            timestamp: new Date().toISOString(),
            type: 'api',
            url: apiUrl,
          },
        }),
      )

      return {
        success: false,
        output: '',
        error: `Code execution server unavailable (${response.status})`,
        renderInstructions: [],
      }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let bufferedText = ''
    let finalResult = null

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      bufferedText += decoder.decode(value, { stream: true })
      const lines = bufferedText.split('\n')
      bufferedText = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue
        }

        try {
          const parsed = JSON.parse(line.slice(6))

          if (parsed.output) {
            output.push(parsed.output)
          }

          if (parsed.error) {
            errors.push(parsed.error)
          }

          if (parsed.done) {
            finalResult = {
              success: parsed.exitCode === 0,
              output: output.join(''),
              error: errors.join(''),
              renderInstructions: [],
            }
          }
        } catch {
          // Ignore malformed event chunks and keep reading the stream.
        }
      }
    }

    return (
      finalResult ?? {
        success: errors.length === 0,
        output: output.join(''),
        error: errors.join(''),
        renderInstructions: [],
      }
    )
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent('nexus-error', {
        detail: {
          message: error.message,
          timestamp: new Date().toISOString(),
          type: 'api',
          url: apiUrl,
        },
      }),
    )

    return {
      success: false,
      output: '',
      error: error.message,
      renderInstructions: [],
    }
  }
}
