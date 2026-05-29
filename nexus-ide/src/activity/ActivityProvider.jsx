import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePackRegistry } from '../registry/usePackRegistry'
import { api } from '../utils/api'
import { ActivityContext } from './activityContext'

const maxActivityEvents = 500
const defaultActor = 'local-user'

function getActivityStorageKey(projectId) {
  return `nexus_activity_${projectId}`
}

function normalizeMetadata(metadata) {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata
    : {}
}

function normalizeEvent(event, projectId, actor = defaultActor) {
  if (!event || typeof event !== 'object') {
    return null
  }

  const summary =
    typeof event.summary === 'string' ? event.summary.trim() : ''
  const type = typeof event.type === 'string' ? event.type : 'activity'

  if (!summary) {
    return null
  }

  return {
    actor: typeof event.actor === 'string' && event.actor ? event.actor : actor,
    createdAt:
      typeof event.createdAt === 'string'
        ? event.createdAt
        : new Date().toISOString(),
    id:
      typeof event.id === 'string' && event.id
        ? event.id
        : crypto.randomUUID(),
    metadata: normalizeMetadata(event.metadata),
    projectId:
      typeof event.projectId === 'string' && event.projectId
        ? event.projectId
        : projectId,
    summary,
    type,
  }
}

function readStoredEvents(projectId) {
  try {
    const storedValue = localStorage.getItem(getActivityStorageKey(projectId))

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue)
      ? parsedValue.map((event) => normalizeEvent(event, projectId)).filter(Boolean)
      : []
  } catch {
    return []
  }
}

function writeStoredEvents(projectId, events) {
  try {
    localStorage.setItem(
      getActivityStorageKey(projectId),
      JSON.stringify(events.slice(0, maxActivityEvents)),
    )
  } catch {
    // Activity history is useful but should never block workspace actions.
  }
}

function sortEvents(events) {
  return [...events].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  )
}

function mergeEvents(leftEvents, rightEvents) {
  const eventMap = new Map()

  ;[...leftEvents, ...rightEvents].forEach((event) => {
    if (event?.id) {
      eventMap.set(event.id, event)
    }
  })

  return sortEvents(Array.from(eventMap.values())).slice(0, maxActivityEvents)
}

export function ActivityProvider({ children }) {
  const { activeProject } = usePackRegistry()
  const projectId = activeProject?.projectId ?? 'project_default'
  const [actor, setActor] = useState(defaultActor)
  const [events, setEvents] = useState(() => readStoredEvents(projectId))
  const [securityStatus, setSecurityStatus] = useState(null)

  useEffect(() => {
    let isCancelled = false

    async function restoreActivity() {
      const localEvents = readStoredEvents(projectId)

      try {
        const remoteEvents = await api.get(`/api/activity/${projectId}`)

        if (!isCancelled) {
          const normalizedRemoteEvents = Array.isArray(remoteEvents)
            ? remoteEvents
                .map((event) => normalizeEvent(event, projectId))
                .filter(Boolean)
            : []
          const mergedEvents = mergeEvents(normalizedRemoteEvents, localEvents)

          setEvents(mergedEvents)
          writeStoredEvents(projectId, mergedEvents)
        }
      } catch {
        if (!isCancelled) {
          setEvents(localEvents)
        }
      }
    }

    restoreActivity()

    return () => {
      isCancelled = true
    }
  }, [projectId])

  useEffect(() => {
    let isCancelled = false

    async function loadSecurityStatus() {
      try {
        const status = await api.get('/api/security/status')

        if (!isCancelled) {
          setSecurityStatus(status)
          setActor(status?.actor || defaultActor)
        }
      } catch {
        if (!isCancelled) {
          setSecurityStatus(null)
        }
      }
    }

    loadSecurityStatus()

    return () => {
      isCancelled = true
    }
  }, [])

  const logActivity = useCallback(
    (eventInput) => {
      const event = normalizeEvent(eventInput, projectId, actor)

      if (!event) {
        return null
      }

      if (event.projectId !== projectId) {
        const storedEvents = mergeEvents(
          [event],
          readStoredEvents(event.projectId),
        )

        writeStoredEvents(event.projectId, storedEvents)
      }

      setEvents((currentEvents) => {
        if (event.projectId !== projectId) {
          return currentEvents
        }

        const nextEvents = mergeEvents([event], currentEvents)

        writeStoredEvents(projectId, nextEvents)
        return nextEvents
      })

      api.post('/api/activity', event).catch(() => {
        // Local fallback was already written.
      })

      return event
    },
    [actor, projectId],
  )

  const clearActivity = useCallback(() => {
    setEvents([])
    writeStoredEvents(projectId, [])
    api.delete(`/api/activity/${projectId}`).catch(() => {
      // Plain Vite dev uses local fallback storage.
    })
  }, [projectId])

  useEffect(() => {
    const handleNexusError = (event) => {
      const detail = event.detail ?? {}

      if (String(detail.url || '').includes('/api/activity')) {
        return
      }

      logActivity({
        metadata: {
          status: detail.status,
          url: detail.url,
        },
        summary: detail.message || 'NEXUS API error',
        type: detail.type === 'security' ? 'security' : 'api',
      })
    }

    window.addEventListener('nexus-error', handleNexusError)

    return () => window.removeEventListener('nexus-error', handleNexusError)
  }, [logActivity])

  const value = useMemo(
    () => ({
      actor,
      clearActivity,
      events,
      logActivity,
      securityStatus,
    }),
    [actor, clearActivity, events, logActivity, securityStatus],
  )

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  )
}
