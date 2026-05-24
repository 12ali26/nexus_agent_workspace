import { useMemo, useState } from 'react'
import { useAgent } from '../context/useAgent'
import { createTableColumns } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { useRenderBlocks } from '../renderBlocks/useRenderBlocks'

const SYSTEM_PROMPT = `You are the NEXUS IDE agent — an AI assistant embedded in a universal computational workspace.

The user is working in a statistical and mathematical computing environment. They may have data loaded, parameters set, equations on the canvas, or code running.

When the user sends a message you respond with TWO things:

1. A short conversational message (2-3 sentences max) explaining what you are doing
2. A JSON block of render instructions wrapped in <nexus_render> tags

Render instructions are an array of blocks. Each block has a type and data:

table — data: { columns: ["col1","col2"], rows: [{"col1": val, "col2": val}] }
equation — data: { formula: "latex string", resolved: "human readable result" }
chart — data: { title: "title", xKey: "x", yKey: "y", data: [{x: val, y: val}] }
assumption-flag — data: { assumptions: [{ id: 1, label: "name", value: "value", status: "Pending" }] }
progress-step — data: { steps: [{ id: 1, title: "title", description: "desc", status: "Complete|Active|Pending" }] }
prose-block — data: { content: "markdown with latex string" }

Always include both the conversational message and the nexus_render block.
Make render instructions relevant, realistic and domain appropriate.
If the user asks a simple question with no visual output needed, return an empty nexus_render array.`

function formatTimestamp(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function createChatMessage(role, text) {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: new Date(),
  }
}

function extractAgentResponse(fullResponse) {
  const renderMatch = fullResponse.match(
    /<nexus_render>([\s\S]*?)<\/nexus_render>/i,
  )
  const text = fullResponse
    .replace(/<nexus_render>[\s\S]*?<\/nexus_render>/i, '')
    .trim()

  if (!renderMatch) {
    return {
      renderInstructions: [],
      text,
    }
  }

  try {
    const parsedInstructions = JSON.parse(renderMatch[1].trim())

    return {
      renderInstructions: Array.isArray(parsedInstructions)
        ? parsedInstructions
        : [],
      text,
    }
  } catch (error) {
    console.error('Failed to parse nexus_render instructions', error)
    return {
      renderInstructions: [],
      text,
    }
  }
}

function getInstructionData(instruction) {
  return instruction?.data && typeof instruction.data === 'object'
    ? instruction.data
    : {}
}

function createAgentPrimitivePayload(instruction, registeredDataset) {
  const data = getInstructionData(instruction)
  const basePayload = {
    meta: {
      source: 'agent',
    },
  }

  if (instruction?.type === 'table') {
    const columns = Array.isArray(data.columns)
      ? data.columns
      : Object.keys(data.rows?.[0] ?? {})
    const rows = Array.isArray(data.rows) ? data.rows : []

    return {
      ...basePayload,
      type: 'table',
      data: {
        title: data.title ?? registeredDataset?.name ?? 'Agent Table',
        props: {
          columns: createTableColumns(columns),
          data: rows,
          datasetId: registeredDataset?.id ?? '',
        },
      },
    }
  }

  if (instruction?.type === 'equation') {
    return {
      ...basePayload,
      type: 'equation',
      data: {
        title: data.title ?? 'Agent Equation',
        props: {
          formula: data.formula ?? '',
          resolvedValue: data.resolved ?? data.resolvedValue ?? '',
        },
      },
    }
  }

  if (instruction?.type === 'chart') {
    return {
      ...basePayload,
      type: 'chart',
      data: {
        title: data.title ?? 'Agent Chart',
        props: {
          data: Array.isArray(data.data) ? data.data : [],
          lineKey: data.yKey ?? data.lineKey ?? 'y',
          title: data.title ?? 'Agent Chart',
          xKey: data.xKey ?? 'x',
          yLabel: data.yKey ?? data.lineKey ?? 'Value',
        },
      },
    }
  }

  if (instruction?.type === 'assumption-flag') {
    return {
      ...basePayload,
      type: 'assumption-flag',
      data: {
        title: data.title ?? 'Agent Assumptions',
        props: {
          assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
        },
      },
    }
  }

  if (instruction?.type === 'progress-step') {
    return {
      ...basePayload,
      type: 'progress-step',
      data: {
        title: data.title ?? 'Agent Progress',
        props: {
          steps: Array.isArray(data.steps) ? data.steps : [],
        },
      },
    }
  }

  if (instruction?.type === 'prose-block') {
    return {
      ...basePayload,
      type: 'prose-block',
      data: {
        title: data.title ?? 'Agent Notes',
        props: {
          content: data.content ?? '',
        },
      },
    }
  }

  return null
}

