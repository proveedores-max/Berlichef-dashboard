import { useEffect } from 'react'
import { Download } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  useFilteredFinancials,
  useFilteredSales,
  computeKPIs,
  computeUDNSummaries,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import { BerliBar } from '@/components/charts/Charts'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { exportUDNSummary } from '@/lib/exporters'

export default function EstadoResultados() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const financials = useFilteredFinancials()
  const sales = useFilteredSales()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const kpis = computeKPIs(transactions, financials, sales)
  const udnSummaries = computeUDNSummaries(transactions, financials, sales)

  const ebitdaByUDN = udnSummaries
    .filter((u) => u.ventasNetas > 0)
    .map((u) => ({ name: u.udn, value: u.ebitdaPct }))

  const plRows = [
    { label: 'Ventas netas', value: kpis.ventasNetas, pct: 100, bold: false, indent: false, deduction: false },
    { label: 'Costo de venta', value: -kpis.costoVenta, pct: -kpis.foodCostPct, bold: false, indent: true, deduction: true },
    { label: 'Utilidad bruta', value: kpis.utilidadBruta, pct: kpis.utilidadBrutaPct, bold: true, indent: false, deduction: false },
    { label: 'Mano de obra', value: -kpis.manoDeObra, pct: -kpis.manoDeObraPct, bold: false, indent: true, deduction: true },
    { label: 'Gastos operativos', value: -kpis.gastosOperativos, pct: -kpis.gastosOperativosPct, bold: false, indent: true, deduction: true },
    { label: 'EBITDA', value: kpis.ebitda, pct: kpis.ebitdaPct, bold: true, indent: false, deduction: false },
  ]

  const totals = computeKPIs(transactions, financials, sales)

  return (
    <div className="animate-fade-in">
      <Header title="Estado de Resultados" subtitle="P&L consolidado con desglose por unidad" />
      <FilterPanel />

      {kpis.ventasNetas === 0 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 mb-6 text-sm text-amber-700">
          Ventas pendientes de captura — los porcentajes no son válidos
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-4 mb-6">
        {/* P&L Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-700">Estado de Resultados</p>
          </div>
          <table className="table-base">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="text-right">Importe</th>
                <th className="text-right">% Ventas</th>
              </tr>
            </thead>
            <tbody>
              {plRows.map((row) => (
                <tr
                  key={row.label}
                  className={row.bold ? 'bg-surface-50' : ''}
                >
                  <td className={`${row.indent ? 'pl-8' : ''} ${row.bold ? 'font-bold text-surface-900' : ''}`}>
                    {row.label}
                  </td>
                  <td className={`text-right mono ${row.deduction ? 'text-negative' : row.bold ? 'font-bold text-surface-900' : ''} ${!row.deduction && row.value < 0 ? 'text-negative' : ''}`}>
                    {fmtMXN(row.value)}
                  </td>
                  <td className={`text-right ${row.pct < 0 ? 'text-negative' : 'text-surface-500'}`}>
                    {fmtPct(row.pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EBITDA chart */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-surface-700 mb-4">EBITDA % por Unidad</p>
          {ebitdaByUDN.length > 0 ? (
            <BerliBar data={ebitdaByUDN} currency={false} color="#0ab86e" />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Sin datos de ventas</p>
          )}
        </div>
      </div>

      {/* Desglose por UDN */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">Desglose por Unidad de Negocio</p>
          <button
            onClick={() => exportUDNSummary(udnSummaries)}
            disabled={udnSummaries.length === 0}
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
                <th className="text-right">Costo Venta</th>
                <th className="text-right">U. Bruta</th>
                <th className="text-right">% U. Bruta</th>
                <th className="text-right">MO</th>
                <th className="text-right">Gastos Op.</th>
                <th className="text-right">EBITDA</th>
                <th className="text-right">EBITDA %</th>
              </tr>
            </thead>
            <tbody>
              {udnSummaries.map((u) => (
                <tr key={u.udn}>
                  <td className="font-medium">{u.udn}</td>
                  <td className="text-right mono">{fmtMXN(u.ventasNetas)}</td>
                  <td className="text-right mono">{fmtMXN(u.costoVenta)}</td>
                  <td className={`text-right mono ${u.utilidadBruta >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtMXN(u.utilidadBruta)}</td>
                  <td className={`text-right ${u.utilidadBrutaPct >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(u.utilidadBrutaPct)}</td>
                  <td className="text-right mono">{fmtMXN(u.manoDeObra)}</td>
                  <td className="text-right mono">{fmtMXN(u.gastosOperativos)}</td>
                  <td className={`text-right mono font-semibold ${u.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtMXN(u.ebitda)}</td>
                  <td className={`text-right ${u.ebitdaPct >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(u.ebitdaPct)}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-surface-50 font-bold border-t border-surface-200">
                <td>Total</td>
                <td className="text-right mono">{fmtMXN(totals.ventasNetas)}</td>
                <td className="text-right mono">{fmtMXN(totals.costoVenta)}</td>
                <td className={`text-right mono ${totals.utilidadBruta >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtMXN(totals.utilidadBruta)}</td>
                <td className={`text-right ${totals.utilidadBrutaPct >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(totals.utilidadBrutaPct)}</td>
                <td className="text-right mono">{fmtMXN(totals.manoDeObra)}</td>
                <td className="text-right mono">{fmtMXN(totals.gastosOperativos)}</td>
                <td className={`text-right mono ${totals.ebitda >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtMXN(totals.ebitda)}</td>
                <td className={`text-right ${totals.ebitdaPct >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(totals.ebitdaPct)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
