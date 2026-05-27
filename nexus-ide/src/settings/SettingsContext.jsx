import { useCallback, useMemo, useState } from 'react'
import { SettingsContext } from './settingsContext'

const settingsStorageKey = 'nexus.settings'

const defaultSettings = {
  agentModel: 'Claude Sonnet',
  exportSettings: {
    includeCoverPage: true,
    paperSize: 'A4',
    resolution: 2,
  },
  registrySource: 'Local',
  theme: 'dark',
}

const validAgentModels = new Set([
  'Claude Sonnet',
  'Claude Opus',
  'Claude Haiku',
])
const validRegistrySources = new Set(['Local'])
const validThemes = new Set(['dark', 'light'])
const validPaperSizes = new Set(['A4', 'A3', 'Letter'])
const validResolutions = new Set([1, 2, 3])

function normalizeExportSettings(value) {
  const currentValue = value && typeof value === 'object' ? value : {}

  return {
    includeCoverPage:
      typeof currentValue.includeCoverPage === 'boolean'
        ? currentValue.includeCoverPage
        : defaultSettings.exportSettings.includeCoverPage,
    paperSize: validPaperSizes.has(currentValue.paperSize)
      ? currentValue.paperSize
      : defaultSettings.exportSettings.paperSize,
    resolution: validResolutions.has(Number(currentValue.resolution))
      ? Number(currentValue.resolution)
      : defaultSettings.exportSettings.resolution,
  }
}

function normalizeStoredSettings(value) {
  if (!value || typeof value !== 'object') {
    return defaultSettings
  }

  return {
    agentModel: validAgentModels.has(value.agentModel)
      ? value.agentModel
      : defaultSettings.agentModel,
    exportSettings: normalizeExportSettings(value.exportSettings),
    registrySource: validRegistrySources.has(value.registrySource)
      ? value.registrySource
      : defaultSettings.registrySource,
    theme: validThemes.has(value.theme) ? value.theme : defaultSettings.theme,
  }
}

function readStoredSettings() {
  try {
    const storedValue = localStorage.getItem(settingsStorageKey)

    if (!storedValue) {
      return defaultSettings
    }

    return normalizeStoredSettings(JSON.parse(storedValue))
  } catch {
    return defaultSettings
  }
}

function writeStoredSettings(settings) {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
  } catch {
    // Settings are local conveniences; the app should keep running without them.
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings)

  const updateSettings = useCallback((partialSettings) => {
    setSettings((currentSettings) => {
      const nextSettings = normalizeStoredSettings({
        ...currentSettings,
        ...partialSettings,
      })
      writeStoredSettings(nextSettings)
      return nextSettings
    })
  }, [])

  const setAgentModel = useCallback(
    (agentModel) => updateSettings({ agentModel }),
    [updateSettings],
  )

  const setRegistrySource = useCallback(
    (registrySource) => updateSettings({ registrySource }),
    [updateSettings],
  )

  const setTheme = useCallback(
    (theme) => updateSettings({ theme }),
    [updateSettings],
  )

  const setExportSettings = useCallback(
    (exportSettings) =>
      updateSettings({
        exportSettings: {
          ...settings.exportSettings,
          ...exportSettings,
        },
      }),
    [settings.exportSettings, updateSettings],
  )

  const value = useMemo(
    () => ({
      agentModel: settings.agentModel,
      exportSettings: settings.exportSettings,
      registrySource: settings.registrySource,
      setAgentModel,
      setExportSettings,
      setRegistrySource,
      setTheme,
      theme: settings.theme,
    }),
    [
      setAgentModel,
      setExportSettings,
      setRegistrySource,
      setTheme,
      settings.agentModel,
      settings.exportSettings,
      settings.registrySource,
      settings.theme,
    ],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