function AgentCard({ agent, onConnect }) {
  return (
    <article className="agent-card">
      <div
        className="agent-color-dot"
        style={{ background: agent.color }}
        aria-hidden="true"
      />
      <div className="agent-card-copy">
        <h3>{agent.name}</h3>
        <span>{agent.provider}</span>
        <p>{agent.description}</p>
      </div>
      <button type="button" onClick={() => onConnect(agent)}>
        Connect
      </button>
    </article>
  )
}

function AgentConnectionModal({ agent, onClose }) {
  const { agentKey, connectAgent } = useAgent()
  const [apiKey, setApiKey] = useState(
    agent.connection === 'api-key' ? agentKey : '',
  )
  const [error, setError] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [localConnectionReady, setLocalConnectionReady] = useState(false)
  const [model, setModel] = useState(agent.defaultModel)

  const connect = () => {
    if (agent.connection === 'api-key' && !apiKey.trim()) {
      setError(`${agent.keyLabel} is required`)
      return
    }

    if (agent.connection === 'local' && !localConnectionReady) {
      setError(`Test ${agent.name} before connecting`)
      return
    }

    connectAgent(agent.id, apiKey.trim(), model)
    onClose()
  }

  const testLocalConnection = async () => {
    setError('')
    setIsTesting(true)

    try {
      const response = await fetch(`${agent.endpoint}/health`)

      if (!response.ok) {
        throw new Error('Health check failed')
      }

      setLocalConnectionReady(true)
    } catch {
      setLocalConnectionReady(false)
      setError(
        `Could not reach ${agent.endpoint}. Make sure ${agent.name} is running.`,
      )
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="project-modal agent-connect-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-connect-title"
      >
        <header className="project-modal-header">
          <div>
            <h2 id="agent-connect-title">{agent.name}</h2>
            <p>{agent.provider}</p>
          </div>
          <button
            className="primitive-close"
            type="button"
            aria-label="Close agent connection modal"
            onClick={onClose}
          >
            x
          </button>
        </header>

        <div className="agent-connect-body">
          {agent.connection === 'api-key' ? (
            <>
              <label className="agent-connect-field">
                <span>{agent.keyLabel}</span>
                <input
                  type="password"
                  value={apiKey}
                  placeholder={agent.keyPlaceholder}
                  onChange={(event) => {
                    setApiKey(event.target.value)
                    setError('')
                  }}
                />
              </label>
              <a href={agent.keyUrl} target="_blank" rel="noreferrer">
                {agent.keyHint}
              </a>
            </>
          ) : (
            <div className="agent-local-test">
              <span>Endpoint</span>
              <code>{agent.endpoint}</code>
              <button
                type="button"
                disabled={isTesting}
                onClick={testLocalConnection}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              {localConnectionReady && (
                <p className="agent-success">Connection reachable</p>
              )}
            </div>
          )}

          <label className="agent-connect-field">
            <span>Model</span>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {agent.models.map((agentModel) => (
                <option key={agentModel} value={agentModel}>
                  {agentModel}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="agent-error">{error}</p>}
        </div>

        <div className="project-modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={connect}>
            Connect
          </button>
        </div>
      </section>
    </div>
  )
}

function AgentPanel() {
  const {
    activeAgent,
    agentKey,
    agentModel,
    availableAgents,
    disconnectAgent,
    isConnected,
    isThinking,
    setAgentThinking,
  } = useAgent()
  const { addDataset } = useWorkspaceData()
  const { addPrimitiveBlock } = useRenderBlocks()
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const sortedAgents = useMemo(
    () => [...availableAgents].sort((first, second) => first.name.localeCompare(second.name)),
    [availableAgents],
  )

  const pushRenderInstructions = (renderInstructions) => {
    renderInstructions.forEach((instruction) => {
      let registeredDataset = null

      if (instruction?.type === 'table') {
        const data = getInstructionData(instruction)
        const rows = Array.isArray(data.rows) ? data.rows : []

        if (rows.length) {
          registeredDataset = addDataset({
            columns: Array.isArray(data.columns) ? data.columns : undefined,
            name: data.title ?? 'agent_table',
            rows,
            source: 'agent',
          })
        }
      }

      const primitivePayload = createAgentPrimitivePayload(
        instruction,
        registeredDataset,
      )

      if (primitivePayload) {
        addPrimitiveBlock(primitivePayload)
      }
    })
  }

  const callOpenRouter = async (chatHistory, userMessage) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NEXUS IDE',
      },
      body: JSON.stringify({
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatHistory.map((message) => ({
            content: message.text,
            role: message.role === 'You' ? 'user' : 'assistant',
          })),
          { role: 'user', content: userMessage },
        ],
        model: agentModel,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenRouter request failed')
    }

    const data = await response.json()
    const fullResponse = data?.choices?.[0]?.message?.content

    if (!fullResponse) {
      throw new Error('OpenRouter response was empty')
    }

    return fullResponse
  }

  const sendMessage = async (event) => {
    event.preventDefault()

    const trimmedMessage = messageText.trim()

    if (!trimmedMessage || !activeAgent || isThinking) {
      return
    }

    const userMessage = createChatMessage('You', trimmedMessage)

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setMessageText('')

    if (activeAgent.protocol !== 'openrouter') {
      setMessages((currentMessages) => [
        ...currentMessages,
        createChatMessage(activeAgent.name, 'Agent connection coming soon'),
      ])
      return
    }

    setAgentThinking(true)

    try {
      const fullResponse = await callOpenRouter(messages, trimmedMessage)
      const { renderInstructions, text } = extractAgentResponse(fullResponse)

      setMessages((currentMessages) => [
        ...currentMessages,
        createChatMessage(activeAgent.name, text || 'Done.'),
      ])
      pushRenderInstructions(renderInstructions)
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        createChatMessage(
          activeAgent.name,
          'Could not reach OpenRouter. Check your connection.',
        ),
      ])
    } finally {
      setAgentThinking(false)
    }
  }

  if (!isConnected) {
    return (
      <section className="workspace-panel agent-panel browse" aria-label="Agents">
        <header className="panel-header">AGENTS</header>
        <p className="agent-panel-subtitle">
          Connect an AI agent to your workspace
        </p>

        <div className="agent-browser">
          {sortedAgents.map((agent) => (
            <AgentCard
              agent={agent}
              key={agent.id}
              onConnect={setSelectedAgent}
            />
          ))}
        </div>

        {selectedAgent && (
          <AgentConnectionModal
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </section>
    )
  }

  return (
    <section className="workspace-panel agent-panel active" aria-label="Agent">
      <header className="panel-header">AGENT</header>

      <div className="agent-active-summary">
        <div
          className="agent-color-dot"
          style={{ background: activeAgent.color }}
          aria-hidden="true"
        />
        <div>
          <strong>{activeAgent.name}</strong>
          <span>{activeAgent.provider}</span>
          <p>{agentModel}</p>
        </div>
        <span className="agent-connected-pill">
          <span aria-hidden="true" />
          Connected
        </span>
        <button type="button" onClick={disconnectAgent}>
          Disconnect
        </button>
      </div>

      <div className="agent-history">
        {messages.length ? (
          <>
            {messages.map((message) => (
              <article className="agent-message" key={message.id}>
                <div>
                  <span>{message.role}</span>
                  <time>{formatTimestamp(message.timestamp)}</time>
                </div>
                <p>{message.text}</p>
              </article>
            ))}
            {isThinking && (
              <article className="agent-message is-typing">
                <div>
                  <span>{activeAgent.name}</span>
                  <time>Thinking</time>
                </div>
                <p>Typing...</p>
              </article>
            )}
          </>
        ) : (
          <>
            <p className="agent-empty">No messages yet.</p>
            {isThinking && (
              <article className="agent-message is-typing">
                <div>
                  <span>{activeAgent.name}</span>
                  <time>Thinking</time>
                </div>
                <p>Typing...</p>
              </article>
            )}
          </>
        )}
      </div>

      <form className="agent-composer" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder={`Ask ${activeAgent.name} anything...`}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
        />
        <button type="submit" disabled={isThinking}>
          {isThinking ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  )
}

export default AgentPanel
