import { useEffect, useState } from 'react'
import { Package, TrendingUp, TrendingDown, Download } from 'lucide-react'
import { useDataStore, useFilteredTransactions } from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import { BerliLine } from '@/components/charts/Charts'
import { fmtMXN, fmtMXNDec, fmtNum } from '@/lib/formatters'
import { exportTransactions } from '@/lib/exporters'
import type { Transaction } from '@/types'

export default function Productos() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const allProducts = Array.from(new Set(transactions.map((t) => t.producto))).sort()

  useEffect(() => {
    if (search.length >= 2) {
      setSuggestions(
        allProducts.filter((p) => p.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
      )
    } else {
      setSuggestions([])
    }
  }, [search, transactions.length])

  // Top 20
  const top20 = (() => {
    const map: Record<string, number> = {}
    transactions.forEach((t) => {
      map[t.producto] = (map[t.producto] ?? 0) + t.total
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([producto, total]) => ({ producto, total }))
  })()

  // Product history
  const history: Transaction[] = selected
    ? transactions.filter((t) => t.producto === selected).sort((a, b) => {
        const toDate = (s: string) => {
          const [d, m, y] = s.split('/')
          return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
        }
        return toDate(a.fecha) - toDate(b.fecha)
      })
    : []

  const priceHistory = history.map((t) => ({ name: t.fecha, value: t.costoUnitario }))
  const totalCosto = history.reduce((a, t) => a + t.total, 0)
  const avgPrice = history.length > 0 ? history.reduce((a, t) => a + t.costoUnitario, 0) / history.length : 0
  const maxPrice = history.length > 0 ? Math.max(...history.map((t) => t.costoUnitario)) : 0
  const minPrice = history.length > 0 ? Math.min(...history.map((t) => t.costoUnitario)) : 0
  const totalQty = history.reduce((a, t) => a + t.cantidad, 0)
  const priceChange = history.length > 1
    ? ((history[history.length - 1].costoUnitario - history[0].costoUnitario) / history[0].costoUnitario) * 100
    : 0

  return (
    <div className="animate-fade-in">
      <Header title="Productos e Historial" subtitle="Busca un producto para ver su historial de precios" />

      {/* Search */}
      <div className="card p-5 mb-6 relative">
        <label className="block text-xs font-medium text-surface-500 mb-2">Buscar producto</label>
        <input
          type="text"
          placeholder="Escribe 2 o más caracteres..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base max-w-lg"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-lg bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setSelected(p)
                  setSearch(p)
                  setSuggestions([])
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 text-left"
              >
                <Package size={13} className="text-surface-400 flex-shrink-0" />
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected product */}
      {selected && history.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{selected}</h2>
            <button
              onClick={() => { setSelected(''); setSearch('') }}
              className="btn-secondary text-xs"
            >
              Limpiar selección
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            <div className="kpi-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Costo Total</p>
              <p className="text-2xl font-display font-bold mono text-brand-600">{fmtMXN(totalCosto)}</p>
            </div>
            <div className="kpi-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Precio Promedio</p>
              <p className="text-2xl font-display font-bold mono text-surface-700">{fmtMXNDec(avgPrice)}</p>
            </div>
            <div className="kpi-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Precio Máximo</p>
              <p className="text-2xl font-display font-bold mono text-negative">{fmtMXNDec(maxPrice)}</p>
            </div>
            <div className="kpi-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Precio Mínimo</p>
              <p className="text-2xl font-display font-bold mono text-positive">{fmtMXNDec(minPrice)}</p>
            </div>
            <div className="kpi-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Cantidad Total</p>
              <p className="text-2xl font-display font-bold mono text-surface-700">{fmtNum(totalQty)}</p>
              {history.length > 1 && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${priceChange > 0 ? 'text-negative' : 'text-positive'}`}>
                  {priceChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% vs primera compra</span>
                </div>
              )}
            </div>
          </div>

          {/* Price chart */}
          {priceHistory.length > 1 && (
            <div className="card p-5 mb-6">
              <p className="text-sm font-semibold text-surface-700 mb-4">Evolución de precio unitario</p>
              <BerliLine data={priceHistory} />
            </div>
          )}

          {/* History table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-surface-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-surface-700">Historial de compras</p>
              <button onClick={() => exportTransactions(history)} className="btn-secondary text-xs">
                <Download size={13} />
                Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Mes</th>
                    <th>Semana</th>
                    <th>UDN</th>
                    <th>Área</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">C. Unitario</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr key={i}>
                      <td className="mono text-xs">{t.fecha}</td>
                      <td>{t.mes}</td>
                      <td>Sem. {t.semana}</td>
                      <td><span className="badge badge-neutral">{t.udn}</span></td>
                      <td className="text-surface-500">{t.area}</td>
                      <td className="text-right mono">{fmtNum(t.cantidad)}</td>
                      <td className="text-right mono">{fmtMXNDec(t.costoUnitario)}</td>
                      <td className="text-right mono font-medium">{fmtMXN(t.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-50 font-bold border-t border-surface-200">
                    <td colSpan={5}>Total</td>
                    <td className="text-right mono">{fmtNum(totalQty)}</td>
                    <td className="text-right mono">{fmtMXNDec(avgPrice)}</td>
                    <td className="text-right mono">{fmtMXN(totalCosto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top 20 */}
      {!selected && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-700">Top 20 productos por costo total</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th className="text-right">Costo Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {top20.map((p, i) => (
                  <tr key={p.producto}>
                    <td className="text-surface-400 font-mono text-xs">{i + 1}</td>
                    <td className="font-medium">{p.producto}</td>
                    <td className="text-right mono">{fmtMXN(p.total)}</td>
                    <td>
                      <button
                        onClick={() => { setSelected(p.producto); setSearch(p.producto) }}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Ver historial →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
