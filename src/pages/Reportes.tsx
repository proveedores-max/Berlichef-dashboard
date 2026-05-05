import { useEffect } from 'react'
import { Download } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  computeABC,
  computeCategoryCosts,
  computeUDNSummaries,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import { fmtNum } from '@/lib/formatters'
import {
  exportTransactions,
  exportABC,
  exportCategories,
  exportUDNSummary,
  exportFinancials,
} from '@/lib/exporters'

interface ReportCardProps {
  icon: string
  title: string
  description: string
  count: number
  onExport: () => void
  disabled: boolean
}

function ReportCard({ icon, title, description, count, onExport, disabled }: ReportCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-surface-800 mb-0.5">{title}</p>
        <p className="text-sm text-surface-400">{description} · {fmtNum(count)} registros</p>
      </div>
      <button onClick={onExport} disabled={disabled} className="btn-primary text-xs flex-shrink-0">
        <Download size={13} />
        Excel
      </button>
    </div>
  )
}

export default function Reportes() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const financials = useFilteredFinancials()
  const sales = useFilteredSales()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const abcItems = computeABC(transactions)
  const categories = computeCategoryCosts(transactions)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales)

  const reports = [
    {
      icon: '📦',
      title: 'Costo de venta detallado',
      description: 'Todos los registros de costo de venta con filtros aplicados',
      count: transactions.length,
      onExport: () => exportTransactions(transactions),
      disabled: transactions.length === 0,
    },
    {
      icon: '📊',
      title: 'Análisis ABC',
      description: 'Clasificación de productos por participación en costo',
      count: abcItems.length,
      onExport: () => exportABC(abcItems),
      disabled: abcItems.length === 0,
    },
    {
      icon: '🏷️',
      title: 'Costo por categoría',
      description: 'Resumen de costo de venta agrupado por categoría',
      count: categories.length,
      onExport: () => exportCategories(categories),
      disabled: categories.length === 0,
    },
    {
      icon: '🏢',
      title: 'Comparativo por UDN',
      description: 'KPIs financieros completos por unidad de negocio',
      count: udnSummaries.length,
      onExport: () => exportUDNSummary(udnSummaries),
      disabled: udnSummaries.length === 0,
    },
    {
      icon: '💳',
      title: 'Gastos operativos',
      description: 'Detalle de gastos operativos y nómina',
      count: financials.length,
      onExport: () => exportFinancials(financials),
      disabled: financials.length === 0,
    },
  ]

  return (
    <div className="animate-fade-in">
      <Header title="Reportes" subtitle="Exporta datos a Excel con los filtros aplicados" />
      <FilterPanel />

      <div className="mb-4">
        <p className="text-xs text-surface-400">Todos los reportes respetan los filtros activos</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-4 mb-6">
        {reports.map((r) => (
          <ReportCard key={r.title} {...r} />
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm font-semibold text-surface-700 mb-3">¿Cómo usar los filtros con reportes?</p>
        <ul className="text-sm text-surface-500 space-y-1.5">
          <li>• Aplica los filtros deseados en el panel superior (mes, UDN, categoría, etc.)</li>
          <li>• Los reportes exportan únicamente los datos que coinciden con los filtros activos</li>
          <li>• Para exportar todos los datos, haz clic en <strong>Limpiar</strong> en el panel de filtros</li>
          <li>• Usa Ctrl/Cmd para seleccionar múltiples valores en los filtros de lista</li>
        </ul>
      </div>
    </div>
  )
}
