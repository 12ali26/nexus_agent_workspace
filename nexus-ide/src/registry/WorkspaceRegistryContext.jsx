import { useCallback, useMemo, useState } from 'react'
import { WorkspaceRegistryContext } from './workspaceRegistryContext'
import registry from './workspaces.json'

const installedWorkspaceIdsKey = 'nexus.installedWorkspaceIds'
const activeWorkspaceIdKey = 'nexus.activeWorkspaceId'

function readStoredInstalledWorkspaceIds(validWorkspaceIds) {
  try {
    const storedValue = localStorage.getItem(installedWorkspaceIdsKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter((workspaceId) =>
      validWorkspaceIds.has(workspaceId),
    )
  } catch {
    return []
  }
}

function readStoredActiveWorkspaceId(installedWorkspaceIds) {
  try {
    const storedValue = localStorage.getItem(activeWorkspaceIdKey)

    if (installedWorkspaceIds.includes(storedValue)) {
      return storedValue
    }
  } catch {
    return null
  }

  return null
}

function writeStoredInstalledWorkspaceIds(workspaceIds) {
  try {
    localStorage.setItem(installedWorkspaceIdsKey, JSON.stringify(workspaceIds))
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function writeStoredActiveWorkspaceId(workspaceId) {
  try {
    if (workspaceId) {
      localStorage.setItem(activeWorkspaceIdKey, workspaceId)
    } else {
      localStorage.removeItem(activeWorkspaceIdKey)
    }
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function createInitialRegistryState() {
  const validWorkspaceIds = new Set(
    registry.workspaces.map((workspace) => workspace.id),
  )
  const installedWorkspaceIds = readStoredInstalledWorkspaceIds(validWorkspaceIds)
  const activeWorkspaceId = readStoredActiveWorkspaceId(installedWorkspaceIds)

  return {
    activeWorkspaceId,
    availableWorkspaces: registry.workspaces.map((workspace) => ({
      ...workspace,
      installed: installedWorkspaceIds.includes(workspace.id),
    })),
  }
}

function getInstalledWorkspaceIds(workspaces) {
  return workspaces
    .filter((workspace) => workspace.installed)
    .map((workspace) => workspace.id)
}

export function WorkspaceRegistryProvider({ children }) {
  // Remote registry fetching will plug in here later; consumers should keep
  // reading this normalized workspace state instead of importing the JSON.
  const [registryState, setRegistryState] = useState(createInitialRegistryState)

  const { activeWorkspaceId, availableWorkspaces } = registryState

  const activeWorkspace =
    availableWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    null

  const installWorkspace = useCallback((workspaceId) => {
    setRegistryState((currentState) => {
      const nextWorkspaces = currentState.availableWorkspaces.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, installed: true } : workspace,
      )

      writeStoredInstalledWorkspaceIds(getInstalledWorkspaceIds(nextWorkspaces))

      return {
        ...currentState,
        availableWorkspaces: nextWorkspaces,
      }
    })
  }, [])

  const uninstallWorkspace = useCallback((workspaceId) => {
    setRegistryState((currentState) => {
      const nextWorkspaces = currentState.availableWorkspaces.map((workspace) =>
        workspace.id === workspaceId
          ? { ...workspace, installed: false }
          : workspace,
      )
      const nextActiveWorkspaceId =
        currentState.activeWorkspaceId === workspaceId
          ? null
          : currentState.activeWorkspaceId

      writeStoredInstalledWorkspaceIds(getInstalledWorkspaceIds(nextWorkspaces))
      writeStoredActiveWorkspaceId(nextActiveWorkspaceId)

      return {
        activeWorkspaceId: nextActiveWorkspaceId,
        availableWorkspaces: nextWorkspaces,
      }
    })
  }, [])

  const activateWorkspace = useCallback(
    (workspaceId) => {
      const workspace = availableWorkspaces.find(
        (candidate) => candidate.id === workspaceId,
      )

      if (workspace?.installed) {
        writeStoredActiveWorkspaceId(workspaceId)
        setRegistryState((currentState) => ({
          ...currentState,
          activeWorkspaceId: workspaceId,
        }))
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
