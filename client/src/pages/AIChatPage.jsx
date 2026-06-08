import { useState, useRef, useEffect } from 'react'
import { api } from '../api'

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'שלום! אני ה-AI Coach הבריאותי שלך 🌿 איך אוכל לעזור לך היום?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
        .map(m => ({ role: m.role, content: m.content }))

      const { message } = await api.ai.chat(history)
      setMessages(m => [...m, { role: 'assistant', content: message }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: 'מצטער, הייתה שגיאה. נסה שוב.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page chat-page">
      <div className="page-header">
        <h2>🤖 AI Health Coach</h2>
        <p className="page-subtitle">שאל אותי על תזונה, כושר, שינה, ובריאות כללית</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.role === 'assistant' && <span className="msg-avatar">🤖</span>}
              <div className="msg-bubble">{m.content}</div>
              {m.role === 'user' && <span className="msg-avatar">👤</span>}
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <span className="msg-avatar">🤖</span>
              <div className="msg-bubble typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="שאל שאלה בנושא בריאות..."
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            ➤ שלח
          </button>
        </form>
      </div>
    </div>
  )
}