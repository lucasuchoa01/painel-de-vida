import { useState } from 'react'
import { Priority, TaskImpact } from '../types'
import { format } from 'date-fns'

interface Props {
  onAdd: (data: {
    title: string
    description?: string
    date: string
    priority: Priority
    impact: TaskImpact
  }) => Promise<void>
  onClose: () => void
}

export default function QuickAdd({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [priority, setPriority] = useState<Priority>('media')
  const [impact, setImpact] = useState<TaskImpact>('neutro')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    await onAdd({ title: title.trim(), description: description.trim() || undefined, date, priority, impact })
    setLoading(false)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fade-in"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          width: '100%',
          maxWidth: 480,
        }}
        onKeyDown={handleKeyDown}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
          + Nova Tarefa
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            placeholder="Título da tarefa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Descrição (opcional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                DATA
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                PRIORIDADE
              </label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                IMPACTO $
              </label>
              <select value={impact} onChange={(e) => setImpact(e.target.value as TaskImpact)}>
                <option value="ganha">💰 Ganha</option>
                <option value="gasta">💸 Gasta</option>
                <option value="neutro">○ Neutro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!title.trim() || loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Salvando...' : '+ Adicionar'}
            </button>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textAlign: 'right' }}>
            ⌘↵ para salvar · Esc para fechar
          </div>
        </div>
      </div>
    </div>
  )
}
