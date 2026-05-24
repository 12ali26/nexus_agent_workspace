import { useCallback, useMemo, useState } from 'react'
import { AgentContext } from './agentContext'
import registry from '../registry/agents.json'

const activeAgentStorageKey = 'nexus_active_agent'

function getAgentKeyStorageKey(agentId) {
  return `nexus_agent_${agentId}_key`
}

function readStoredAgentState(agents) {
  try {
    const storedValue = localStorage.getItem(activeAgentStorageKey)

    if (!storedValue) {
      return null
    }

    const parsedValue = JSON.parse(storedValue)
    const agent = agents.find((availableAgent) => availableAgent.id === parsedValue?.agentId)

    if (!agent) {
      return null
    }

    const model = agent.models.includes(parsedValue.model)
      ? parsedValue.model
      : agent.defaultModel

    return {
      agentId: agent.id,
      model,
    }
  } catch {
    return null
  }
}

function writeStoredAgentState(agentState) {
  try {
    if (agentState?.agentId) {
      localStorage.setItem(activeAgentStorageKey, JSON.stringify(agentState))
    } else {
      localStorage.removeItem(activeAgentStorageKey)
    }
  } catch {
    // Agent connection state is a local convenience; the UI can run without it.
  }
}

function readStoredAgentKey(agentId) {
  try {
    return localStorage.getItem(getAgentKeyStorageKey(agentId)) ?? ''
  } catch {
    return ''
  }
}

function writeStoredAgentKey(agentId, key) {
  try {
    if (key) {
      localStorage.setItem(getAgentKeyStorageKey(agentId), key)
    }
  } catch {
    // Browser storage can be unavailable in locked-down contexts.
  }
}

export function AgentProvider({ children }) {
  const availableAgents = registry.agents
  const [connection, setConnection] = useState(() =>
    readStoredAgentState(availableAgents),
  )
  const [isThinking, setAgentThinking] = useState(false)

  const activeAgent = useMemo(
    () =>
      availableAgents.find((agent) => agent.id === connection?.agentId) ?? null,
    [availableAgents, connection?.agentId],
  )
  const agentKey = activeAgent ? readStoredAgentKey(activeAgent.id) : ''
  const agentModel = activeAgent ? connection?.model ?? activeAgent.defaultModel : ''
  const isConnected = Boolean(activeAgent)

  const connectAgent = useCallback(
    (agentId, key, model) => {
      const agent = availableAgents.find(
        (availableAgent) => availableAgent.id === agentId,
      )

      if (!agent) {
        return false
      }

      const nextModel = agent.models.includes(model) ? model : agent.defaultModel

      if (agent.connection === 'api-key') {
        writeStoredAgentKey(agent.id, key)
      }

      const nextConnection = {
        agentId: agent.id,
        model: nextModel,
      }

      writeStoredAgentState(nextConnection)
      setConnection(nextConnection)
      return true
    },
    [availableAgents],
  )

  const disconnectAgent = useCallback(() => {
    writeStoredAgentState(null)
    setConnection(null)
  }, [])

  const value = useMemo(
    () => ({
      activeAgent,
      agentKey,
      agentModel,
      availableAgents,
      connectAgent,
      disconnectAgent,
      isConnected,
      isThinking,
      setAgentThinking,
    }),
    [
      activeAgent,
      agentKey,
      agentModel,
      availableAgents,
      connectAgent,
      disconnectAgent,
      isConnected,
      isThinking,
      setAgentThinking,
    ],
  )

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}
