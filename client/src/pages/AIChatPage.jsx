import { useState, useRef, useEffect } from 'react'
import { api } from '../api'

const GREETING = { role: 'assistant', content: 'שלום! אני ה-AI Coach הבריאותי שלך 🌿 שאל אותי על תזונה, כושר, שינה, או כל נושא בריאותי אחר!' }

export default function AIChatPage() {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
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
      // Send all messages except the initial hardcoded greeting
      const history = [...messages, userMsg].slice(1).map(m => ({ role: m.role, content: m.content }))
      const { message } = await api.ai.chat(history)
      setMessages(m => [...m, { role: 'assistant', content: message }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'מצטער, הייתה שגיאה. נסה שוב.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <div className="page-header">
        <div>
          <h2>🤖 AI Health Coach</h2>
          <p className="page-subtitle">שאל אותי על תזונה, כושר, שינה ובריאות כללית</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className="msg-avatar">{m.role === 'assistant' ? '🤖' : '👤'}</div>
              <div className="msg-bubble">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="msg-avatar">🤖</div>
              <div className="msg-bubble typing">
                <span /><span /><span />
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