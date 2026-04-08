import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Hoje from './pages/Hoje'
import LimparCabeca from './pages/LimparCabeca'
import Direcao from './pages/Direcao'
import Evolucao from './pages/Evolucao'

// App sem login — uso individual
export default function App() {
  return (
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
  )
}
