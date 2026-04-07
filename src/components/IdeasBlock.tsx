import { useState } from 'react'

interface Props {
  items: { id: string; text?: string; content?: string }[]
  onAdd: (data: { content?: string; text?: string }) => Promise<void>
  onRemove: (id: string) => void
  placeholder: string
  field: 'content' | 'text'
  color?: string
}

export default function IdeasBlock({ items, onAdd, onRemove, placeholder, field, color = 'var(--text-2)' }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!input.trim()) return
    setLoading(true)
    await onAdd({ [field]: input.trim() })
    setInput('')
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0 }}
        >
          +
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', padding: '8px 0' }}>
          Nenhum item ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => {
            const text = item.content ?? item.text ?? ''
            return (
              <div
                key={item.id}
                className="fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '9px 12px',
                  background: 'var(--bg-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ flex: 1, fontSize: '0.85rem', color, lineHeight: 1.5 }}>{text}</span>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{ color: 'var(--text-3)', fontSize: '0.75rem', flexShrink: 0, paddingTop: 2 }}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
