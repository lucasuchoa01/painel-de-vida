import { useState } from 'react'
import { usePages } from '../hooks/usePages'
import { FreePage, FreeSectionType } from '../types'

export default function PaginaLivre() {
  const {
    pages, loading,
    createPage, updatePage, deletePage,
    addSection, updateSection, deleteSection,
    moveSectionUp, moveSectionDown,
    addItem, toggleItem, removeItem,
  } = usePages()

  const [selectedPage, setSelectedPage] = useState<FreePage | null>(null)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [addingPage, setAddingPage] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionType, setNewSectionType] = useState<FreeSectionType>('list')
  const [addingSection, setAddingSection] = useState(false)
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({})
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // Sync selectedPage com updates do Firestore
  const currentPage = selectedPage ? pages.find((p) => p.id === selectedPage.id) ?? null : null

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return
    await createPage(newPageTitle.trim())
    setNewPageTitle('')
    setAddingPage(false)
  }

  const handleAddSection = async () => {
    if (!currentPage || !newSectionTitle.trim()) return
    await addSection(currentPage, newSectionType, newSectionTitle.trim())
    setNewSectionTitle('')
    setAddingSection(false)
  }

  const handleAddItem = async (sectionId: string) => {
    if (!currentPage || !itemInputs[sectionId]?.trim()) return
    await addItem(currentPage, sectionId, itemInputs[sectionId].trim())
    setItemInputs((prev) => ({ ...prev, [sectionId]: '' }))
  }

  // LISTA DE PÁGINAS
  if (!currentPage) {
    return (
      <div className="page">
        <h1 className="page-title">📄 Página Livre</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nova página */}
          {addingPage ? (
            <div className="card" style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                placeholder="Nome da página..."
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
              />
              <button className="btn btn-primary" onClick={handleCreatePage}>Criar</button>
              <button className="btn btn-ghost" onClick={() => setAddingPage(false)}>Cancelar</button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setAddingPage(true)}
            >
              + Nova página
            </button>
          )}

          {/* Lista de páginas */}
          {loading ? (
            <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Carregando...</div>
          ) : pages.length === 0 ? (
            <div className="card">
              <div className="empty">
                <div className="empty-icon">📄</div>
                <div>Nenhuma página ainda. Crie a primeira!</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => setSelectedPage(page)}
                >
                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text)' }}>
                    📄 {page.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    {page.sections.length} seção{page.sections.length !== 1 ? 'ões' : ''}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Deletar "${page.title}"?`)) deletePage(page.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // PÁGINA ABERTA
  return (
    <div className="page">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          className="btn btn-ghost"
          onClick={() => setSelectedPage(null)}
          style={{ fontSize: '0.85rem' }}
        >
          ← Voltar
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={async () => {
              if (titleDraft.trim()) await updatePage(currentPage.id, { title: titleDraft.trim() })
              setEditingTitle(false)
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                if (titleDraft.trim()) await updatePage(currentPage.id, { title: titleDraft.trim() })
                setEditingTitle(false)
              }
            }}
            style={{ fontSize: '1.4rem', fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid var(--amber)', color: 'var(--text)', outline: 'none' }}
          />
        ) : (
          <h1
            className="page-title"
            style={{ marginBottom: 0, cursor: 'pointer' }}
            onClick={() => { setTitleDraft(currentPage.title); setEditingTitle(true) }}
            title="Clique para editar"
          >
            {currentPage.title} ✎
          </h1>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Seções */}
        {currentPage.sections.map((section, idx) => (
          <div key={section.id} className="card">

            {/* Header da seção */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {section.type === 'list' ? '📋' : '📝'}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{section.title}</span>

              {/* Reordenar */}
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                onClick={() => moveSectionUp(currentPage, section.id)}
                disabled={idx === 0}
              >↑</button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                onClick={() => moveSectionDown(currentPage, section.id)}
                disabled={idx === currentPage.sections.length - 1}
              >↓</button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--red)' }}
                onClick={() => { if (confirm('Deletar seção?')) deleteSection(currentPage, section.id) }}
              >🗑</button>
            </div>

            {/* Conteúdo: Lista */}
            {section.type === 'list' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    placeholder="Adicionar item..."
                    value={itemInputs[section.id] ?? ''}
                    onChange={(e) => setItemInputs((prev) => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(section.id)}
                  />
                  <button className="btn btn-ghost" onClick={() => handleAddItem(section.id)}>+</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleItem(currentPage, section.id, item.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--amber)' }}
                      />
                      <span style={{
                        flex: 1, fontSize: '0.88rem', color: 'var(--text-2)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        opacity: item.done ? 0.5 : 1,
                      }}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeItem(currentPage, section.id, item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >✕</button>
                    </div>
                  ))}
                  {section.items.length === 0 && (
                    <div style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Nenhum item ainda.</div>
                  )}
                </div>
              </div>
            )}

            {/* Conteúdo: Texto */}
            {section.type === 'text' && (
              <textarea
                rows={4}
                placeholder="Escreva aqui..."
                value={section.content}
                onChange={(e) => updateSection(currentPage, section.id, { content: e.target.value })}
                onBlur={(e) => updateSection(currentPage, section.id, { content: e.target.value })}
              />
            )}
          </div>
        ))}

        {/* Adicionar seção */}
        {addingSection ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              autoFocus
              placeholder="Título da seção..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${newSectionType === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setNewSectionType('list')}
              >
                📋 Lista
              </button>
              <button
                className={`btn ${newSectionType === 'text' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setNewSectionType('text')}
              >
                📝 Texto
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleAddSection}>Adicionar</button>
              <button className="btn btn-ghost" onClick={() => setAddingSection(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setAddingSection(true)}
          >
            + Adicionar seção
          </button>
        )}
      </div>
    </div>
  )
}
