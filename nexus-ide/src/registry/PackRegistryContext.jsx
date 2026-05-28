import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api'
import { PackRegistryContext } from './packRegistryContext'
import registry from './packs.json'

const installedExtensionIdsKey = 'nexus_installed_extensions'
const activeProjectKey = 'nexus_active_project'
const defaultProject = {
  capabilities: [],
  projectId: 'project_default',
  projectName: 'Untitled Project',
  version: '1.0.0',
}

function readStoredInstalledExtensionIds(validExtensionIds) {
  try {
    const storedValue = localStorage.getItem(installedExtensionIdsKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter((extensionId) =>
      validExtensionIds.has(extensionId),
    )
  } catch {
    return []
  }
}

function readStoredActiveProject() {
  try {
    const storedValue = localStorage.getItem(activeProjectKey)

    if (!storedValue) {
      return null
    }

    const parsedValue = JSON.parse(storedValue)

    if (!parsedValue || typeof parsedValue.projectName !== 'string') {
      return null
    }

    return {
      capabilities: Array.isArray(parsedValue.capabilities)
        ? parsedValue.capabilities.filter(
            (capability) => typeof capability === 'string',
          )
        : [],
      projectId:
        typeof parsedValue.projectId === 'string'
          ? parsedValue.projectId
          : 'project_default',
      projectName: parsedValue.projectName,
      version:
        typeof parsedValue.version === 'string' ? parsedValue.version : '1.0.0',
    }
  } catch {
    return null
  }
}

function saveProjectToServer(project) {
  if (!project?.projectId || !project?.projectName) {
    return
  }

  api
    .post('/api/project', {
      id: project.projectId,
      name: project.projectName,
    })
    .catch(() => {
      // Plain Vite dev may not have the Express persistence API running.
    })
}

function writeStoredInstalledExtensionIds(extensionIds) {
  try {
    localStorage.setItem(
      installedExtensionIdsKey,
      JSON.stringify(extensionIds),
    )
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function writeStoredActiveProject(project) {
  try {
    if (project?.projectName) {
      localStorage.setItem(activeProjectKey, JSON.stringify(project))
    } else {
      localStorage.removeItem(activeProjectKey)
    }
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function createInitialRegistryState() {
  const validExtensionIds = new Set(
    registry.extensions.map((extension) => extension.id),
  )
  const installedExtensionIds =
    readStoredInstalledExtensionIds(validExtensionIds)

  return registry.extensions.map((extension) => ({
    ...extension,
    installed:
      extension.core === true ||
      extension.installed === true ||
      installedExtensionIds.includes(extension.id),
  }))
}

function getInstalledExtensionIds(extensions) {
  return extensions
    .filter((extension) => extension.installed)
    .map((extension) => extension.id)
}

function getUniqueValues(extensions, key) {
  return Array.from(new Set(extensions.flatMap((extension) => extension[key])))
}

function getExtensionIdsForCapabilities(extensions, capabilities) {
  const requestedCapabilities = new Set(capabilities)

  return extensions
    .filter((extension) =>
      extension.capabilities.some((capability) =>
        requestedCapabilities.has(capability),
      ),
    )
    .map((extension) => extension.id)
}

export function PackRegistryProvider({ children }) {
  // Remote registry fetching will plug in here later; consumers should keep
  // reading normalized extension state instead of importing the JSON directly.
  const [availableExtensions, setAvailableExtensions] = useState(
    createInitialRegistryState,
  )
  const [activeProject, setActiveProjectState] = useState(
    () => readStoredActiveProject() ?? defaultProject,
  )

  const installedExtensions = useMemo(
    () => availableExtensions.filter((extension) => extension.installed),
    [availableExtensions],
  )
  const activePrimitives = useMemo(
    () => getUniqueValues(installedExtensions, 'primitives'),
    [installedExtensions],
  )
  // AGENT: query activeCapabilities before generating render instructions — only use capabilities available in this session
  const activeCapabilities = useMemo(
    () => getUniqueValues(installedExtensions, 'capabilities'),
    [installedExtensions],
  )
  const allCapabilities = useMemo(
    () => getUniqueValues(availableExtensions, 'capabilities'),
    [availableExtensions],
  )

  const setActiveProject = useCallback((project) => {
    const nextProject = project?.projectName
      ? {
          capabilities: Array.isArray(project.capabilities)
            ? project.capabilities
            : [],
          projectId: project.projectId ?? 'project_default',
          projectName: project.projectName,
          version: project.version ?? '1.0.0',
        }
      : defaultProject

    writeStoredActiveProject(nextProject)
    saveProjectToServer(nextProject)
    setActiveProjectState(nextProject)
  }, [])

  useEffect(() => {
    writeStoredActiveProject(activeProject)
    saveProjectToServer(activeProject)
  }, [activeProject])

  const installExtension = useCallback((extensionId) => {
    setAvailableExtensions((currentExtensions) => {
      const nextExtensions = currentExtensions.map((extension) =>
        extension.id === extensionId
          ? { ...extension, installed: true }
          : extension,
      )

      writeStoredInstalledExtensionIds(
        getInstalledExtensionIds(nextExtensions),
      )

      return nextExtensions
    })
  }, [])

  const uninstallExtension = useCallback((extensionId) => {
    setAvailableExtensions((currentExtensions) => {
      const targetExtension = currentExtensions.find(
        (extension) => extension.id === extensionId,
      )

      if (targetExtension?.core) {
        return currentExtensions
      }

      const nextExtensions = currentExtensions.map((extension) =>
        extension.id === extensionId
          ? { ...extension, installed: false }
          : extension,
      )

      writeStoredInstalledExtensionIds(
        getInstalledExtensionIds(nextExtensions),
      )

      return nextExtensions
    })
  }, [])

  const installExtensionsForCapabilities = useCallback((capabilities) => {
    const extensionIdsToInstall = new Set(
      getExtensionIdsForCapabilities(availableExtensions, capabilities),
    )
    const activatedCount = availableExtensions.filter(
      (extension) =>
        extensionIdsToInstall.has(extension.id) && !extension.installed,
    ).length

    setAvailableExtensions((currentExtensions) => {
      const nextExtensions = currentExtensions.map((extension) =>
        extensionIdsToInstall.has(extension.id)
          ? {
              ...extension,
              installed: true,
            }
          : extension,
      )

      writeStoredInstalledExtensionIds(
        getInstalledExtensionIds(nextExtensions),
      )

      return nextExtensions
    })

    return activatedCount
  }, [availableExtensions])

  const value = useMemo(
    () => ({
      activeCapabilities,
      activePrimitives,
      activeProject,
      allCapabilities,
      availableExtensions,
      availablePacks: availableExtensions,
      installExtension,
      installExtensionsForCapabilities,
      installPack: installExtension,
      installedExtensions,
      installedPacks: installedExtensions,
      setActiveProject,
      uninstallExtension,
      uninstallPack: uninstallExtension,
    }),
    [
      activeCapabilities,
      activePrimitives,
      activeProject,
      allCapabilities,
      availableExtensions,
      installExtension,
      installExtensionsForCapabilities,
      installedExtensions,
      setActiveProject,
      uninstallExtension,
    ],
  )

  return (
    <PackRegistryContext.Provider value={value}>
      {children}
    </PackRegistryContext.Provider>
  )
}
