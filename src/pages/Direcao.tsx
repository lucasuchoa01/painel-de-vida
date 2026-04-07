import { useDirection } from '../hooks/useDirection'
import DirectionBlock from '../components/DirectionBlock'

export default function Direcao() {
  const { direction, loading, saveDirection } = useDirection()

  return (
    <div className="page">
      <h1 className="page-title">🧭 Direção</h1>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Carregando...</div>
      ) : (
        <div className="card">
          <DirectionBlock direction={direction} onSave={saveDirection} />
        </div>
      )}
    </div>
  )
}
