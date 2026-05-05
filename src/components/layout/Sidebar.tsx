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
      className="fixed top-0 left-0 h-screen flex flex-col z-40"
      style={{ width: 'var(--sidebar-w)', background: '#0F172A' }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{ width: 36, height: 36, background: 'var(--color-primary)' }}
          >
            <span style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>B</span>
          </div>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Berlichef
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Portal Financiero
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 10px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="flex-shrink-0" style={{ opacity: 0.7 }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', paddingLeft: 12 }}>
          v1.0 · Datos vía Google Sheets
        </p>
      </div>
    </aside>
  )
}
