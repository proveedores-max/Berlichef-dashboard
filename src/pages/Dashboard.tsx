import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  computeKPIs,
  computeUDNSummaries,
  computeCategoryCosts,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import KPICard from '@/components/kpis/KPICard'
import { BerliBar, BerliPie } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'

export default function Dashboard() {
  const { data, loading, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const financials = useFilteredFinancials()
  const sales = useFilteredSales()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const kpis = computeKPIs(transactions, financials, sales)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales)
  const categoryCosts = computeCategoryCosts(transactions)

  const weeklyData = (() => {
    const bySemana: Record<number, number> = {}
    transactions.forEach((t) => {
      bySemana[t.semana] = (bySemana[t.semana] ?? 0) + t.total
    })
    return [1, 2, 3, 4, 5]
      .filter((s) => bySemana[s] !== undefined)
      .map((s) => ({ name: `Sem. ${s}`, value: bySemana[s] }))
  })()

  const pieData = categoryCosts.slice(0, 6).map((c) => ({ name: c.categoria, value: c.total }))

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-400" />
        <span className="ml-3 text-surface-400">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header title="Resumen Ejecutivo" subtitle="Vista consolidada de todas las unidades de negocio" />

      {!data && (
        <div className="card p-8 text-center">
          <p className="text-surface-500 mb-3">No hay datos cargados</p>
          <p className="text-sm text-surface-400">Haz clic en <strong>Actualizar</strong> para cargar los datos de Google Sheets</p>
        </div>
      )}

      {data && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Ventas Netas"
              value={kpis.ventasNetas}
              accent="brand"
              subtitle={kpis.ventasNetas === 0 ? 'Pendiente de captura' : undefined}
            />
            <KPICard
              label="Costo de Venta"
              value={kpis.costoVenta}
              subtitle={kpis.ventasNetas > 0 ? `Food cost: ${fmtPct(kpis.foodCostPct)}` : undefined}
            />
            <KPICard
              label="Utilidad Bruta"
              value={kpis.utilidadBruta}
              accent={kpis.utilidadBruta >= 0 ? 'positive' : 'negative'}
              subtitle={kpis.ventasNetas > 0 ? fmtPct(kpis.utilidadBrutaPct) : undefined}
            />
            <KPICard
              label="EBITDA"
              value={kpis.ebitda}
              accent={kpis.ebitda >= 0 ? 'positive' : 'negative'}
              subtitle={kpis.ventasNetas > 0 ? fmtPct(kpis.ebitdaPct) : undefined}
            />
          </div>

          {/* KPIs de estructura */}
          {kpis.ventasNetas > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <KPICard label="Food Cost %" value={kpis.foodCostPct} format="percent" compact />
              <KPICard label="Labour Cost %" value={kpis.labourCostPct} format="percent" compact />
              <KPICard label="Gastos Op. %" value={kpis.gastosOperativosPct} format="percent" compact />
              <KPICard label="Mano de Obra" value={kpis.manoDeObra} compact />
            </div>
          )}

          {kpis.ventasNetas === 0 && (
            <div className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 mb-6 text-sm text-amber-700">
              Ventas pendientes de captura — los porcentajes no son válidos
            </div>
          )}

          {/* Gráficas */}
          {transactions.length > 0 && (
            <div className="grid xl:grid-cols-2 gap-4 mb-6">
              <div className="card p-5">
                <p className="text-sm font-semibold text-surface-700 mb-4">Costo de venta por semana</p>
                <BerliBar data={weeklyData} />
              </div>
              <div className="card p-5">
                <p className="text-sm font-semibold text-surface-700 mb-4">Top categorías por costo</p>
                <BerliPie data={pieData} />
              </div>
            </div>
          )}

          {/* Tabla UDNs */}
          {udnSummaries.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-700">Comparativo por Unidad de Negocio</p>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      <th>Ventas Netas</th>
                      <th>Costo Venta</th>
                      <th>Utilidad Bruta</th>
                      <th>Food Cost</th>
                      <th>EBITDA</th>
                      <th>EBITDA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {udnSummaries.map((u) => (
                      <tr key={u.udn}>
                        <td className="font-medium text-surface-800">{u.udn}</td>
                        <td className="mono">{fmtMXN(u.ventasNetas)}</td>
                        <td className="mono">{fmtMXN(u.costoVenta)}</td>
                        <td className={`mono font-medium ${u.utilidadBruta >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {fmtMXN(u.utilidadBruta)}
                        </td>
                        <td>
                          <span className={`badge ${u.foodCostPct > 35 ? 'badge-negative' : 'badge-positive'}`}>
                            {fmtPct(u.foodCostPct)}
                          </span>
                        </td>
                        <td className={`mono font-medium ${u.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {fmtMXN(u.ebitda)}
                        </td>
                        <td className={u.ebitdaPct >= 0 ? 'text-positive' : 'text-negative'}>
                          {fmtPct(u.ebitdaPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
