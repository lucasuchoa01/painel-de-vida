import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setError(
        msg.includes('invalid-credential') ? 'Email ou senha incorretos.'
        : msg.includes('email-already') ? 'Email já cadastrado.'
        : msg.includes('weak-password') ? 'Senha muito fraca (mín. 6 caracteres).'
        : 'Erro ao autenticar. Tente novamente.'
      )
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
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(91,156,246,0.04) 0%, transparent 60%)',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--amber)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            PAINEL DE VIDA
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
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
            disabled={!email || !password || loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entrando...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            {isRegister ? 'Já tenho conta → Entrar' : 'Criar nova conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
