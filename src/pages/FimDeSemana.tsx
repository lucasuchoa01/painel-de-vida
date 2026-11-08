import { FormEvent, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Experience, WeekendPlan, useExperiences } from '../hooks/useExperiences'

const categories = ['Lazer', 'Social', 'Aventura', 'Esporte', 'Viagem', 'Gastronomia', 'Cultura', 'Desenvolvimento pessoal', 'Outros']
const today = () => format(new Date(), 'yyyy-MM-dd')

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div className="fade-in" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-2)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius)', padding: 24 }}>
      <div className="section-header"><div className="section-title">{title}</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
      {children}
    </div>
  </div>
}

export default function FimDeSemana() {
  const { ideas, plans, loading, addIdea, updateIdea, deleteIdea, addPlan, updatePlan, deletePlan } = useExperiences()
  const [tab, setTab] = useState<'planos' | 'ideias' | 'historico'>('planos')
  const [modal, setModal] = useState<'idea' | 'plan' | null>(null)
  const [editingIdea, setEditingIdea] = useState<Experience | null>(null)
  const [editingPlan, setEditingPlan] = useState<WeekendPlan | null>(null)
  const [sourceIdeaId, setSourceIdeaId] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Lazer')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => { setTitle(''); setCategory('Lazer'); setCustomCategory(''); setDescription(''); setDate(today()); setTime(''); setEditingIdea(null); setEditingPlan(null); setSourceIdeaId(undefined); setModal(null) }
  const openIdea = (idea?: Experience) => {
    setEditingIdea(idea || null); setSourceIdeaId(undefined); setTitle(idea?.title || ''); setCategory(idea?.category || 'Lazer'); setCustomCategory(''); setDescription(idea?.description || ''); setModal('idea')
  }
  const openPlan = (idea?: Experience, plan?: WeekendPlan) => {
    setEditingPlan(plan || null); setSourceIdeaId(idea?.id || plan?.experienceId); setTitle(plan?.title || idea?.title || ''); setCategory(plan?.category || idea?.category || 'Lazer'); setCustomCategory(''); setDescription(plan?.description || idea?.description || ''); setDate(plan?.date || today()); setTime(plan?.time || ''); setModal('plan')
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const finalCategory = customCategory.trim() || category
      if (modal === 'idea') {
        const data = { title: title.trim(), category: finalCategory, description: description.trim() }
        if (editingIdea) await updateIdea(editingIdea.id, data)
        else await addIdea(data)
      } else if (modal === 'plan') {
        const data = { title: title.trim(), category: finalCategory, description: description.trim(), date, time, ...(sourceIdeaId ? { experienceId: sourceIdeaId } : {}) }
        if (editingPlan) await updatePlan(editingPlan.id, data)
        else await addPlan(data)
      }
      resetForm()
    } catch (error) {
      console.error(error)
      alert('Não foi possível salvar. Verifique sua conexão e as regras do Firebase.')
    } finally { setSaving(false) }
  }

  const upcoming = useMemo(() => plans.filter(p => p.status === 'planejado' && p.date >= today()), [plans])
  const history = useMemo(() => plans.filter(p => p.status !== 'planejado' || p.date < today()).sort((a, b) => b.date.localeCompare(a.date)), [plans])
  const grouped = useMemo(() => upcoming.reduce<Record<string, WeekendPlan[]>>((acc, plan) => { (acc[plan.date] ||= []).push(plan); return acc }, {}), [upcoming])
  const dateLabel = (value: string) => format(new Date(`${value}T12:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const actionButton = (label: string, action: () => void) => <button className="btn btn-ghost btn-sm" onClick={action}>{label}</button>

  return <div className="page">
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: '.72rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '.1em', marginBottom: 4 }}>VIDA FORA DA ROTINA</div>
      <h1 className="page-title" style={{ marginBottom: 6 }}>Fim de semana</h1>
      <div style={{ color: 'var(--text-3)', fontSize: '.88rem' }}>Guarde ideias, planeje seus dias livres e acompanhe o que viveu.</div>
    </div>

    <div className="grid-2" style={{ marginBottom: 20 }}>
      <div className="card"><div className="section-title">◈ Planos futuros <span className="section-count">{upcoming.length}</span></div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--amber)', marginTop: 10 }}>{upcoming.length}</div><div style={{ color: 'var(--text-3)', fontSize: '.78rem' }}>atividades planejadas</div></div>
      <div className="card"><div className="section-title">✦ Banco de ideias <span className="section-count">{ideas.length}</span></div><div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--amber)', marginTop: 10 }}>{ideas.length}</div><div style={{ color: 'var(--text-3)', fontSize: '.78rem' }}>experiências para escolher</div></div>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
      {([['planos', 'Meus planos'], ['ideias', 'Banco de ideias'], ['historico', 'Histórico']] as const).map(([key, label]) => <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>{label}</button>)}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost btn-sm" onClick={() => openIdea()}>+ Nova ideia</button>
      <button className="btn btn-primary btn-sm" onClick={() => openPlan()}>+ Planejar atividade</button>
    </div>

    {loading ? <div className="card" style={{ color: 'var(--text-3)' }}>Carregando seus dados...</div> : <>
      {tab === 'planos' && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.keys(grouped).length === 0 && <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Nenhum plano por enquanto. Escolha uma ideia ou cadastre algo que gostaria de fazer.</div>}
        {Object.entries(grouped).map(([day, items]) => <div className="card" key={day}>
          <div className="section-header"><div className="section-title">{dateLabel(day)} <span className="section-count">{items.length}</span></div></div>
          {items.map(plan => <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'var(--amber-dim)', color: 'var(--amber)', fontSize: 18 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{plan.title}</div><div style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>{plan.time || 'Horário livre'} · {plan.category}</div>{plan.description && <div style={{ color: 'var(--text-2)', fontSize: '.8rem', marginTop: 4 }}>{plan.description}</div>}</div>
            {actionButton('✓', () => updatePlan(plan.id, { status: 'realizado' }))}{actionButton('Cancelar', () => updatePlan(plan.id, { status: 'cancelado' }))}{actionButton('Editar', () => openPlan(undefined, plan))}{actionButton('Excluir', () => { if (confirm('Excluir este planejamento?')) deletePlan(plan.id) })}
          </div>)}
        </div>)}
      </div>}

      {tab === 'ideias' && <div className="card">
        <div className="section-header"><div className="section-title">Suas ideias <span className="section-count">{ideas.length}</span></div></div>
        {ideas.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Seu banco está vazio. Adicione experiências que gostaria de viver.</div>}
        {ideas.map(idea => <div key={idea.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{idea.title}</div><div style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>{idea.category}{idea.description ? ` · ${idea.description}` : ''}</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => openPlan(idea)}>Planejar</button>{actionButton('Editar', () => openIdea(idea))}{actionButton('Excluir', () => { if (confirm('Excluir esta ideia? Os planejamentos já criados serão preservados.')) deleteIdea(idea.id) })}
        </div>)}
      </div>}

      {tab === 'historico' && <div className="card">
        <div className="section-title">Atividades anteriores <span className="section-count">{history.length}</span></div>
        {history.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Suas experiências concluídas aparecerão aqui.</div>}
        {history.map(plan => <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, textDecoration: plan.status === 'realizado' ? 'line-through' : 'none' }}>{plan.title}</div><div style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>{dateLabel(plan.date)} · {plan.category}</div></div>
          <span className="tag">{plan.status === 'realizado' ? 'Realizado' : plan.status === 'cancelado' ? 'Cancelado' : 'Data passada'}</span>
          {plan.status === 'planejado' && actionButton('Concluir', () => updatePlan(plan.id, { status: 'realizado' }))}
          {actionButton('Excluir', () => { if (confirm('Excluir do histórico?')) deletePlan(plan.id) })}
        </div>)}
      </div>}
    </>}

    {modal && <Modal title={modal === 'idea' ? (editingIdea ? 'Editar ideia' : 'Nova ideia') : (editingPlan ? 'Editar planejamento' : 'Planejar atividade')} onClose={resetForm}>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>O QUE VOCÊ QUER FAZER?</label>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Ir ao cinema" required />
        <label style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>CATEGORIA</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
        <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Ou digite uma categoria própria (opcional)" />
        {modal === 'plan' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>DATA</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required min={today()} /></div>
          <div><label style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>HORÁRIO</label><input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
        </div>}
        <label style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>DETALHES (OPCIONAL)</label>
        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Local, companhia, observações..." />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}><button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button><button className="btn btn-primary" disabled={!title.trim() || saving}>{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </form>
    </Modal>}
  </div>
}
