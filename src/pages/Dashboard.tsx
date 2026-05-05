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
import GaugeKPI from '@/components/kpis/GaugeKPI'
import { BerliBar, BerliPie } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'

// ── Configuración de cada velocímetro ─────────────────────────────────────
const GAUGES = [
  {
    key: 'margenBruto',
    label: 'Margen bruto %',
    invertColors: false,
    thresholds: { green: [70, 100] as [number,number], yellow: [60, 70] as [number,number], red: [0, 60] as [number,number] },
    benchmark: 70,
    tooltip: 'Fórmula: (Ventas − Costo de venta) / Ventas × 100. Objetivo: > 70%',
  },
  {
    key: 'foodCost',
    label: 'Food cost %',
    invertColors: true,
    thresholds: { green: [0, 28] as [number,number], yellow: [28, 35] as [number,number], red: [35, 100] as [number,number] },
    benchmark: 28,
    tooltip: 'Fórmula: Costo de venta / Ventas × 100. Objetivo: < 28%',
  },
  {
    key: 'primeCost',
    label: 'Prime cost %',
    invertColors: true,
    thresholds: { green: [0, 60] as [number,number], yellow: [60, 70] as [number,number], red: [70, 100] as [number,number] },
    benchmark: 60,
    tooltip: 'Fórmula: (Costo de venta + Nómina) / Ventas × 100. Objetivo: < 60%',
  },
  {
    key: 'ebitda',
    label: 'Margen EBITDA %',
    invertColors: false,
    thresholds: { green: [18, 100] as [number,number], yellow: [10, 18] as [number,number], red: [0, 10] as [number,number] },
    benchmark: 18,
    tooltip: 'Fórmula: EBITDA / Ventas × 100. Objetivo: > 18%',
  },
  {
    key: 'nomina',
    label: 'Nómina %',
    invertColors: true,
    thresholds: { green: [0, 32] as [number,number], yellow: [32, 40] as [number,number], red: [40, 100] as [number,number] },
    benchmark: 32,
    tooltip: 'Fórmula: Nómina / Ventas × 100. Objetivo: < 32%',
  },
  {
    key: 'gastosOp',
    label: 'Gastos op. %',
    invertColors: true,
    thresholds: { green: [0, 15] as [number,number], yellow: [15, 20] as [number,number], red: [20, 100] as [number,number] },
    benchmark: 15,
    tooltip: 'Fórmula: Gastos operativos / Ventas × 100. Objetivo: < 15%',
  },
]

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

  // Valores para cada gauge
  const primeCostPct = kpis.ventasNetas > 0
    ? ((kpis.costoVenta + kpis.manoDeObra) / kpis.ventasNetas) * 100
    : 0

  const gaugeValues: Record<string, number> = {
    margenBruto: kpis.utilidadBrutaPct,
    foodCost:    kpis.foodCostPct,
    primeCost:   primeCostPct,
    ebitda:      kpis.ebitdaPct,
    nomina:      kpis.manoDeObraPct,
    gastosOp:    kpis.gastosOperativosPct,
  }

  // Datos semanales y por categoría para gráficas
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
          {/* ── Advertencia sin ventas ── */}
          {kpis.ventasNetas === 0 && (
            <div
              className="rounded-xl mb-6 px-4 py-3 text-sm"
              style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid #FDE68A' }}
            >
              Ventas pendientes de captura — los porcentajes no son válidos
            </div>
          )}

          {/* ── Gauges 3×2 ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {GAUGES.map((g) => (
              <GaugeKPI
                key={g.key}
                label={g.label}
                value={gaugeValues[g.key]}
                thresholds={g.thresholds}
                invertColors={g.invertColors}
                benchmark={kpis.ventasNetas > 0 ? g.benchmark : undefined}
                tooltip={g.tooltip}
              />
            ))}
          </div>

          {/* ── KPIs numéricos (fila secundaria) ── */}
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
                      <th>Unidad</th>
                      <th>Ventas netas</th>
                      <th>Costo venta</th>
                      <th>Utilidad bruta</th>
                      <th>Food cost</th>
                      <th>EBITDA</th>
                      <th>EBITDA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {udnSummaries.map((u) => (
                      <tr key={u.udn}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.udn}</td>
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
