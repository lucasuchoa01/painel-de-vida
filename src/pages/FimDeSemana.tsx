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

type ParsedIdea = { title: string; category: string; description?: string }

function normalizeTitle(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function categoryFromHeading(heading: string) {
  const value = heading.toLowerCase()
  if (value.includes('esportes')) return 'Esporte'
  if (value.includes('aventura')) return 'Aventura'
  if (value.includes('bares') || value.includes('gastronomia')) return 'Gastronomia'
  if (value.includes('jogos')) return 'Lazer'
  if (value.includes('passeios') || value.includes('parques') || value.includes('eventos')) return 'Cultura'
  if (value.includes('viagens')) return 'Viagem'
  if (value.includes('amigos') || value.includes('família')) return 'Social'
  if (value.includes('tranquilos') || value.includes('individuais')) return 'Desenvolvimento pessoal'
  return 'Outros'
}

function parseIdeas(text: string): ParsedIdea[] {
  const result: ParsedIdea[] = []
  let currentCategory = 'Outros'
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^#{0,3}\s*\d+\.\s*(.+)$/) || line.match(/^#{1,3}\s*(.+)$/)
    if (heading) {
      currentCategory = categoryFromHeading(heading[1])
      continue
    }
    if (/^\d+\.\s/.test(line) && !line.startsWith('- ')) continue
    if (!/^[-*•]\s+/.test(line)) continue

    let item = line.replace(/^[-*•]\s+/, '').trim()
    const completedMark = /(?:✅|☑️|✓)\s*$/.test(item)
    item = item.replace(/(?:✅|☑️|✓)\s*$/, '').trim()
    const urls = [...item.matchAll(/\((https?:\/\/[^)]+)\)|\[(?:[^\]]*)\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1] || m[2]).filter(Boolean)
    item = item.replace(/\s*[—–-]\s*\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '').trim()
    item = item.replace(/\s*[—–-]\s*\[([^\]]+)\]/g, '').trim()
    item = item.replace(/\s*[—–-]\s*(?:pesquisar no Google|ver TikTok).*$/i, '').trim()
    item = item.replace(/\s+/g, ' ')
    if (!item) continue
    const notes: string[] = []
    if (urls.length) notes.push(`Link: ${urls.join(' | ')}`)
    if (/pesquisar no Google/i.test(line)) notes.push('Pesquisar no Google')
    if (completedMark) notes.push('Marcado como já realizado na lista original')
    result.push({ title: item, category: currentCategory, ...(notes.length ? { description: notes.join(' · ') } : {}) })
  }
  return result
}

export default function FimDeSemana() {
  const { ideas, plans, loading, addIdea, addIdeasBulk, updateIdea, deleteIdea, addPlan, updatePlan, deletePlan } = useExperiences()
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
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

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
  const parsedIdeas = useMemo(() => parseIdeas(importText), [importText])
  const importPreview = useMemo(() => {
    const existing = new Set(ideas.map(idea => normalizeTitle(idea.title)))
    const seen = new Set<string>()
    const unique: ParsedIdea[] = []
    let duplicates = 0
    parsedIdeas.forEach(item => {
      const key = normalizeTitle(item.title)
      if (!key || existing.has(key) || seen.has(key)) { duplicates += 1; return }
      seen.add(key); unique.push(item)
    })
    return { unique, duplicates }
  }, [parsedIdeas, ideas])

  const importIdeas = async () => {
    if (!importPreview.unique.length) return
    setImporting(true); setImportError('')
    try {
      await addIdeasBulk(importPreview.unique)
      setImportText(''); setShowImport(false); setTab('ideias')
      alert(`${importPreview.unique.length} ideias importadas com sucesso!`)
    } catch (error) {
      console.error(error)
      setImportError('Não foi possível importar. Verifique sua conexão e as regras do Firebase e tente novamente.')
    } finally { setImporting(false) }
  }

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
      <button className="btn btn-ghost btn-sm" onClick={() => { setShowImport(true); setImportError('') }}>⇧ Importar ideias</button>
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

    {showImport && <Modal title="Importar ideias em massa" onClose={() => setShowImport(false)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: 'var(--text-3)', fontSize: '.82rem', lineHeight: 1.5 }}>Cole uma lista com títulos e itens iniciados por hífen. Os títulos numerados serão usados para identificar as categorias automaticamente.</div>
        <textarea autoFocus rows={12} value={importText} onChange={e => setImportText(e.target.value)} placeholder={'# 1. Esportes e atividades físicas\n- Academia\n- Futebol\n\n# 2. Aventura, natureza e ar livre\n- Trilha'} style={{ width: '100%', resize: 'vertical' }} />
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}><strong>Prévia da importação</strong><span className="tag">{importPreview.unique.length} novas</span></div>
          <div style={{ color: 'var(--text-3)', fontSize: '.78rem', marginBottom: 8 }}>{parsedIdeas.length} identificadas · {importPreview.duplicates} duplicadas ou já cadastradas serão ignoradas.</div>
          {importPreview.unique.length > 0 ? <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {importPreview.unique.slice(0, 30).map((item, index) => <div key={`${item.title}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '.8rem', borderTop: '1px solid var(--border)', paddingTop: 6 }}><span>{item.title}</span><span style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{item.category}</span></div>)}
            {importPreview.unique.length > 30 && <div style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>e mais {importPreview.unique.length - 30} ideias...</div>}
          </div> : <div style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>Nenhuma ideia nova identificada. Confira se cada atividade começa com hífen (-).</div>}
        </div>
        {importError && <div style={{ color: 'var(--red)', fontSize: '.8rem' }}>{importError}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowImport(false)} disabled={importing}>Fechar</button>
          <button className="btn btn-primary" onClick={importIdeas} disabled={!importPreview.unique.length || importing}>{importing ? 'Importando...' : `Importar ${importPreview.unique.length} ideias`}</button>
        </div>
      </div>
    </Modal>}

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
