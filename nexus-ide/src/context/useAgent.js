import { useContext } from 'react'
import { AgentContext } from './agentContext'

export function useAgent() {
  const context = useContext(AgentContext)

  if (!context) {
    throw new Error('useAgent must be used inside AgentProvider')
  }

  return context
}
