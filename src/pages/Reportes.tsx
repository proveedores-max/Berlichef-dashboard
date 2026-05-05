import { useEffect, useState } from 'react'
import { Download, Loader2, Info } from 'lucide-react'
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
  downloadMultipleReports,
  type MultiExportData,
} from '@/lib/exporters'
import type { ReportKey } from '@/lib/exporters'

interface ReportCardProps {
  reportKey:   ReportKey
  icon:        string
  title:       string
  description: string
  count:       number
  onExport:    () => void
  disabled:    boolean
  isSelected:  boolean
  onToggle:    () => void
}

function ReportCard({ icon, title, description, count, onExport, disabled, isSelected, onToggle }: ReportCardProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try { await Promise.resolve(onExport()) } finally { setTimeout(() => setLoading(false), 800) }
  }

  return (
    <div className={`report-card ${isSelected ? 'report-card--selected' : ''}`}>
      {/* Checkbox */}
      <label className="report-card-checkbox">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
        <span className="report-card-checkbox-mark" />
      </label>

      <div className="report-card-left" style={{ paddingLeft: 28 }}>
        <div className="report-card-icon">{icon}</div>
        <div>
          <div className="report-card-header-row">
            <span className="report-card-title">{title}</span>
            <span className="report-card-count">{fmtNum(count)}</span>
          </div>
          <p className="report-card-desc">{description}</p>
        </div>
      </div>

      <button onClick={handleExport} disabled={disabled || loading} className="btn-excel" style={{ flexShrink: 0 }}>
        {loading ? <Loader2 size={13} className="btn-spinner" /> : <Download size={13} />}
        {loading ? 'Exportando…' : 'Excel'}
      </button>
    </div>
  )
}

export default function Reportes() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const financials   = useFilteredFinancials()
  const sales        = useFilteredSales()

  const [selectedReports, setSelectedReports] = useState<Set<ReportKey>>(new Set())
  const [isDownloading, setIsDownloading]     = useState(false)

  useEffect(() => { if (!data) fetchData() }, [data, fetchData])

  const abcItems    = computeABC(transactions)
  const categories  = computeCategoryCosts(transactions)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales)

  const toggleReport = (key: ReportKey) => {
    setSelectedReports((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const reports: { reportKey: ReportKey; icon: string; title: string; description: string; count: number; onExport: () => void; disabled: boolean }[] = [
    {
      reportKey:   'costoVentaDetallado',
      icon:        '📦',
      title:       'Costo de venta detallado',
      description: 'Todos los registros de costo de venta con filtros aplicados',
      count:       transactions.length,
      onExport:    () => exportTransactions(transactions),
      disabled:    transactions.length === 0,
    },
    {
      reportKey:   'analisisAbc',
      icon:        '📊',
      title:       'Análisis ABC',
      description: 'Clasificación de productos por participación en costo',
      count:       abcItems.length,
      onExport:    () => exportABC(abcItems),
      disabled:    abcItems.length === 0,
    },
    {
      reportKey:   'costoPorCategoria',
      icon:        '🏷️',
      title:       'Costo por categoría',
      description: 'Resumen de costo de venta agrupado por categoría',
      count:       categories.length,
      onExport:    () => exportCategories(transactions),
      disabled:    transactions.length === 0,
    },
    {
      reportKey:   'comparativoUDN',
      icon:        '🏢',
      title:       'Comparativo por UDN',
      description: 'KPIs financieros completos por unidad de negocio',
      count:       udnSummaries.length,
      onExport:    () => exportUDNSummary(udnSummaries),
      disabled:    udnSummaries.length === 0,
    },
    {
      reportKey:   'gastosOperativos',
      icon:        '💳',
      title:       'Gastos operativos',
      description: 'Detalle de gastos operativos y nómina',
      count:       financials.length,
      onExport:    () => exportFinancials(financials),
      disabled:    financials.length === 0,
    },
  ]

  const handleMultiDownload = async () => {
    setIsDownloading(true)
    try {
      const exportData: MultiExportData = { transactions, abcItems, categories: transactions, udnSummaries, financials }
      await downloadMultipleReports(selectedReports as Set<string>, exportData)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <Header title="Reportes" subtitle="Exporta datos a Excel con los filtros aplicados" />
      <FilterPanel />

      <div className="grid xl:grid-cols-2 gap-4 mb-6">
        {reports.map((r) => (
          <ReportCard
            key={r.reportKey}
            {...r}
            isSelected={selectedReports.has(r.reportKey)}
            onToggle={() => toggleReport(r.reportKey)}
          />
        ))}
      </div>

      <div className="report-info-box">
        <div className="report-info-icon"><Info size={16} /></div>
        <div>
          <p className="report-info-title">¿Cómo usar los filtros con reportes?</p>
          <ul className="report-info-list">
            <li>Aplica los filtros deseados en el panel superior (mes, UDN, categoría, etc.)</li>
            <li>Los reportes exportan únicamente los datos que coinciden con los filtros activos</li>
            <li>Para exportar todos los datos, haz clic en <strong>Limpiar</strong> en el panel de filtros</li>
            <li>Selecciona 2 o más reportes con los checkboxes para descargarlos en un solo archivo Excel</li>
          </ul>
        </div>
      </div>

      {/* Sticky multi-download bar */}
      {selectedReports.size >= 2 && (
        <div className="multi-download-bar">
          <div className="multi-download-bar-info">
            <span className="multi-download-count">{selectedReports.size}</span>
            <span className="multi-download-label">
              {selectedReports.size === 1 ? 'reporte seleccionado' : 'reportes seleccionados'}
            </span>
          </div>
          <div className="multi-download-bar-actions">
            <button
              className="btn-clear-selection"
              onClick={() => setSelectedReports(new Set())}
            >
              Limpiar selección
            </button>
            <button
              className="btn-multi-download"
              onClick={handleMultiDownload}
              disabled={isDownloading}
            >
              {isDownloading
                ? <><Loader2 size={14} className="btn-spinner" /> Generando...</>
                : <><Download size={14} /> Descargar {selectedReports.size} reportes</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
