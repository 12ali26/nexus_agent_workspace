import { useCallback, useEffect, useMemo, useState } from 'react'
import { useActivity } from '../activity/useActivity'
import { createBlockLayout } from '../canvas/blockLayout'
import { usePackRegistry } from '../registry/usePackRegistry'
import { api } from '../utils/api'
import { RenderBlocksContext } from './renderBlocksContext'

const canvasStorageKey = 'nexus_canvas'

function getProjectCanvasStorageKey(projectId) {
  return `${canvasStorageKey}_${projectId}`
}

function serializePrimitiveBlocks(blocks) {
  return blocks.map(({ type, data, meta, position, size, zIndex }) => ({
    type,
    data,
    meta: meta
      ? Object.fromEntries(
          Object.entries(meta).filter(([key]) => key !== 'highlight'),
        )
      : meta,
    position,
    size,
    zIndex,
  }))
}

function isValidLayoutValue(value) {
  return typeof value === 'number' || typeof value === 'string'
}

function restorePrimitiveBlock(block) {
  if (!block || typeof block !== 'object' || typeof block.type !== 'string') {
    return null
  }

  if (
    !block.position ||
    !isValidLayoutValue(block.position.x) ||
    !isValidLayoutValue(block.position.y) ||
    !block.size ||
    !isValidLayoutValue(block.size.width) ||
    !isValidLayoutValue(block.size.height) ||
    typeof block.zIndex !== 'number'
  ) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    type: block.type,
    data: block.data,
    meta: block.meta,
    position: block.position,
    size: block.size,
    zIndex: block.zIndex,
  }
}

function restorePrimitiveBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return []
  }

  return blocks.map(restorePrimitiveBlock).filter(Boolean)
}

function readStoredCanvasState(projectId = 'project_default') {
  try {
    const storedValue =
      localStorage.getItem(getProjectCanvasStorageKey(projectId)) ??
      localStorage.getItem(canvasStorageKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return restorePrimitiveBlocks(parsedValue)
  } catch {
    return []
  }
}

function writeStoredCanvasState(blocks, projectId = 'project_default') {
  try {
    localStorage.setItem(
      getProjectCanvasStorageKey(projectId),
      JSON.stringify(serializePrimitiveBlocks(blocks)),
    )
  } catch {
    // Canvas persistence is a convenience layer; rendering should continue if
    // storage is unavailable or full.
  }
}

function removeStoredCanvasState(projectId = 'project_default') {
  try {
    localStorage.removeItem(getProjectCanvasStorageKey(projectId))
  } catch {
    // Ignore storage failures so clearing the in-memory canvas still works.
  }
}

function getHighestZIndex(blocks) {
  return blocks.reduce(
    (highestZIndex, block) => Math.max(highestZIndex, block.zIndex ?? 0),
    0,
  )
}

function areValuesEqual(left, right) {
  if (Object.is(left, right)) {
    return true
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right)
  } catch {
    return false
  }
}

function hasPropChanges(currentProps, nextProps) {
  return Object.entries(nextProps).some(
    ([key, value]) => !areValuesEqual(currentProps?.[key], value),
  )
}

