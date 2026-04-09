import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Hoje from './pages/Hoje'
import LimparCabeca from './pages/LimparCabeca'
import Direcao from './pages/Direcao'
import Evolucao from './pages/Evolucao'
import PaginaLivre from './pages/PaginaLivre'

function PrivateRoutes() {
  const { user } = useAuth()
  if (!user) return <Login />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Hoje />} />
        <Route path="/limpar" element={<LimparCabeca />} />
        <Route path="/direcao" element={<Direcao />} />
        <Route path="/evolucao" element={<Evolucao />} />
        <Route path="/livre" element={<PaginaLivre />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PrivateRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
