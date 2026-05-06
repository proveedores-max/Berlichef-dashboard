import { useEffect } from 'react'
import type React from 'react'
import { Download } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  useFilteredEstadoCuenta,
  computeUDNSummaries,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import { BerliMultiBar } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { exportUDNSummary } from '@/lib/exporters'

export default function UnidadesNegocio() {
  const { data, fetchData } = useDataStore()
  const transactions  = useFilteredTransactions()
  const financials    = useFilteredFinancials()
  const sales         = useFilteredSales()
  const estadoCuenta  = useFilteredEstadoCuenta()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const summaries = computeUDNSummaries(transactions, financials, sales, estadoCuenta)

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

      {/* ── Premium UDN Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {summaries.map((u) => {
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
              {/* Header: nombre + badge EBITDA % */}
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

              {/* Hero: Ventas Netas */}
              <div style={{ marginBottom: 16 }}>
                <p style={LABEL}>Ventas Netas</p>
                {noVentas
                  ? <p style={{ ...VALUE_LG, color: '#CBD5E1', fontSize: 15 }}>Sin ventas</p>
                  : <p style={VALUE_LG}>{fmtMXN(u.ventasNetas)}</p>
                }
              </div>

              {/* Util. Bruta + EBITDA */}
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

              {/* Costo Venta (only if > 0) */}
              {u.costoVenta > 0 && (
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={BAR_LABEL}>Costo Venta</span>
                  <span style={{ ...PCT_SM, fontSize: 12, color: '#475569' }}>
                    {fmtMXN(u.costoVenta)}
                  </span>
                </div>
              )}

              {/* Food Cost + Labour progress bars */}
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
