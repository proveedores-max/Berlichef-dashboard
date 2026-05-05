import { useEffect } from 'react'
import { Download } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  computeUDNSummaries,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import { BerliMultiBar } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { exportUDNSummary } from '@/lib/exporters'

export default function UnidadesNegocio() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const financials = useFilteredFinancials()
  const sales = useFilteredSales()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const summaries = computeUDNSummaries(transactions, financials, sales)

  const chartData: Record<string, string | number>[] = summaries.map((u) => ({
    name: u.udn,
    Ventas: u.ventasNetas,
    'Costo venta': u.costoVenta,
    'Mano de obra': u.manoDeObra,
    'Gastos op.': u.gastosOperativos,
  }))

  return (
    <div className="animate-fade-in">
      <Header title="Unidades de Negocio" subtitle="Comparativo financiero por unidad" />
      <FilterPanel />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {summaries.map((u) => (
          <div key={u.udn} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-surface-900">{u.udn}</h3>
              <span className={`badge ${u.ebitdaPct >= 0 ? 'badge-positive' : 'badge-negative'}`}>
                EBITDA {fmtPct(u.ebitdaPct)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Ventas</p>
                <p className="font-semibold mono text-sm">{fmtMXN(u.ventasNetas)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Costo venta</p>
                <p className="font-semibold mono text-sm">{fmtMXN(u.costoVenta)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Food cost</p>
                <p className={`font-semibold mono text-sm ${u.foodCostPct > 35 ? 'text-negative' : 'text-positive'}`}>
                  {fmtPct(u.foodCostPct)}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Labour cost</p>
                <p className="font-semibold mono text-sm">{fmtPct(u.labourCostPct)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Util. bruta</p>
                <p className={`font-semibold mono text-sm ${u.utilidadBruta >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {fmtMXN(u.utilidadBruta)}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-0.5">EBITDA</p>
                <p className={`font-semibold mono text-sm ${u.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {fmtMXN(u.ebitda)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {summaries.length > 1 && (
        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-surface-700 mb-4">Comparativo por unidad</p>
          <BerliMultiBar
            data={chartData}
            keys={['Ventas', 'Costo venta', 'Mano de obra', 'Gastos op.']}
            height={320}
          />
        </div>
      )}

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">Resumen comparativo</p>
          <button
            onClick={() => exportUDNSummary(summaries)}
            disabled={summaries.length === 0}
            className="btn-excel"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Unidad</th>
                <th className="text-right">Ventas</th>
                <th className="text-right">Costo %</th>
                <th className="text-right">Food cost</th>
                <th className="text-right">Labour %</th>
                <th className="text-right">Gastos op. %</th>
                <th className="text-right">EBITDA</th>
                <th className="text-right">EBITDA %</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((u) => (
                <tr key={u.udn}>
                  <td className="font-medium">{u.udn}</td>
                  <td className="text-right mono">{fmtMXN(u.ventasNetas)}</td>
                  <td className="text-right">{fmtPct(u.foodCostPct)}</td>
                  <td className="text-right">
                    <span className={`badge ${u.foodCostPct > 35 ? 'badge-negative' : 'badge-positive'}`}>
                      {fmtPct(u.foodCostPct)}
                    </span>
                  </td>
                  <td className="text-right">{fmtPct(u.labourCostPct)}</td>
                  <td className="text-right">{fmtPct(u.gastosOperativosPct)}</td>
                  <td className={`text-right mono font-semibold ${u.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {fmtMXN(u.ebitda)}
                  </td>
                  <td className={`text-right ${u.ebitdaPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {fmtPct(u.ebitdaPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
