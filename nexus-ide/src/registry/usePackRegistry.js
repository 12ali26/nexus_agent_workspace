import { useContext } from 'react'
import { PackRegistryContext } from './packRegistryContext'

export function usePackRegistry() {
  const context = useContext(PackRegistryContext)

  if (!context) {
    throw new Error('usePackRegistry must be used inside PackRegistryProvider')
  }

  return context
}
