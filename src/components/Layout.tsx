import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Hoje', icon: '◈', exact: true },
  { to: '/limpar', label: 'Limpar a Cabeça', icon: '🗑' },
  { to: '/direcao', label: 'Direção', icon: '🧭' },
  { to: '/evolucao', label: 'Evolução', icon: '📈' },
  { to: '/livre', label: 'Página Livre', icon: '📄' },
]

const NAV_W = 200

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = window.innerWidth < 768

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        />
      )}

      {/* Sidebar — fixa no desktop, gaveta no mobile */}
      <nav style={{
        width: NAV_W,
        minWidth: NAV_W,
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 20,
        transform: isMobile && !menuOpen ? `translateX(-${NAV_W}px)` : 'translateX(0)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '1.1rem',
            fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.02em',
          }}>
            PAINEL DE VIDA
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--amber)' : 'var(--text-2)',
                background: isActive ? 'var(--amber-dim)' : 'transparent',
                border: isActive ? '1px solid var(--amber-border)' : '1px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header só no mobile */}
        {isMobile && (
          <header style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-2)', position: 'sticky', top: 0, zIndex: 5,
          }}>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--amber)',
                fontSize: '1.4rem', cursor: 'pointer', padding: 0, lineHeight: 1,
              }}
            >
              ☰
            </button>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '1rem',
              fontWeight: 800, color: 'var(--amber)',
            }}>
              PAINEL DE VIDA
            </span>
          </header>
        )}

        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
