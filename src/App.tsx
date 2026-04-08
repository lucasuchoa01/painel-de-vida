import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Hoje from './pages/Hoje'
import LimparCabeca from './pages/LimparCabeca'
import Direcao from './pages/Direcao'
import Evolucao from './pages/Evolucao'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Hoje />} />
            <Route path="/limpar" element={<LimparCabeca />} />
            <Route path="/direcao" element={<Direcao />} />
            <Route path="/evolucao" element={<Evolucao />} />
            <Route path="*" element={<Hoje />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
