import { useEffect, useState } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useDataStore,
  useFilteredTransactions,
  computeCategoryCosts,
} from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import KPICard from '@/components/kpis/KPICard'
import { BerliBar, BerliMultiBar } from '@/components/charts/Charts'
import { fmtMXN, fmtPct, fmtNum } from '@/lib/formatters'
import { exportTransactions, exportCategories } from '@/lib/exporters'

type GroupBy = 'categoria' | 'area' | 'udn' | 'semana'

const PAGE_SIZE = 50

export default function CostoVenta() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const [groupBy, setGroupBy] = useState<GroupBy>('categoria')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  useEffect(() => {
    setPage(1)
  }, [transactions.length])

  const totalCosto = transactions.reduce((a, t) => a + t.total, 0)
  const categoryCosts = computeCategoryCosts(transactions)
  const topCategoria = categoryCosts[0]

  // Group data (flat, for chart)
  const grouped = (() => {
    const map: Record<string, number> = {}
    transactions.forEach((t) => {
      const key = groupBy === 'semana' ? `Sem. ${t.semana}` : t[groupBy]
      map[key] = (map[key] ?? 0) + t.total
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  })()

  // Two-level breakdown: categoría → área (used only when groupBy === 'categoria')
  const categoriaAreaGrouped = (() => {
    const map: Record<string, Record<string, { total: number; count: number }>> = {}
    transactions.forEach((t) => {
      if (!map[t.categoria]) map[t.categoria] = {}
      if (!map[t.categoria][t.area]) map[t.categoria][t.area] = { total: 0, count: 0 }
      map[t.categoria][t.area].total += t.total
      map[t.categoria][t.area].count += 1
    })
    return Object.entries(map)
      .map(([cat, areas]) => ({
        categoria: cat,
        total: Object.values(areas).reduce((s, a) => s + a.total, 0),
        areas: Object.entries(areas)
          .map(([area, d]) => ({ area, ...d }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total)
  })()

  // Weekly by UDN
  const udns = Array.from(new Set(transactions.map((t) => t.udn)))
  const weeklyByUDN = (() => {
    const semanas = [1, 2, 3, 4, 5]
    return semanas
      .filter((s) => transactions.some((t) => t.semana === s))
      .map((s) => {
        const row: Record<string, number | string> = { name: `Sem. ${s}` }
        udns.forEach((udn) => {
          row[udn] = transactions.filter((t) => t.semana === s && t.udn === udn).reduce((a, t) => a + t.total, 0)
        })
        return row
      })
  })()

  // Pagination
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE)
  const paged = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="animate-fade-in">
      <Header
        title="Costo de Venta"
        subtitle={`${fmtNum(transactions.length)} registros · Total: ${fmtMXN(totalCosto)}`}
      />
      <FilterPanel />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard label="Costo de venta" value={totalCosto} accent="brand" />
        <KPICard label="Registros" value={transactions.length} format="number" />
        <KPICard
          label="Promedio por reg."
          value={transactions.length > 0 ? totalCosto / transactions.length : 0}
          compact
        />
        <KPICard
          label="Top categoría"
          value={topCategoria?.total ?? 0}
          subtitle={topCategoria?.categoria}
          compact
        />
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-surface-700">Costo por grupo</p>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="filter-select w-auto text-xs"
            >
              <option value="categoria">Categoría</option>
              <option value="area">Área</option>
              <option value="udn">UDN</option>
              <option value="semana">Semana</option>
            </select>
          </div>
          {grouped.length > 0 ? (
            <BerliBar data={grouped.slice(0, 10)} />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Sin datos</p>
          )}
        </div>

        {udns.length > 1 && (
          <div className="card p-5">
            <p className="text-sm font-semibold text-surface-700 mb-4">Costo semanal por UDN</p>
            <BerliMultiBar data={weeklyByUDN} keys={udns} />
          </div>
        )}
      </div>

      {/* Breakdown table */}
      <div className="card overflow-hidden mb-4">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">Desglose por {groupBy}</p>
          <button
            onClick={() => exportCategories(categoryCosts)}
            disabled={categoryCosts.length === 0}
            className="btn-excel"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          {groupBy === 'categoria' ? (
            <table className="table-base">
              <thead>
                <tr>
                  <th className="col-left">Categoría</th>
                  <th className="col-left">Área</th>
                  <th className="col-right">Costo Total</th>
                  <th className="col-right">% del Total</th>
                  <th className="col-right">Registros</th>
                </tr>
              </thead>
              <tbody>
                {categoriaAreaGrouped.map((cat) => (
                  <>
                    <tr key={cat.categoria} className="category-row">
                      <td className="font-semibold" style={{ color: '#0F172A', fontSize: 13.5 }}>{cat.categoria}</td>
                      <td />
                      <td className="text-right mono font-semibold">{fmtMXN(cat.total)}</td>
                      <td className="text-right text-surface-500">{fmtPct(totalCosto > 0 ? (cat.total / totalCosto) * 100 : 0)}</td>
                      <td className="text-right text-surface-400">—</td>
                    </tr>
                    {cat.areas.map((area) => (
                      <tr key={`${cat.categoria}-${area.area}`} className="area-row">
                        <td />
                        <td style={{ paddingLeft: 28, color: '#475569', fontSize: 13 }}>{area.area}</td>
                        <td className="text-right mono">{fmtMXN(area.total)}</td>
                        <td className="text-right text-surface-500">{fmtPct(totalCosto > 0 ? (area.total / totalCosto) * 100 : 0)}</td>
                        <td className="text-right mono text-surface-400">{fmtNum(area.count)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">%</th>
                  <th>Participación</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row) => (
                  <tr key={row.name}>
                    <td className="font-medium">{row.name}</td>
                    <td className="text-right mono">{fmtMXN(row.value)}</td>
                    <td className="text-right text-surface-500">
                      {fmtPct(totalCosto > 0 ? (row.value / totalCosto) * 100 : 0)}
                    </td>
                    <td className="w-32">
                      <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${totalCosto > 0 ? (row.value / totalCosto) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">Pedidos detallados</p>
          <button
            onClick={() => exportTransactions(transactions)}
            disabled={transactions.length === 0}
            className="btn-excel"
          >
            <Download size={13} />
            Exportar todo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>UDN</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Área</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">C. Unitario</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t, i) => (
                <tr key={i}>
                  <td className="mono text-xs">{t.fecha}</td>
                  <td><span className="badge badge-neutral">{t.udn}</span></td>
                  <td className="max-w-[180px] truncate">{t.producto}</td>
                  <td className="text-surface-500 text-xs">{t.categoria}</td>
                  <td className="text-surface-500 text-xs">{t.area}</td>
                  <td className="text-right mono">{fmtNum(t.cantidad)}</td>
                  <td className="text-right mono">{fmtMXN(t.costoUnitario)}</td>
                  <td className="text-right mono font-medium">{fmtMXN(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-surface-100 flex items-center justify-between text-sm text-surface-500">
            <span>Página {page} de {totalPages} · {fmtNum(transactions.length)} registros totales</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="btn-secondary py-1 px-2"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="btn-secondary py-1 px-2"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
