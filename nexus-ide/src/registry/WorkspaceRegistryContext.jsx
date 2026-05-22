import { useCallback, useMemo, useState } from 'react'
import { WorkspaceRegistryContext } from './workspaceRegistryContext'
import registry from './workspaces.json'

export function WorkspaceRegistryProvider({ children }) {
  // Remote registry fetching will plug in here later; consumers should keep
  // reading this normalized workspace state instead of importing the JSON.
  const [availableWorkspaces, setAvailableWorkspaces] = useState(
    () => registry.workspaces,
  )
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)

  const activeWorkspace =
    availableWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    null

  const installWorkspace = useCallback((workspaceId) => {
    setAvailableWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) =>
        workspace.id === workspaceId
          ? { ...workspace, installed: true }
          : workspace,
      ),
    )
  }, [])

  const uninstallWorkspace = useCallback((workspaceId) => {
    setAvailableWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) =>
        workspace.id === workspaceId
          ? { ...workspace, installed: false }
          : workspace,
      ),
    )
    setActiveWorkspaceId((currentActiveWorkspaceId) =>
      currentActiveWorkspaceId === workspaceId ? null : currentActiveWorkspaceId,
    )
  }, [])

  const activateWorkspace = useCallback(
    (workspaceId) => {
      const workspace = availableWorkspaces.find(
        (candidate) => candidate.id === workspaceId,
      )

      if (workspace?.installed) {
        setActiveWorkspaceId(workspaceId)
      }
    },
    [availableWorkspaces],
  )

  const value = useMemo(
    () => ({
      availableWorkspaces,
      activeWorkspace,
      installWorkspace,
      uninstallWorkspace,
      activateWorkspace,
    }),
    [
      activateWorkspace,
      activeWorkspace,
      availableWorkspaces,
      installWorkspace,
      uninstallWorkspace,
    ],
  )

  return (
    <WorkspaceRegistryContext.Provider value={value}>
      {children}
    </WorkspaceRegistryContext.Provider>
  )
}
