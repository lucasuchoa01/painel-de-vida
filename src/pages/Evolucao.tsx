import { useDailyLog } from '../hooks/useDailyLog'
import { useTasks } from '../hooks/useTasks'
import DailyReview from '../components/DailyReview'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const skipReasonLabel: Record<string, string> = {
  preguica: '😴 Preguiça',
  tempo: '⏱ Sem tempo',
  esqueci: '🫥 Esqueci',
  dificil: '🧱 Difícil',
}

export default function Evolucao() {
  const { logs, todayLog, saveLog } = useDailyLog()
  const { tasks } = useTasks()

  // Tasks overdue by 2+ days with reason tracking
  const problematicTasks = tasks.filter(
    (t) =>
      t.status === 'pendente' &&
      differenceInDays(new Date(), parseISO(t.date)) >= 2
  )

  // Skip reason stats
  const reasonCounts: Record<string, number> = {}
  tasks.forEach((t) => {
    if (t.reason) {
      reasonCounts[t.reason] = (reasonCounts[t.reason] ?? 0) + 1
    }
  })
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]

  const recentLogs = logs.slice(0, 7)

  return (
    <div className="page">
      <h1 className="page-title">📈 Evolução</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Alerts */}
        {problematicTasks.length > 0 && (
          <div style={{
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginBottom: 10, letterSpacing: '0.05em' }}>
              ⚠ TAREFAS SENDO ADIADAS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {problematicTasks.map((t) => {
                const days = differenceInDays(new Date(), parseISO(t.date))
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.83rem', color: 'var(--text)',
                  }}>
                    <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', minWidth: 40 }}>
                      +{days}d
                    </span>
                    <span>{t.title}</span>
                    {t.reason && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                        {skipReasonLabel[t.reason]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Insight de padrão */}
        {topReason && (
          <div style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.83rem',
            color: 'var(--text-2)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🔎</span>
            <span>
              Seu principal motivo de adiamento é{' '}
              <strong style={{ color: 'var(--text)' }}>{skipReasonLabel[topReason[0]]}</strong>
              {' '}({topReason[1]}x)
            </span>
          </div>
        )}

        <div className="grid-2">

          {/* Review do dia */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">📝 Review de hoje</div>
            </div>
            <DailyReview todayLog={todayLog} onSave={saveLog} />
          </div>

          {/* Histórico */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                🗓 Últimos reviews
                <span className="section-count">{recentLogs.length}</span>
              </div>
            </div>

            {recentLogs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📖</div>
                <div>Nenhum review ainda.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', marginBottom: 8 }}>
                      {format(parseISO(log.date), "EEE, dd/MM", { locale: ptBR }).toUpperCase()}
                    </div>
                    {log.good && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}>
                        <span style={{ color: 'var(--green)' }}>✅</span> {log.good}
                      </div>
                    )}
                    {log.bad && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}>
                        <span style={{ color: 'var(--red)' }}>❌</span> {log.bad}
                      </div>
                    )}
                    {log.improve && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--blue)' }}>🔁</span> {log.improve}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
