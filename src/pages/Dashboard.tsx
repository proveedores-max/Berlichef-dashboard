import { useEffect } from 'react'
import type React from 'react'
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
    utilBrutaPct:  kpis.utilidadBrutaPct,
    foodCostPct:   kpis.foodCostPct,
    primeCostPct:  primeCostPct,
    ebitdaPct:     kpis.ebitdaPct,
    manoObraPct:   kpis.manoDeObraPct,
    gastosOpPct:   kpis.gastosOperativosPct,
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

          {/* ── Gauges — horizontal scroll ── */}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
            {GAUGE_CONFIG.map((g) => (
              <GaugeKPI
                key={g.key}
                label={g.label}
                value={gaugeValues[g.key]}
                min={g.min}
                max={g.max}
                t1={g.t1}
                t2={g.t2}
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

          {/* ── Tarjetas UDN ── */}
          {udnSummaries.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
                Comparativo por Unidad de Negocio
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {udnSummaries.map((u) => {
                  const positive    = u.ebitda >= 0
                  const accent      = positive ? '#059669' : '#DC2626'
                  const accentBg    = positive ? '#ECFDF5' : '#FEF2F2'
                  const noVentas    = u.ventasNetas === 0
                  const foodBad     = u.foodCostPct  > 35
                  const labourBad   = u.manoDeObraPct > 32

                  const LABEL: React.CSSProperties = {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#94A3B8',
                    marginBottom: 3,
                  }
                  const VALUE_LG: React.CSSProperties = {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                    color: '#0F172A',
                    lineHeight: 1.15,
                  }
                  const VALUE_SM = (color: string): React.CSSProperties => ({
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color,
                  })
                  const PCT_SM: React.CSSProperties = {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }
                  const BAR_LABEL: React.CSSProperties = {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#94A3B8',
                  }

                  return (
                    <div
                      key={u.udn}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                        borderLeft: `4px solid ${accent}`,
                        padding: '20px 20px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {/* ── Header: nombre + badge EBITDA % ── */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '0.01em' }}>
                          {u.udn}
                        </span>
                        {!noVentas && (
                          <span style={{
                            ...PCT_SM,
                            padding: '3px 9px',
                            borderRadius: 20,
                            background: accentBg,
                            color: accent,
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                          }}>
                            EBITDA {fmtPct(u.ebitdaPct)}
                          </span>
                        )}
                      </div>

                      {/* ── Hero: Ventas Netas ── */}
                      <div style={{ marginBottom: 16 }}>
                        <p style={LABEL}>Ventas Netas</p>
                        {noVentas
                          ? <p style={{ ...VALUE_LG, color: '#CBD5E1', fontSize: 15 }}>Sin ventas</p>
                          : <p style={VALUE_LG}>{fmtMXN(u.ventasNetas)}</p>
                        }
                      </div>

                      {/* ── Secundarias: Util. Bruta + EBITDA ── */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        paddingBottom: 14,
                        borderBottom: '1px solid #F1F5F9',
                        marginBottom: 14,
                      }}>
                        <div>
                          <p style={LABEL}>Util. Bruta</p>
                          <p style={VALUE_SM(u.utilidadBruta >= 0 ? '#059669' : '#DC2626')}>
                            {fmtMXN(u.utilidadBruta)}
                          </p>
                          {!noVentas && (
                            <p style={{ ...PCT_SM, color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                              {fmtPct(u.utilidadBrutaPct)}
                            </p>
                          )}
                        </div>
                        <div>
                          <p style={LABEL}>EBITDA</p>
                          <p style={VALUE_SM(u.ebitda >= 0 ? '#059669' : '#DC2626')}>
                            {fmtMXN(u.ebitda)}
                          </p>
                        </div>
                      </div>

                      {/* ── Costo Venta (solo si tiene valor real) ── */}
                      {u.costoVenta > 0 && (
                        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={BAR_LABEL}>Costo Venta</span>
                          <span style={{ ...PCT_SM, fontSize: 12, color: '#475569' }}>
                            {fmtMXN(u.costoVenta)}
                          </span>
                        </div>
                      )}

                      {/* ── Barras de porcentaje: Food Cost + Labour ── */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {/* Food Cost */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={BAR_LABEL}>Food Cost</span>
                            <span style={{ ...PCT_SM, fontSize: 11, color: foodBad ? '#DC2626' : '#059669' }}>
                              {fmtPct(u.foodCostPct)}
                            </span>
                          </div>
                          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(u.foodCostPct, 100)}%`,
                              background: foodBad ? '#DC2626' : '#059669',
                              borderRadius: 2,
                              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                          </div>
                        </div>
                        {/* Labour */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={BAR_LABEL}>Labour</span>
                            <span style={{ ...PCT_SM, fontSize: 11, color: labourBad ? '#DC2626' : '#059669' }}>
                              {fmtPct(u.manoDeObraPct)}
                            </span>
                          </div>
                          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(u.manoDeObraPct, 100)}%`,
                              background: labourBad ? '#DC2626' : '#059669',
                              borderRadius: 2,
                              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
