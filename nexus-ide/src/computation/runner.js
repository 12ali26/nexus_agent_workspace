// This is the computational backbone of NEXUS — agents, code execution, and
// formula engines all route through here.
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
    return {
      success: false,
      output: '',
      error: error.message,
      renderInstructions: [],
    }
  }
}
