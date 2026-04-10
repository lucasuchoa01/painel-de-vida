import { useState } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { useTasks } from '../hooks/useTasks'
import DailyReview from '../components/DailyReview'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DailyLog } from '../types'

const skipReasonLabel: Record<string, string> = {
  preguica: '😴 Preguiça',
  tempo: '⏱ Sem tempo',
  esqueci: '🫥 Esqueci',
  dificil: '🧱 Difícil',
}

const Pill = ({ text, onRemove, color }: { text: string; onRemove: () => void; color?: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', background: 'var(--bg-4)',
    border: `1px solid ${color ?? 'var(--border)'}`, borderRadius: 20,
    fontSize: '0.8rem', color: 'var(--text-2)',
  }}>
    {text}
    <button onClick={onRemove} style={{ color: 'var(--text-3)', fontSize: '0.7rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
  </span>
)

function LogCard({ log, onEdit, onDelete }: { log: DailyLog; onEdit: (log: DailyLog) => void; onDelete: (id: string) => void }) {
  const [hovering, setHovering] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
          {format(parseISO(log.date), "EEE, dd/MM", { locale: ptBR }).toUpperCase()}
        </div>
        {hovering && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onEdit(log)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-3)', padding: '2px 6px' }}
            >✎ Editar</button>
            <button
              onClick={() => { if (confirm('Excluir este review?')) onDelete(log.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--red)', padding: '2px 6px' }}
            >🗑 Excluir</button>
          </div>
        )}
      </div>
      {log.good && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}><span style={{ color: 'var(--green)' }}>✅</span> {log.good}</div>}
      {log.bad && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}><span style={{ color: 'var(--red)' }}>❌</span> {log.bad}</div>}
      {log.improve && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}><span style={{ color: 'var(--blue)' }}>🔁</span> {log.improve}</div>}
    </div>
  )
}

export default function Evolucao() {
  const { logs, todayLog, saveLog, deleteLog, growAreas, toStudy, saveEvolutionConfig } = useDailyLog()
  const { tasks } = useTasks()

  const [growInput, setGrowInput] = useState('')
  const [studyInput, setStudyInput] = useState('')
  const [localGrow, setLocalGrow] = useState<string[] | null>(null)
  const [localStudy, setLocalStudy] = useState<string[] | null>(null)
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)

  const currentGrow = localGrow ?? growAreas
  const currentStudy = localStudy ?? toStudy

  const addGrow = async () => {
    if (!growInput.trim()) return
    const next = [...currentGrow, growInput.trim()]
    setLocalGrow(next)
    setGrowInput('')
    await saveEvolutionConfig({ growAreas: next, toStudy: currentStudy })
  }

  const removeGrow = async (i: number) => {
    const next = currentGrow.filter((_, j) => j !== i)
    setLocalGrow(next)
    await saveEvolutionConfig({ growAreas: next, toStudy: currentStudy })
  }

  const addStudy = async () => {
    if (!studyInput.trim()) return
    const next = [...currentStudy, studyInput.trim()]
    setLocalStudy(next)
    setStudyInput('')
    await saveEvolutionConfig({ growAreas: currentGrow, toStudy: next })
  }

  const removeStudy = async (i: number) => {
    const next = currentStudy.filter((_, j) => j !== i)
    setLocalStudy(next)
    await saveEvolutionConfig({ growAreas: currentGrow, toStudy: next })
  }

  const problematicTasks = tasks.filter(
    (t) => t.status === 'pendente' && differenceInDays(new Date(), parseISO(t.date)) >= 2
  )

  const reasonCounts: Record<string, number> = {}
  tasks.forEach((t) => {
    if (t.reason) reasonCounts[t.reason] = (reasonCounts[t.reason] ?? 0) + 1
  })
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]
  const recentLogs = logs.slice(0, 7)

  return (
    <div className="page">
      <h1 className="page-title">📈 Evolução</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {problematicTasks.length > 0 && (
          <div style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginBottom: 10, letterSpacing: '0.05em' }}>
              ⚠ TAREFAS SENDO ADIADAS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {problematicTasks.map((t) => {
                const days = differenceInDays(new Date(), parseISO(t.date))
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.83rem', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', minWidth: 40 }}>+{days}d</span>
                    <span>{t.title}</span>
                    {t.reason && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-3)' }}>{skipReasonLabel[t.reason]}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {topReason && (
          <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.83rem', color: 'var(--text-2)' }}>
            <span style={{ fontSize: '1.1rem' }}>🔎</span>
            <span>Seu principal motivo de adiamento é <strong style={{ color: 'var(--text)' }}>{skipReasonLabel[topReason[0]]}</strong> ({topReason[1]}x)</span>
          </div>
        )}

        <div className="grid-2">
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                {editingLog ? `✎ Editando review de ${format(parseISO(editingLog.date), "dd/MM", { locale: ptBR })}` : '📝 Review de hoje'}
              </div>
              {editingLog && (
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setEditingLog(null)}>
                  Cancelar
                </button>
              )}
            </div>
            <DailyReview
              todayLog={editingLog ?? todayLog}
              onSave={async (data) => {
                if (editingLog) {
                  await saveLog(data, editingLog.id)
                  setEditingLog(null)
                } else {
                  await saveLog(data)
                }
              }}
            />
          </div>

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
                  <LogCard
                    key={log.id}
                    log={log}
                    onEdit={(l) => setEditingLog(l)}
                    onDelete={(id) => deleteLog(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="section-header">
              <div className="section-title">🧠 Em que posso evoluir</div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
              Áreas de conhecimento ou habilidades que você quer desenvolver. Ex: estoicismo, linguagem corporal, neurociência.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input placeholder="Ex: Estoicismo, linguagem corporal..." value={growInput} onChange={(e) => setGrowInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGrow()} />
              <button className="btn btn-ghost" onClick={addGrow}>+</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentGrow.map((v, i) => (
                <Pill key={i} text={v} color="rgba(167,139,250,0.3)" onRemove={() => removeGrow(i)} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <div className="section-title">🔍 Coisas para pesquisar / estudar</div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
              Temas, livros, vídeos ou assuntos que você quer investigar. Adicione quando lembrar, consuma quando puder.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input placeholder="Ex: Livro A Arte da Guerra, mercado de opções..." value={studyInput} onChange={(e) => setStudyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStudy()} />
              <button className="btn btn-ghost" onClick={addStudy}>+</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentStudy.map((v, i) => (
                <Pill key={i} text={v} color="rgba(251,191,36,0.3)" onRemove={() => removeStudy(i)} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
