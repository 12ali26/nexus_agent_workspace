import { useContext } from 'react'
import { ParameterContext } from './parameterContext'

export function useParameters() {
  const context = useContext(ParameterContext)

  if (!context) {
    throw new Error('useParameters must be used inside ParameterProvider')
  }

  return context
}
