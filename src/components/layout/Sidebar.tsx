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

const mainNav = [
  { to: '/',         icon: LayoutDashboard, label: 'Inicio' },
  { to: '/estado',   icon: BarChart2,       label: 'Estado de Resultados' },
  { to: '/costo-venta', icon: TrendingDown, label: 'Costo de Venta' },
  { to: '/productos',   icon: ShoppingBag,  label: 'Productos' },
  { to: '/abc',         icon: BarChart3,    label: 'Análisis ABC' },
  { to: '/gastos',      icon: Wallet,       label: 'Gastos Operativos' },
  { to: '/unidades',    icon: Building2,    label: 'Unidades de Negocio' },
]

const toolsNav = [
  { to: '/reportes',       icon: FileText, label: 'Reportes' },
  { to: '/configuracion',  icon: Settings, label: 'Configuración' },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof FileText; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Icon size={16} className="nav-icon" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
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
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Análisis</p>
        {mainNav.map((item) => <NavItem key={item.to} {...item} />)}

        <div className="sidebar-divider" />

        <p className="sidebar-section-label">Herramientas</p>
        {toolsNav.map((item) => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="version-tag">v1.0 · Datos vía Google Sheets</span>
      </div>
    </aside>
  )
}
