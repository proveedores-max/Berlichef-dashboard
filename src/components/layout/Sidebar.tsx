import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  TrendingDown,
  ShoppingBag,
  BarChart3,
  Wallet,
  Building2,
  FileText,
  Settings,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/estado', icon: BarChart2, label: 'Estado de Resultados' },
  { to: '/costo-venta', icon: TrendingDown, label: 'Costo de Venta' },
  { to: '/productos', icon: ShoppingBag, label: 'Productos' },
  { to: '/abc', icon: BarChart3, label: 'Análisis ABC' },
  { to: '/gastos', icon: Wallet, label: 'Gastos Operativos' },
  { to: '/unidades', icon: Building2, label: 'Unidades de Negocio' },
  { to: '/reportes', icon: FileText, label: 'Reportes' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-white border-r border-surface-100 flex flex-col z-40"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Logo */}
      <div className="p-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-lg">B</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm text-surface-900 leading-tight">Berlichef</p>
            <p className="text-xs text-surface-400">Portal Financiero</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-100">
        <p className="text-xs text-surface-300 text-center">v1.0 · Datos vía Google Sheets</p>
      </div>
    </aside>
  )
}
