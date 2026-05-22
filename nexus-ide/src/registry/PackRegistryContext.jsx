import { useCallback, useMemo, useState } from 'react'
import { PackRegistryContext } from './packRegistryContext'
import registry from './packs.json'

const installedPackIdsKey = 'nexus_installed_packs'

function readStoredInstalledPackIds(validPackIds) {
  try {
    const storedValue = localStorage.getItem(installedPackIdsKey)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter((packId) => validPackIds.has(packId))
  } catch {
    return []
  }
}

function writeStoredInstalledPackIds(packIds) {
  try {
    localStorage.setItem(installedPackIdsKey, JSON.stringify(packIds))
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function createInitialRegistryState() {
  const validPackIds = new Set(registry.packs.map((pack) => pack.id))
  const installedPackIds = readStoredInstalledPackIds(validPackIds)

  return registry.packs.map((pack) => ({
    ...pack,
    installed: installedPackIds.includes(pack.id),
  }))
}

function getInstalledPackIds(packs) {
  return packs.filter((pack) => pack.installed).map((pack) => pack.id)
}

function getActivePrimitives(installedPacks) {
  return Array.from(
    new Set(installedPacks.flatMap((pack) => pack.primitives)),
  )
}

export function PackRegistryProvider({ children }) {
  // Remote registry fetching will plug in here later; consumers should keep
  // reading normalized pack state instead of importing the JSON directly.
  const [availablePacks, setAvailablePacks] = useState(createInitialRegistryState)

  const installedPacks = useMemo(
    () => availablePacks.filter((pack) => pack.installed),
    [availablePacks],
  )
  const activePrimitives = useMemo(
    () => getActivePrimitives(installedPacks),
    [installedPacks],
  )

  const installPack = useCallback((packId) => {
    setAvailablePacks((currentPacks) => {
      const nextPacks = currentPacks.map((pack) =>
        pack.id === packId ? { ...pack, installed: true } : pack,
      )

      writeStoredInstalledPackIds(getInstalledPackIds(nextPacks))

      return nextPacks
    })
  }, [])

  const uninstallPack = useCallback((packId) => {
    setAvailablePacks((currentPacks) => {
      const nextPacks = currentPacks.map((pack) =>
        pack.id === packId ? { ...pack, installed: false } : pack,
      )

      writeStoredInstalledPackIds(getInstalledPackIds(nextPacks))

      return nextPacks
    })
  }, [])

  const value = useMemo(
    () => ({
      activePrimitives,
      availablePacks,
      installPack,
      installedPacks,
      uninstallPack,
    }),
    [activePrimitives, availablePacks, installPack, installedPacks, uninstallPack],
  )

  return (
    <PackRegistryContext.Provider value={value}>
      {children}
    </PackRegistryContext.Provider>
  )
}
