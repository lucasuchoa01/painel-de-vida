interface Props {
  items: string[]
}

export default function WeeklyFocus({ items }: Props) {
  if (!items.length) {
    return (
      <div className="empty" style={{ padding: '20px 0' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
          Nenhum foco definido — vá em Direção para configurar.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 3).map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--amber)',
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber-border)',
            borderRadius: '4px',
            padding: '1px 6px',
            minWidth: 22,
            textAlign: 'center',
          }}>
            {i + 1}
          </span>
          <span style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}
