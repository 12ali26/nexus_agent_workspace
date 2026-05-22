import { useState } from 'react'

function AgentPanel() {
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([])

  const sendMessage = (event) => {
    event.preventDefault()

    const trimmedMessage = messageText.trim()

    if (!trimmedMessage) {
      return
    }

    // The Anthropic/API call will plug in here next.
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: 'You',
        text: trimmedMessage,
      },
      {
        id: crypto.randomUUID(),
        role: 'Nexus',
        text: 'Agent connection coming soon.',
      },
    ])
    setMessageText('')
  }

  return (
    <section className="workspace-panel agent-panel" aria-label="Agent">
      <header className="panel-header">AGENT</header>

      <div className="agent-history">
        {messages.length ? (
          messages.map((message) => (
            <article className="agent-message" key={message.id}>
              <div>{message.role}</div>
              <p>{message.text}</p>
            </article>
          ))
        ) : (
          <p className="agent-empty">No messages yet.</p>
        )}
      </div>

      <form className="agent-composer" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Ask the agent anything..."
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  )
}

export default AgentPanel
