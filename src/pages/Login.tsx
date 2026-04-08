import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Email fixo — app de uso individual
const FIXED_EMAIL = 'lucasuchoa197@gmail.com'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await login(FIXED_EMAIL, password)
      navigate('/')
    } catch (e: unknown) {
      setError('Senha incorreta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(91,156,246,0.04) 0%, transparent 60%)',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--amber)',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}>
            PAINEL DE VIDA
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            Digite sua senha para entrar
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            autoComplete="current-password"
          />

          {error && (
            <div style={{
              fontSize: '0.8rem', color: 'var(--red)',
              background: 'var(--red-dim)', border: '1px solid rgba(224,82,82,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!password || loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
