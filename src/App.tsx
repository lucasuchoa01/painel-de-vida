import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Hoje from './pages/Hoje'
import LimparCabeca from './pages/LimparCabeca'
import Direcao from './pages/Direcao'
import Evolucao from './pages/Evolucao'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: 'var(--amber)',
          opacity: 0.6,
        }}>
          PAINEL DE VIDA
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Hoje /></ProtectedRoute>} />
      <Route path="/limpar" element={<ProtectedRoute><LimparCabeca /></ProtectedRoute>} />
      <Route path="/direcao" element={<ProtectedRoute><Direcao /></ProtectedRoute>} />
      <Route path="/evolucao" element={<ProtectedRoute><Evolucao /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
