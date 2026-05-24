import { useContext } from 'react'
import { WorkspaceDataContext } from './workspaceDataContext'

export function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext)

  if (!context) {
    throw new Error('useWorkspaceData must be used inside WorkspaceDataProvider')
  }

  return context
}
