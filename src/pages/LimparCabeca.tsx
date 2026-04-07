import { useIdeas, useDistractions, useDiscarded } from '../hooks/useIdeas'
import IdeasBlock from '../components/IdeasBlock'

export default function LimparCabeca() {
  const ideas = useIdeas()
  const distractions = useDistractions()
  const discarded = useDiscarded()

  return (
    <div className="page">
      <h1 className="page-title">🧹 Limpar a Cabeça</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--red)' }}>
              ❌ Coisas que me atrapalham
              <span className="section-count">{distractions.items.length}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14 }}>
            O que está roubando sua atenção? O que te tira do foco?
          </p>
          <IdeasBlock
            items={distractions.items.map(i => ({ id: i.id, text: i.text }))}
            onAdd={distractions.add}
            onRemove={distractions.remove}
            placeholder="Ex: redes sociais, notificações, preocupações..."
            field="text"
            color="var(--red)"
          />
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--text-3)' }}>
              🗑️ Coisas que não valem mais a pena
              <span className="section-count">{discarded.items.length}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14 }}>
            Compromisos, hábitos ou projetos que você precisa largar.
          </p>
          <IdeasBlock
            items={discarded.items.map(i => ({ id: i.id, text: i.text }))}
            onAdd={discarded.add}
            onRemove={discarded.remove}
            placeholder="Ex: projeto X, reunião Y, hábito Z..."
            field="text"
            color="var(--text-3)"
          />
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--amber)' }}>
              💡 Ideias livres
              <span className="section-count">{ideas.items.length}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14 }}>
            Sem filtro. Jogue pra fora qualquer ideia que estiver na cabeça.
          </p>
          <IdeasBlock
            items={ideas.items.map(i => ({ id: i.id, content: i.content }))}
            onAdd={ideas.add}
            onRemove={ideas.remove}
            placeholder="Qualquer coisa que vier à mente..."
            field="content"
            color="var(--amber)"
          />
        </div>

      </div>
    </div>
  )
}
