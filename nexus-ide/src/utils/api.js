export class NexusAPIError extends Error {
  constructor(message, status, url) {
    super(message)
    this.name = 'NexusAPIError'
    this.status = status
    this.url = url

    window.dispatchEvent(
      new CustomEvent('nexus-error', {
        detail: {
          message,
          status,
          timestamp: new Date().toISOString(),
          type: 'api',
          url,
        },
      }),
    )
  }
}

async function nexusRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      throw new NexusAPIError(
        errorData.message ||
          errorData.error ||
          `Request failed: ${response.status}`,
        response.status,
        url,
      )
    }

    return await response.json()
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
