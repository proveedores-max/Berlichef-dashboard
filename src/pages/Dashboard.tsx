import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  useFilteredEstadoCuenta,
  computeKPIs,
  computeUDNSummaries,
  computeCategoryCosts,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import KPICard from '@/components/kpis/KPICard'
import GaugeKPI from '@/components/kpis/GaugeKPI'
import { BerliBar, BerliPie } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { GAUGE_CONFIG } from '@/config/gaugeConfig'

export default function Dashboard() {
  const { data, loading, fetchData } = useDataStore()
  const transactions  = useFilteredTransactions()
  const financials    = useFilteredFinancials()
  const sales         = useFilteredSales()
  const estadoCuenta  = useFilteredEstadoCuenta()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const kpis         = computeKPIs(transactions, financials, sales, estadoCuenta)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales, estadoCuenta)
  const categoryCosts = computeCategoryCosts(transactions)

  const primeCostPct = kpis.ventasNetas > 0
    ? ((kpis.costoVenta + kpis.manoDeObra) / kpis.ventasNetas) * 100
    : 0

  const gaugeValues: Record<string, number> = {
    margenBruto:  kpis.utilidadBrutaPct,
    foodCost:     kpis.foodCostPct,
    primeCost:    primeCostPct,
    margenEbitda: kpis.ebitdaPct,
    nominaPct:    kpis.manoDeObraPct,
    gastosOpPct:  kpis.gastosOperativosPct,
  }

  const weeklyData = (() => {
    const bySemana: Record<number, number> = {}
    transactions.forEach((t) => { bySemana[t.semana] = (bySemana[t.semana] ?? 0) + t.total })
    return [1, 2, 3, 4, 5]
      .filter((s) => bySemana[s] !== undefined)
      .map((s) => ({ name: `Sem. ${s}`, value: bySemana[s] }))
  })()

  const pieData = categoryCosts.slice(0, 6).map((c) => ({ name: c.categoria, value: c.total }))

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-light)' }} />
        <span style={{ marginLeft: 12, color: 'var(--color-text-muted)' }}>Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header title="Resumen Ejecutivo" subtitle="Vista consolidada de todas las unidades de negocio" />
      <FilterPanel />

      {!data && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>No hay datos cargados</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Haz clic en <strong>Actualizar</strong> para cargar los datos de Google Sheets
          </p>
        </div>
      )}

      {data && (
        <>
          {kpis.ventasNetas === 0 && (
            <div className="rounded-xl mb-6 px-4 py-3 text-sm" style={{
              background: 'var(--color-warning-light)',
              color: 'var(--color-warning)',
              border: '1px solid #FDE68A',
            }}>
              Ventas pendientes de captura — los porcentajes no son válidos
            </div>
          )}

          {/* ── Gauges 3×2 ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {GAUGE_CONFIG.map((g) => (
              <GaugeKPI
                key={g.key}
                label={g.label}
                value={gaugeValues[g.key]}
                min={g.min}
                max={g.max}
                thresholds={g.thresholds}
                invertColors={g.invertColors}
                benchmarkLabel={g.benchmarkLabel}
                tooltip={g.tooltip}
              />
            ))}
          </div>

          {/* ── KPIs numéricos ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Ventas netas"
              value={kpis.ventasNetas}
              accent="brand"
              subtitle={kpis.ventasNetas === 0 ? 'Pendiente de captura' : undefined}
            />
            <KPICard
              label="Costo de venta"
              value={kpis.costoVenta}
              subtitle={kpis.ventasNetas > 0 ? `Food cost: ${fmtPct(kpis.foodCostPct)}` : undefined}
            />
            <KPICard
              label="Utilidad bruta"
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

          {/* ── Gráficas ── */}
          {transactions.length > 0 && (
            <div className="grid xl:grid-cols-2 gap-4 mb-6">
              <div className="card p-5">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
                  Costo de venta por semana
                </p>
                <BerliBar data={weeklyData} />
              </div>
              <div className="card p-5">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
                  Top categorías por costo
                </p>
                <BerliPie data={pieData} />
              </div>
            </div>
          )}

          {/* ── Tabla comparativa UDNs ── */}
          {udnSummaries.length > 0 && (
            <div className="card overflow-hidden">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Comparativo por Unidad de Negocio
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="col-left">Unidad</th>
                      <th className="col-right">Ventas netas</th>
                      <th className="col-right">Costo venta</th>
                      <th className="col-right">Utilidad bruta</th>
                      <th className="col-center">Food cost</th>
                      <th className="col-right">EBITDA</th>
                      <th className="col-right">EBITDA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {udnSummaries.map((u) => (
                      <tr key={u.udn}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.udn}</td>
                        <td className="mono text-right">{fmtMXN(u.ventasNetas)}</td>
                        <td className="mono text-right">{fmtMXN(u.costoVenta)}</td>
                        <td className={`mono font-medium text-right ${u.utilidadBruta >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {fmtMXN(u.utilidadBruta)}
                        </td>
                        <td className="col-center">
                          <span className={`badge ${u.foodCostPct > 35 ? 'badge-negative' : 'badge-positive'}`}>
                            {fmtPct(u.foodCostPct)}
                          </span>
                        </td>
                        <td className={`mono font-medium text-right ${u.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>
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
          )}
        </>
      )}
    </div>
  )
}
