import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'bot'
  text: string
}

const SUGGESTIONS = [
  "What's in the canteen today?",
  "Where is the xerox shop?",
  "Any events this week?",
  "What's in the vending machine?",
]

const WELCOME: Message = {
  id: 0,
  role: 'bot',
  text: "Hi! I'm AskVES 👋\nAsk me anything about VESIT — canteen menu, teacher locations, xerox shops, upcoming events, and more.",
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(question: string) {
    const q = question.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const res  = await fetch('http://localhost:8000/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'bot',
        text: data.answer ?? 'Got an empty response.',
      }])
    } catch {
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'bot',
        text: "Couldn't reach the server. Make sure the backend is running on port 8000. 🙏",
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  function clear() { setMessages([WELCOME]) }

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="online-dot" />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '15px', color: '#e8edf8' }}>
            AskVES Chat
          </span>
        </div>
        <button className="clear-btn" onClick={clear} title="Clear chat">
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.role}`}>
            <div className={`msg-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}

        {loading && (
          <div className="msg-row bot">
            <div className="typing-wrap">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion pills — only on fresh chat */}
      {messages.length === 1 && (
        <div className="suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggestion-pill" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          value={input}
          placeholder="Ask about canteen, teachers, xerox…"
          disabled={loading}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          className="send-btn"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
