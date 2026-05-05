import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Dashboard from '@/pages/Dashboard'
import EstadoResultados from '@/pages/EstadoResultados'
import CostoVenta from '@/pages/CostoVenta'
import Productos from '@/pages/Productos'
import ABCAnalysis from '@/pages/ABCAnalysis'
import GastosOperativos from '@/pages/GastosOperativos'
import UnidadesNegocio from '@/pages/UnidadesNegocio'
import Reportes from '@/pages/Reportes'
import Configuracion from '@/pages/Configuracion'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar />
        <main
          className="flex-1 min-h-screen overflow-x-hidden"
          style={{ marginLeft: 'var(--sidebar-w)' }}
        >
          <div className="max-w-screen-2xl mx-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/estado" element={<EstadoResultados />} />
              <Route path="/costo-venta" element={<CostoVenta />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/abc" element={<ABCAnalysis />} />
              <Route path="/gastos" element={<GastosOperativos />} />
              <Route path="/unidades" element={<UnidadesNegocio />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
