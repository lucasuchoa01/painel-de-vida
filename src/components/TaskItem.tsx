import { useState } from 'react'
import { Task, SkipReason } from '../types'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  task: Task
  onComplete: (id: string) => void
  onSkip: (id: string, reason: SkipReason) => void
  onDelete: (id: string) => void
}

const impactLabel: Record<string, string> = {
  ganha: '💰 ganha',
  gasta: '💸 gasta',
  neutro: '○ neutro',
}

const skipReasons: { value: SkipReason; label: string }[] = [
  { value: 'preguica', label: '😴 Preguiça' },
  { value: 'tempo', label: '⏱ Sem tempo' },
  { value: 'esqueci', label: '🫥 Esqueci' },
  { value: 'dificil', label: '🧱 Difícil' },
]

export default function TaskItem({ task, onComplete, onSkip, onDelete }: Props) {
  const [showSkip, setShowSkip] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const daysDiff = differenceInDays(new Date(), parseISO(task.date))
  const isOverdue = task.date < format(new Date(), 'yyyy-MM-dd')
  const daysOverdue = isOverdue ? differenceInDays(new Date(), parseISO(task.date)) : 0

  return (
    <div
      className="fade-in"
      style={{
        background: 'var(--bg-3)',
        border: `1px solid ${isOverdue ? 'rgba(224,82,82,0.2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Priority dot */}
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          background: task.priority === 'alta' ? 'var(--red)'
            : task.priority === 'media' ? 'var(--amber)'
            : 'var(--green)',
        }} />

        {/* Title */}
        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)' }}>
          {task.title}
        </span>

        {/* Overdue badge */}
        {daysOverdue > 0 && (
          <span className="overdue-alert">+{daysOverdue}d</span>
        )}

        {/* Impact */}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {impactLabel[task.impact]}
        </span>

        {/* Expand arrow */}
        <span style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginLeft: 4 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
          {task.description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', margin: '10px 0 12px' }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            <span className={`badge badge-${task.impact}`}>{task.impact}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              {format(parseISO(task.date), "dd 'de' MMM", { locale: ptBR })}
            </span>
          </div>

          {/* Skip reason display */}
          {task.reason && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-3)' }}>
              Motivo adiamento: <span style={{ color: 'var(--amber)' }}>{task.reason}</span>
            </div>
          )}

          {/* Skip reason picker */}
          {showSkip && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-2)' }}>Por que está adiando?</span>
              {skipReasons.map((r) => (
                <button
                  key={r.value}
                  className="btn btn-ghost btn-sm"
                  onClick={() => { onSkip(task.id, r.value); setShowSkip(false) }}
                >
                  {r.label}
                </button>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSkip(false)}>Cancelar</button>
            </div>
          )}

          {/* Actions */}
          {!showSkip && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-success btn-sm" onClick={() => onComplete(task.id)}>
                ✓ Resolver agora
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSkip(true)}>
                ↩ Adiar
              </button>
              <button
                className="btn btn-danger btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => onDelete(task.id)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
