import { useCallback, useMemo, useState } from 'react'
import { SettingsContext } from './settingsContext'

const settingsStorageKey = 'nexus.settings'

const defaultSettings = {
  agentModel: 'Claude Sonnet',
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

function normalizeStoredSettings(value) {
  if (!value || typeof value !== 'object') {
    return defaultSettings
  }

  return {
    agentModel: validAgentModels.has(value.agentModel)
      ? value.agentModel
      : defaultSettings.agentModel,
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

  const value = useMemo(
    () => ({
      agentModel: settings.agentModel,
      registrySource: settings.registrySource,
      setAgentModel,
      setRegistrySource,
      setTheme,
      theme: settings.theme,
    }),
    [
      setAgentModel,
      setRegistrySource,
      setTheme,
      settings.agentModel,
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
