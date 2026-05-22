import { useContext } from 'react'
import { WorkspaceRegistryContext } from './workspaceRegistryContext'

export function useWorkspaceRegistry() {
  const context = useContext(WorkspaceRegistryContext)

  if (!context) {
    throw new Error(
      'useWorkspaceRegistry must be used inside WorkspaceRegistryProvider',
    )
  }

  return context
}
