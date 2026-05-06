import { useEffect, useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ArrowRight } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  useFilteredEstadoCuenta,
  computeKPIs,
  computeUDNSummaries,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { exportEstadoResultados } from '@/lib/exporters'
import { getUDNColor } from '@/config/udnColors'
import type { FilterState } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format EBITDA: negative shown as ($X,XXX), positive as $X,XXX */
function fmtEBITDA(v: number): string {
  return v < 0 ? `(${fmtMXN(Math.abs(v))})` : fmtMXN(v)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EstadoResultados() {
  const navigate    = useNavigate()
  const { data, fetchData, filters, setFilter } = useDataStore()
  const transactions  = useFilteredTransactions()
  const financials    = useFilteredFinancials()
  const sales         = useFilteredSales()
  const estadoCuenta  = useFilteredEstadoCuenta()

  const [hoveredRow,   setHoveredRow]   = useState<string | null>(null)
  const [hoveredPLRow, setHoveredPLRow] = useState<string | null>(null)

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const kpis         = computeKPIs(transactions, financials, sales, estadoCuenta)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales, estadoCuenta)

  // ── Derived data ───────────────────────────────────────────────────────────

  const ebitdaByUDN = udnSummaries
    .filter((u) => u.ventasNetas > 0)
    .map((u) => ({ name: u.udn, value: u.ebitdaPct }))

  const rentables      = udnSummaries.filter((u) => u.ebitda > 0).length
  const totalUdns      = udnSummaries.length
  const maxAbsEbitdaPct = udnSummaries.length > 0
    ? Math.max(...udnSummaries.map((u) => Math.abs(u.ebitdaPct)), 0.01)
    : 0.01

  // ── Navigate to Costo de Venta (optionally pre-filtering by UDN) ───────────

  function goToCosto(udn?: string) {
    if (udn) setFilter('udn', [udn] as FilterState['udn'])
    const params = new URLSearchParams()
    if (filters.mes.length > 0) params.set('mes', filters.mes.join(','))
    navigate(`/costo-venta${params.toString() ? `?${params}` : ''}`)
  }

  // ── P&L row definitions ────────────────────────────────────────────────────

  type PLRow = {
    label: string; value: number; pct: number
    border: string; bg: string; bold: boolean; clickable: boolean
  }

  const plRows: PLRow[] = [
    {
      label: 'Ventas Netas',
      value: kpis.ventasNetas,
      pct:   100,
      border: '#3B82F6', bg: '#EFF6FF',
      bold: false, clickable: false,
    },
    {
      label: 'Costo de Venta',
      value: kpis.costoVenta,
      pct:   kpis.foodCostPct,
      border: '#EF4444', bg: '#FFF5F5',
      bold: false, clickable: true,
    },
    {
      label: 'Utilidad Bruta',
      value: kpis.utilidadBruta,
      pct:   kpis.utilidadBrutaPct,
      border: '#10B981', bg: '#F0FDF4',
      bold: true, clickable: false,
    },
    {
      label: 'Mano de Obra',
      value: kpis.manoDeObra,
      pct:   kpis.manoDeObraPct,
      border: '#F59E0B', bg: '#FFFBEB',
      bold: false, clickable: false,
    },
    {
      label: 'Gastos Operativos',
      value: kpis.gastosOperativos,
      pct:   kpis.gastosOperativosPct,
      border: '#8B5CF6', bg: '#F5F3FF',
      bold: false, clickable: false,
    },
    {
      label: 'EBITDA',
      value: kpis.ebitda,
      pct:   kpis.ebitdaPct,
      border: kpis.ebitda >= 0 ? '#10B981' : '#EF4444',
      bg:     kpis.ebitda >= 0 ? '#F0FDF4' : '#FFF5F5',
      bold: true, clickable: false,
    },
  ]

  // ── Shared inline style bases ──────────────────────────────────────────────

  const MONO: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
  }

  const TH: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#64748B',
    background: '#F8FAFC',
    whiteSpace: 'nowrap',
  }

  return (
    <div className="animate-fade-in">
      <Header title="Estado de Resultados" subtitle="P&L consolidado con desglose por unidad" />
      <FilterPanel />

      {kpis.ventasNetas === 0 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 mb-6 text-sm text-amber-700">
          Ventas pendientes de captura — los porcentajes no son válidos
        </div>
      )}

      {/* ── STEP 5: KPI Chips ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">

        {/* Ventas Netas */}
        <div className="rounded-xl px-5 py-3 shadow-sm bg-white" style={{ borderTop: '3px solid #3B82F6' }}>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Ventas Netas</p>
          <p style={{ ...MONO, fontSize: 20, color: '#0F172A', textAlign: 'left' }}>
            {fmtMXN(kpis.ventasNetas)}
          </p>
        </div>

        {/* Utilidad Bruta */}
        <div className="rounded-xl px-5 py-3 shadow-sm bg-white" style={{ borderTop: '3px solid #10B981' }}>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Utilidad Bruta</p>
          <p style={{ ...MONO, fontSize: 20, color: kpis.utilidadBruta >= 0 ? '#0F172A' : '#DC2626', textAlign: 'left' }}>
            {fmtMXN(kpis.utilidadBruta)}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 600 }}>
            {fmtPct(kpis.utilidadBrutaPct)}
          </p>
        </div>

        {/* EBITDA */}
        <div
          className="rounded-xl px-5 py-3 shadow-sm bg-white"
          style={{ borderTop: `3px solid ${kpis.ebitda >= 0 ? '#10B981' : '#EF4444'}` }}
        >
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">EBITDA</p>
          <p style={{ ...MONO, fontSize: 20, color: kpis.ebitda >= 0 ? '#059669' : '#DC2626', textAlign: 'left' }}>
            {fmtEBITDA(kpis.ebitda)}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 600 }}>
            {fmtPct(kpis.ebitdaPct)}
          </p>
        </div>

        {/* Unidades Rentables */}
        <div className="rounded-xl px-5 py-3 shadow-sm bg-white" style={{ borderTop: '3px solid #F59E0B' }}>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Unidades Rentables</p>
          <p style={{ ...MONO, fontSize: 20, color: '#0F172A', textAlign: 'left' }}>{rentables}</p>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 600 }}>
            /{totalUdns} unidades
          </p>
        </div>
      </div>

      {/* ── STEP 2 + 3: P&L Table + EBITDA Chart ── */}
      <div className="grid xl:grid-cols-2 gap-4 mb-6">

        {/* P&L Consolidado */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-700">P&L Consolidado</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left' }}>Concepto</th>
                <th style={{ ...TH, textAlign: 'right' }}>Importe</th>
                <th style={{ ...TH, textAlign: 'right', minWidth: 110 }}>% Ventas</th>
              </tr>
            </thead>
            <tbody>
              {plRows.map((row) => {
                const isHoveredPL = hoveredPLRow === row.label
                return (
                  <tr
                    key={row.label}
                    style={{
                      background: row.bg,
                      borderLeft: `4px solid ${row.border}`,
                    }}
                  >
                    {/* Concepto */}
                    <td
                      style={{
                        padding: '11px 16px',
                        fontSize: row.bold ? 14 : 13,
                        fontWeight: row.bold ? 700 : 500,
                        color: '#0F172A',
                        cursor: row.clickable ? 'pointer' : 'default',
                        textDecoration: row.clickable && isHoveredPL ? 'underline' : 'none',
                        userSelect: 'none',
                      }}
                      onMouseEnter={row.clickable ? () => setHoveredPLRow(row.label) : undefined}
                      onMouseLeave={row.clickable ? () => setHoveredPLRow(null) : undefined}
                      onClick={row.clickable ? () => goToCosto() : undefined}
                    >
                      {row.label}
                      {row.clickable && (
                        <ArrowRight
                          size={14}
                          style={{
                            display: 'inline',
                            verticalAlign: 'middle',
                            marginLeft: 6,
                            color: '#EF4444',
                          }}
                        />
                      )}
                    </td>

                    {/* Importe */}
                    <td style={{ ...MONO, padding: '11px 16px', fontSize: row.bold ? 15 : 13, color: '#0F172A' }}>
                      {fmtMXN(row.value)}
                    </td>

                    {/* % Ventas + mini bar */}
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <span style={{ ...MONO, fontSize: 12, color: '#475569', display: 'block' }}>
                        {fmtPct(Math.abs(row.pct))}
                      </span>
                      <div style={{ marginTop: 5, height: 3, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(Math.abs(row.pct), 100)}%`,
                          background: row.border,
                          borderRadius: 2,
                        }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* EBITDA % por Unidad — multi-color bar chart */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-surface-700 mb-4">EBITDA % por Unidad de Negocio</p>
          {ebitdaByUDN.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ebitdaByUDN} margin={{ top: 28, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A', border: 'none',
                    borderRadius: 8, fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '10px 14px',
                  }}
                  labelStyle={{ color: '#94A3B8', marginBottom: 4 }}
                  itemStyle={{ color: '#FFFFFF' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'EBITDA %']}
                />
                {/* Zero reference line */}
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
                  {ebitdaByUDN.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={getUDNColor(entry.name)}
                      fillOpacity={entry.value < 0 ? 0.4 : 1}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: number | string) => `${Number(v).toFixed(1)}%`}
                    style={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Sin datos de ventas</p>
          )}
        </div>
      </div>

      {/* ── STEP 4: Desglose por Unidad de Negocio ── */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">Desglose por Unidad de Negocio</p>
          <button
            onClick={() => exportEstadoResultados(udnSummaries, kpis)}
            disabled={udnSummaries.length === 0}
            className="btn-excel"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left' }}>Unidad de Negocio</th>
                <th style={{ ...TH, textAlign: 'right' }}>Ventas Netas</th>
                {/* Costo de Venta header — clickable */}
                <th
                  style={{ ...TH, textAlign: 'right', color: '#3B82F6', cursor: 'pointer' }}
                  title="Ver detalle de Costo de Venta"
                  onClick={() => goToCosto()}
                >
                  Costo de Venta
                </th>
                <th style={{ ...TH, textAlign: 'right' }}>Utilidad Bruta</th>
                <th style={{ ...TH, textAlign: 'right' }}>% Utilidad Bruta</th>
                <th style={{ ...TH, textAlign: 'right' }}>Mano de Obra</th>
                <th style={{ ...TH, textAlign: 'right' }}>Gastos Operativos</th>
                <th style={{ ...TH, textAlign: 'right' }}>EBITDA</th>
                <th style={{ ...TH, textAlign: 'right', minWidth: 130 }}>EBITDA %</th>
              </tr>
            </thead>
            <tbody>
              {udnSummaries.map((u, i) => {
                const udnColor = getUDNColor(u.udn)
                const isHovered = hoveredRow === u.udn
                const rowBg = isHovered
                  ? `${udnColor}14`
                  : i % 2 === 0 ? '#F8FAFC' : '#FFFFFF'

                return (
                  <tr
                    key={u.udn}
                    style={{
                      background: rowBg,
                      borderLeft: `4px solid ${udnColor}`,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={() => setHoveredRow(u.udn)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Unidad de Negocio — colored dot + name */}
                    <td style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8,
                        borderRadius: '50%', background: udnColor,
                        marginRight: 8, verticalAlign: 'middle',
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{u.udn}</span>
                    </td>

                    {/* Ventas Netas */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, color: '#0F172A' }}>
                      {fmtMXN(u.ventasNetas)}
                    </td>

                    {/* Costo de Venta — clickable per-row */}
                    <td
                      style={{
                        ...MONO, padding: '10px 14px', fontSize: 13,
                        color: '#3B82F6', cursor: 'pointer', textDecoration: 'underline',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => goToCosto(u.udn)}
                    >
                      {fmtMXN(u.costoVenta)}
                      <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 3 }} />
                    </td>

                    {/* Utilidad Bruta */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, color: u.utilidadBruta >= 0 ? '#059669' : '#DC2626' }}>
                      {fmtMXN(u.utilidadBruta)}
                    </td>

                    {/* % Utilidad Bruta */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, color: u.utilidadBrutaPct >= 0 ? '#059669' : '#DC2626' }}>
                      {fmtPct(u.utilidadBrutaPct)}
                    </td>

                    {/* Mano de Obra */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, color: '#475569' }}>
                      {fmtMXN(u.manoDeObra)}
                    </td>

                    {/* Gastos Operativos */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, color: '#475569' }}>
                      {fmtMXN(u.gastosOperativos)}
                    </td>

                    {/* EBITDA — () format for negatives */}
                    <td style={{ ...MONO, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: u.ebitda >= 0 ? '#059669' : '#DC2626' }}>
                      {fmtEBITDA(u.ebitda)}
                    </td>

                    {/* EBITDA % + proportional bar */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{ ...MONO, fontSize: 12, display: 'block', color: u.ebitdaPct >= 0 ? '#059669' : '#DC2626' }}>
                        {fmtPct(u.ebitdaPct)}
                      </span>
                      <div style={{ marginTop: 4, height: 3, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(Math.abs(u.ebitdaPct) / maxAbsEbitdaPct) * 100}%`,
                          background: u.ebitdaPct >= 0 ? udnColor : '#EF4444',
                          borderRadius: 2,
                        }} />
                      </div>
                    </td>
                  </tr>
                )
              })}

              {/* ── Total row ── */}
              <tr style={{ background: '#0F172A' }}>
                <td style={{ padding: '12px 14px', textAlign: 'left', color: '#FFFFFF', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                  Total Consolidado
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: '#FFFFFF' }}>
                  {fmtMXN(kpis.ventasNetas)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: '#FFFFFF' }}>
                  {fmtMXN(kpis.costoVenta)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, fontWeight: 700, color: kpis.utilidadBruta >= 0 ? '#34D399' : '#F87171' }}>
                  {fmtMXN(kpis.utilidadBruta)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: kpis.utilidadBrutaPct >= 0 ? '#34D399' : '#F87171' }}>
                  {fmtPct(kpis.utilidadBrutaPct)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: '#FFFFFF' }}>
                  {fmtMXN(kpis.manoDeObra)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: '#FFFFFF' }}>
                  {fmtMXN(kpis.gastosOperativos)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, fontWeight: 700, color: kpis.ebitda >= 0 ? '#34D399' : '#F87171' }}>
                  {fmtEBITDA(kpis.ebitda)}
                </td>
                <td style={{ ...MONO, padding: '12px 14px', fontSize: 13, color: kpis.ebitdaPct >= 0 ? '#34D399' : '#F87171' }}>
                  {fmtPct(kpis.ebitdaPct)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
