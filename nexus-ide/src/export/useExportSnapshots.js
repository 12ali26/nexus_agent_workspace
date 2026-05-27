import { useContext } from 'react'
import { ExportSnapshotContext } from './exportSnapshotContext'

export function useExportSnapshots() {
  const context = useContext(ExportSnapshotContext)

  if (!context) {
    throw new Error('useExportSnapshots must be used inside ExportSnapshotProvider')
  }

  return context
}
