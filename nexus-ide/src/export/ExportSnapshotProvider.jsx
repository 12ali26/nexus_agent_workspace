import { useCallback, useMemo, useRef } from 'react'
import { ExportSnapshotContext } from './exportSnapshotContext'

function createFallbackSnapshot(block) {
  return {
    data: {
      name: block.data?.title,
      title: block.data?.title,
      ...(block.data?.props ?? {}),
    },
    type: block.type,
  }
}

export function ExportSnapshotProvider({ children }) {
  const snapshotsRef = useRef(new Map())

  const registerExportSnapshot = useCallback((blockId, snapshot) => {
    if (!blockId || !snapshot) {
      return
    }

    snapshotsRef.current.set(blockId, snapshot)
  }, [])

  const unregisterExportSnapshot = useCallback((blockId) => {
    snapshotsRef.current.delete(blockId)
  }, [])

  const getExportBlocks = useCallback((primitiveBlocks) => {
    return primitiveBlocks.map((block) => {
      const snapshot =
        snapshotsRef.current.get(block.id) ?? createFallbackSnapshot(block)

      return {
        id: block.id,
        title: block.data?.title,
        type: snapshot.type ?? block.type,
        data: {
          title: block.data?.title,
          ...(block.data?.props ?? {}),
          ...(snapshot.data ?? {}),
        },
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      getExportBlocks,
      registerExportSnapshot,
      unregisterExportSnapshot,
    }),
    [getExportBlocks, registerExportSnapshot, unregisterExportSnapshot],
  )

  return (
    <ExportSnapshotContext.Provider value={value}>
      {children}
    </ExportSnapshotContext.Provider>
  )
}
