import { useMemo, useState } from 'react'
import { createBlockLayout } from '../workspaces/blockLayout'
import { RenderBlocksContext } from './renderBlocksContext'

export function RenderBlocksProvider({ children }) {
  const [primitiveBlocks, setPrimitiveBlocks] = useState([])
  const [, setMaxZ] = useState(0)

  const addPrimitiveBlock = (primitivePayload) => {
    if (!primitivePayload) {
      return
    }

    // Toolbar buttons, file loading, and future agent render instructions all
    // converge here to create the same draggable primitive block shape.
    setMaxZ((currentMaxZ) => {
      const nextZ = currentMaxZ + 1

      setPrimitiveBlocks((currentBlocks) => {
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
  }

  const removePrimitiveBlock = (blockId) => {
    setPrimitiveBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId),
    )
  }

  const updatePrimitiveBlockLayout = (blockId, layout) => {
    setPrimitiveBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...layout,
            }
          : block,
      ),
    )
  }

  const focusPrimitiveBlock = (blockId) => {
    setMaxZ((currentMaxZ) => {
      const nextZ = currentMaxZ + 1

      setPrimitiveBlocks((currentBlocks) =>
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
  }

  const value = useMemo(
    () => ({
      addPrimitiveBlock,
      focusPrimitiveBlock,
      primitiveBlocks,
      removePrimitiveBlock,
      updatePrimitiveBlockLayout,
    }),
    [primitiveBlocks],
  )

  return (
    <RenderBlocksContext.Provider value={value}>
      {children}
    </RenderBlocksContext.Provider>
  )
}
