import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTasks } from '../hooks/useTasks'
import { useDirection } from '../hooks/useDirection'
import TaskList from '../components/TaskList'
import WeeklyFocus from '../components/WeeklyFocus'
import QuickAdd from '../components/QuickAdd'

export default function Hoje() {
  const { overdueTasks, concluidasHoje, upcomingTasksByDate, addTask, completeTask, skipTask, deleteTask } = useTasks()
  const { direction } = useDirection()
  const [showAdd, setShowAdd] = useState(false)
  const [showConcluidas, setShowConcluidas] = useState(false)

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1)
  const totalPending = upcomingTasksByDate.reduce((acc, g) => acc + g.tasks.length, 0)

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em', marginBottom: 4 }}>
          {todayStr.toUpperCase()}
        </div>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Hoje</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Atrasadas */}
        {overdueTasks.length > 0 && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid rgba(224,82,82,0.25)',
            borderRadius: 'var(--radius)', padding: '14px 18px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.05em' }}>
              ⚠ TAREFAS ATRASADAS — {overdueTasks.length} pendente{overdueTasks.length > 1 ? 's' : ''}
            </div>
            <TaskList tasks={overdueTasks} onComplete={completeTask} onSkip={skipTask} onDelete={deleteTask} />
          </div>
        )}

        <div className="grid-2">

          {/* Próximas tarefas agrupadas */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                ◈ Próximas tarefas
                <span className="section-count">{totalPending}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                + Nova
              </button>
            </div>

            {upcomingTasksByDate.length === 0 && (
              <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
                Nenhuma tarefa pendente.
              </div>
            )}

            {upcomingTasksByDate.map((group) => (
              <div key={group.date} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                  color: group.label === 'Hoje' ? 'var(--amber)' : 'var(--text-3)',
                  fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6,
                }}>
                  {group.label.toUpperCase()}
                </div>
                <TaskList
                  tasks={group.tasks}
                  onComplete={completeTask}
                  onSkip={skipTask}
                  onDelete={deleteTask}
                />
              </div>
            ))}

            {/* Concluídas hoje */}
            {concluidasHoje.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowConcluidas(!showConcluidas)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', fontSize: '0.78rem',
                    display: 'flex', alignItems: 'center', gap: 6, padding: 0,
                  }}
                >
                  {showConcluidas ? '▾' : '▸'}
                  ✅ {concluidasHoje.length} concluída{concluidasHoje.length > 1 ? 's' : ''} hoje
                </button>
                {showConcluidas && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {concluidasHoje.map((t) => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg)', opacity: 0.6,
                      }}>
                        <span style={{ color: 'var(--green)', fontSize: '0.85rem' }}>✓</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', textDecoration: 'line-through' }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Foco da semana */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">🎯 Foco da semana</div>
            </div>
            <WeeklyFocus items={direction?.weeklyFocus ?? []} />
            {direction?.idealSelf && (
              <>
                <div className="divider" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--purple)', fontWeight: 600, marginBottom: 6 }}>
                    🧠 VERSÃO IDEAL
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {direction.idealSelf}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lembretes fixos */}
        {direction?.values && direction.values.length > 0 && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">⚡ Lembretes fixos</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {direction.values.map((v, i) => (
                <span key={i} className="tag">{v}</span>
              ))}
            </div>
          </div>
        )}

      </div>

      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--amber)', color: '#000',
          fontSize: '1.5rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(245,166,35,0.35)',
          transition: 'transform 0.15s', zIndex: 50,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        +
      </button>

      {showAdd && <QuickAdd onAdd={addTask} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
