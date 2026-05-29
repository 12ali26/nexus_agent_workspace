export class NexusAPIError extends Error {
  constructor(message, status, url) {
    super(message)
    this.name = 'NexusAPIError'
    this.status = status
    this.url = url
    this.type = status === 401 || status === 403 ? 'security' : 'api'

    window.dispatchEvent(
      new CustomEvent('nexus-error', {
        detail: {
          message,
          status,
          timestamp: new Date().toISOString(),
          type: this.type,
          url,
        },
      }),
    )
  }
}

async function readResponseBody(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function nexusRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const responseData = await readResponseBody(response)

    if (!response.ok) {
      const errorData =
        responseData && typeof responseData === 'object' ? responseData : {}
      const fallbackMessage =
        response.status === 401
          ? 'Authentication required for NEXUS server access.'
          : response.status === 403
            ? 'You do not have permission to access this NEXUS resource.'
            : `Request failed: ${response.status}`

      throw new NexusAPIError(
        errorData.message || errorData.error || fallbackMessage,
        response.status,
        url,
      )
    }

    return responseData
  } catch (error) {
    if (error instanceof NexusAPIError) {
      throw error
    }

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new NexusAPIError(
        'Cannot reach NEXUS server. Check your connection.',
        0,
        url,
      )
    }

    throw new NexusAPIError(error.message, -1, url)
  }
}

export const api = {
  delete: (url) => nexusRequest(url, { method: 'DELETE' }),
  get: (url) => nexusRequest(url),
  post: (url, data) =>
    nexusRequest(url, {
      body: JSON.stringify(data),
      method: 'POST',
    }),
}

export function handleAPIError(error, fallbackMessage = 'An error occurred') {
  const message =
    error instanceof NexusAPIError ? error.message : fallbackMessage

  window.dispatchEvent(
    new CustomEvent('nexus-toast', {
      detail: {
        duration: 6000,
        message,
        type: 'error',
      },
    }),
  )
}
