import { useCallback, useMemo, useState } from 'react'
import { createBlockLayout } from '../canvas/blockLayout'
import { RenderBlocksContext } from './renderBlocksContext'

const canvasStorageKey = 'nexus_canvas'

function serializePrimitiveBlocks(blocks) {
  return blocks.map(({ type, data, position, size, zIndex }) => ({
    type,
    data,
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
    position: block.position,
    size: block.size,
    zIndex: block.zIndex,
  }
}

function readStoredCanvasState() {
  try {
    const storedValue = localStorage.getItem(canvasStorageKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.map(restorePrimitiveBlock).filter(Boolean)
  } catch {
    return []
  }
}

function writeStoredCanvasState(blocks) {
  try {
    localStorage.setItem(
      canvasStorageKey,
      JSON.stringify(serializePrimitiveBlocks(blocks)),
    )
  } catch {
    // Canvas persistence is a convenience layer; rendering should continue if
    // storage is unavailable or full.
  }
}

function removeStoredCanvasState() {
  try {
    localStorage.removeItem(canvasStorageKey)
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

export function RenderBlocksProvider({ children }) {
  const [primitiveBlocks, setPrimitiveBlocks] = useState(readStoredCanvasState)
  const [, setMaxZ] = useState(() => getHighestZIndex(primitiveBlocks))

  const commitPrimitiveBlocks = useCallback(
    (updater) => {
      setPrimitiveBlocks((currentBlocks) => {
        const nextBlocks = updater(currentBlocks)
        writeStoredCanvasState(nextBlocks)
        return nextBlocks
      })
    },
    [],
  )

  const addPrimitiveBlock = useCallback(
    (primitivePayload) => {
      if (!primitivePayload) {
        return
      }

      // Toolbar buttons, file loading, and future agent render instructions all
      // converge here to create the same draggable primitive block shape.
      setMaxZ((currentMaxZ) => {
        const nextZ = currentMaxZ + 1

        commitPrimitiveBlocks((currentBlocks) => {
          const layout = createBlockLayout(currentBlocks.length)

          return [
            ...currentBlocks,
            {
              id: crypto.randomUUID(),
              zIndex: nextZ,
              ...layout,
              ...primitivePayload,
            },
          ]
        })

        return nextZ
      })
    },
    [commitPrimitiveBlocks],
  )

  const removePrimitiveBlock = useCallback(
    (blockId) => {
      commitPrimitiveBlocks((currentBlocks) =>
        currentBlocks.filter((block) => block.id !== blockId),
      )
    },
    [commitPrimitiveBlocks],
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
    },
    [commitPrimitiveBlocks],
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

  const clearCanvas = useCallback(() => {
    setMaxZ(0)
    removeStoredCanvasState()
    setPrimitiveBlocks([])
  }, [])

  const value = useMemo(
    () => ({
      addPrimitiveBlock,
      clearCanvas,
      focusPrimitiveBlock,
      primitiveBlocks,
      removePrimitiveBlock,
      updatePrimitiveBlockLayout,
    }),
    [
      addPrimitiveBlock,
      clearCanvas,
      focusPrimitiveBlock,
      primitiveBlocks,
      removePrimitiveBlock,
      updatePrimitiveBlockLayout,
    ],
  )

  return (
    <RenderBlocksContext.Provider value={value}>
      {children}
    </RenderBlocksContext.Provider>
  )
}
