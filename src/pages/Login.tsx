import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(password)
    } catch {
      setError('Senha incorreta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '40px', width: '100%', maxWidth: 360,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          fontWeight: 800, color: 'var(--amber)', marginBottom: 8,
        }}>
          PAINEL DE VIDA
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: 32 }}>
          Digite sua senha para entrar
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '0.95rem', marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
