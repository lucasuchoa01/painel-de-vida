import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTasks } from '../hooks/useTasks'
import { useDirection } from '../hooks/useDirection'
import TaskList from '../components/TaskList'
import WeeklyFocus from '../components/WeeklyFocus'
import QuickAdd from '../components/QuickAdd'

export default function Hoje() {
  const { todayTasks, overdueTasks, addTask, completeTask, skipTask, deleteTask } = useTasks()
  const { direction } = useDirection()
  const [showAdd, setShowAdd] = useState(false)

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em', marginBottom: 4 }}>
          {todayStr.toUpperCase()}
        </div>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Hoje
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Overdue alert */}
        {overdueTasks.length > 0 && (
          <div style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(224,82,82,0.25)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.05em' }}>
              ⚠ TAREFAS ATRASADAS — {overdueTasks.length} pendente{overdueTasks.length > 1 ? 's' : ''}
            </div>
            <TaskList
              tasks={overdueTasks}
              onComplete={completeTask}
              onSkip={skipTask}
              onDelete={deleteTask}
            />
          </div>
        )}

        {/* Top row: Tasks + Focus */}
        <div className="grid-2">

          {/* Tasks do dia */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                ◈ Tarefas do dia
                <span className="section-count">{todayTasks.length}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                + Nova
              </button>
            </div>
            <TaskList
              tasks={todayTasks}
              onComplete={completeTask}
              onSkip={skipTask}
              onDelete={deleteTask}
              emptyMessage="Dia livre. Aproveite ou adicione algo."
            />
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

        {/* Values row */}
        {direction?.values && direction.values.length > 0 && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">⚡ Lembretes fixos</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {direction.values.map((v, i) => (
                <span key={i} className="tag">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating add button */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--amber)',
          color: '#000',
          fontSize: '1.5rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(245,166,35,0.35)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          zIndex: 50,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        +
      </button>

      {showAdd && (
        <QuickAdd onAdd={addTask} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}
