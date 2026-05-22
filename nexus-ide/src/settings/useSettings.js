import { useContext } from 'react'
import { SettingsContext } from './settingsContext'

export function useSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider')
  }

  return context
}