export function RenderBlocksProvider({ children }) {
  const { activeProject } = usePackRegistry()
  const { logActivity } = useActivity()
  const projectId = activeProject?.projectId ?? 'project_default'
  const [primitiveBlocks, setPrimitiveBlocks] = useState(() =>
    readStoredCanvasState(projectId),
  )
  const [isCanvasHydrated, setIsCanvasHydrated] = useState(false)
  const [, setMaxZ] = useState(() => getHighestZIndex(primitiveBlocks))

  useEffect(() => {
    let isCancelled = false

    async function restoreCanvasState() {
      setIsCanvasHydrated(false)

      try {
        const state = await api.get(`/api/canvas/${projectId}`)
        const restoredBlocks = restorePrimitiveBlocks(state.blocks)

        if (!isCancelled) {
          setPrimitiveBlocks(restoredBlocks)
          setMaxZ(getHighestZIndex(restoredBlocks))
          setIsCanvasHydrated(true)
        }
      } catch {
        const restoredBlocks = readStoredCanvasState(projectId)

        if (!isCancelled) {
          setPrimitiveBlocks(restoredBlocks)
          setMaxZ(getHighestZIndex(restoredBlocks))
          setIsCanvasHydrated(true)
        }
      }
    }

    restoreCanvasState()

    return () => {
      isCancelled = true
    }
  }, [projectId])

  useEffect(() => {
    if (!isCanvasHydrated) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      const serializedBlocks = serializePrimitiveBlocks(primitiveBlocks)

      writeStoredCanvasState(primitiveBlocks, projectId)
      api
        .post('/api/canvas', {
          blocks: serializedBlocks,
          projectId,
        })
        .catch(() => {
          // Plain Vite dev uses local fallback storage.
        })
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [isCanvasHydrated, primitiveBlocks, projectId])

  const commitPrimitiveBlocks = useCallback(
    (updater) => {
      setPrimitiveBlocks((currentBlocks) => {
        const nextBlocks = updater(currentBlocks)

        if (nextBlocks === currentBlocks) {
          return currentBlocks
        }

        writeStoredCanvasState(nextBlocks, projectId)
        return nextBlocks
      })
    },
    [projectId],
  )

  const addPrimitiveBlock = useCallback(
    (primitivePayload, options = {}) => {
      if (!primitivePayload) {
        return
      }

      // Toolbar buttons, file loading, and future agent render instructions all
      // converge here to create the same draggable primitive block shape.
      setMaxZ((currentMaxZ) => {
        const nextZ = currentMaxZ + 1

        commitPrimitiveBlocks((currentBlocks) => {
          const layout = {
            ...createBlockLayout(currentBlocks.length),
            ...options.layout,
          }

          return [
            ...currentBlocks,
            {
              id: crypto.randomUUID(),
              zIndex: nextZ,
              ...layout,
              ...primitivePayload,
              meta: {
                ...primitivePayload.meta,
                ...options.meta,
              },
            },
          ]
        })

        return nextZ
      })
      logActivity({
        metadata: {
          blockType: primitivePayload.type,
          source: options.meta?.source || primitivePayload.meta?.source,
        },
        summary: `Added ${primitivePayload.data?.title ?? primitivePayload.type}`,
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const removePrimitiveBlock = useCallback(
    (blockId) => {
      commitPrimitiveBlocks((currentBlocks) =>
        currentBlocks.filter((block) => block.id !== blockId),
      )
      logActivity({
        metadata: { blockId },
        summary: 'Removed canvas block',
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const renamePrimitiveBlock = useCallback(
    (blockId, title) => {
      const nextTitle = title.trim()

      if (!nextTitle) {
        return
      }

      commitPrimitiveBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                data: {
                  ...block.data,
                  title: nextTitle,
                },
              }
            : block,
        ),
      )
      logActivity({
        metadata: { blockId },
        summary: `Renamed block to ${nextTitle}`,
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const duplicatePrimitiveBlock = useCallback(
    (blockId) => {
      setMaxZ((currentMaxZ) => {
        const nextZ = currentMaxZ + 1

        commitPrimitiveBlocks((currentBlocks) => {
          const sourceBlock = currentBlocks.find((block) => block.id === blockId)

          if (!sourceBlock) {
            return currentBlocks
          }

          return [
            ...currentBlocks,
            {
              ...sourceBlock,
              id: crypto.randomUUID(),
              data: {
                ...sourceBlock.data,
                props: {
                  ...sourceBlock.data?.props,
                },
                title: `${sourceBlock.data?.title ?? sourceBlock.type} Copy`,
              },
              meta: {
                ...sourceBlock.meta,
                highlight: true,
              },
              position: {
                x: Number(sourceBlock.position?.x ?? 64) + 24,
                y: Number(sourceBlock.position?.y ?? 64) + 24,
              },
              zIndex: nextZ,
            },
          ]
        })

        return nextZ
      })
      logActivity({
        metadata: { blockId },
        summary: 'Duplicated canvas block',
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const updatePrimitiveBlockLayout = useCallback(
    (blockId, layout) => {
      commitPrimitiveBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                ...layout,
              }
            : block,
        ),
      )
      logActivity({
        metadata: {
          blockId,
          fields: Object.keys(layout ?? {}),
        },
        summary: 'Updated block layout',
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const updatePrimitiveBlockData = useCallback(
    (blockId, newData) => {
      if (!blockId || !newData || typeof newData !== 'object') {
        return
      }

      let didCommitUpdate = false

      commitPrimitiveBlocks((currentBlocks) => {
        let didUpdate = false
        const nextBlocks = currentBlocks.map((block) => {
          if (block.id !== blockId) {
            return block
          }

          const currentProps = block.data?.props ?? {}

          if (!hasPropChanges(currentProps, newData)) {
            return block
          }

          didUpdate = true

          return {
            ...block,
            data: {
              ...block.data,
              props: {
                ...currentProps,
                ...newData,
              },
            },
          }
        })

        didCommitUpdate = didUpdate
        return didUpdate ? nextBlocks : currentBlocks
      })

      if (!didCommitUpdate) {
        return
      }

      logActivity({
        metadata: {
          blockId,
          fields: Object.keys(newData),
        },
        summary: 'Updated block settings',
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const focusPrimitiveBlock = useCallback(
    (blockId) => {
      setMaxZ((currentMaxZ) => {
        const nextZ = currentMaxZ + 1

        commitPrimitiveBlocks((currentBlocks) =>
          currentBlocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  zIndex: nextZ,
                }
              : block,
          ),
        )

        return nextZ
      })
    },
    [commitPrimitiveBlocks],
  )

  const clearCanvas = useCallback((options = {}) => {
    setMaxZ(0)
    removeStoredCanvasState(projectId)
    setPrimitiveBlocks([])
    api.delete(`/api/canvas/${projectId}`).catch(() => {
      // Plain Vite dev uses local fallback storage.
    })
    if (options.silent) {
      return
    }

    logActivity({
      summary: 'Cleared canvas',
      type: 'canvas',
    })
  }, [logActivity, projectId])

  const replacePrimitiveBlocks = useCallback((blocks, targetProjectId = projectId) => {
    const restoredBlocks = restorePrimitiveBlocks(blocks)
    const serializedBlocks = serializePrimitiveBlocks(restoredBlocks)

    setMaxZ(getHighestZIndex(restoredBlocks))
    writeStoredCanvasState(restoredBlocks, targetProjectId)
    api
      .post('/api/canvas', {
        blocks: serializedBlocks,
        projectId: targetProjectId,
      })
      .catch(() => {
        // Plain Vite dev uses local fallback storage.
    })
    setPrimitiveBlocks(restoredBlocks)
    logActivity({
      metadata: {
        blockCount: restoredBlocks.length,
      },
      projectId: targetProjectId,
      summary: 'Replaced canvas state',
      type: 'canvas',
    })
  }, [logActivity, projectId])

  const reorderPrimitiveBlocks = useCallback(
    (fromBlockId, toBlockId) => {
      if (fromBlockId === toBlockId) {
        return
      }

      commitPrimitiveBlocks((currentBlocks) => {
        const fromIndex = currentBlocks.findIndex(
          (block) => block.id === fromBlockId,
        )
        const toIndex = currentBlocks.findIndex((block) => block.id === toBlockId)

        if (fromIndex === -1 || toIndex === -1) {
          return currentBlocks
        }

        const nextBlocks = [...currentBlocks]
        const [movedBlock] = nextBlocks.splice(fromIndex, 1)
        nextBlocks.splice(toIndex, 0, movedBlock)

        return nextBlocks
      })
      logActivity({
        metadata: {
          fromBlockId,
          toBlockId,
        },
        summary: 'Reordered canvas blocks',
        type: 'canvas',
      })
    },
    [commitPrimitiveBlocks, logActivity],
  )

  const value = useMemo(
    () => ({
      addPrimitiveBlock,
      clearCanvas,
      duplicatePrimitiveBlock,
      focusPrimitiveBlock,
      primitiveBlocks,
      renamePrimitiveBlock,
      replacePrimitiveBlocks,
      removePrimitiveBlock,
      reorderPrimitiveBlocks,
      updatePrimitiveBlockData,
      updatePrimitiveBlockLayout,
    }),
    [
      addPrimitiveBlock,
      clearCanvas,
      duplicatePrimitiveBlock,
      focusPrimitiveBlock,
      primitiveBlocks,
      renamePrimitiveBlock,
      replacePrimitiveBlocks,
      removePrimitiveBlock,
      reorderPrimitiveBlocks,
      updatePrimitiveBlockData,
      updatePrimitiveBlockLayout,
    ],
  )

  return (
    <RenderBlocksContext.Provider value={value}>
      {children}
    </RenderBlocksContext.Provider>
  )
}
