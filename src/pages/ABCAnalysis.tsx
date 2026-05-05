import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { useDataStore, useFilteredTransactions, computeABC } from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import { fmtMXN, fmtPct } from '@/lib/formatters'
import { exportABC } from '@/lib/exporters'
import type { ABCItem } from '@/types'

const classConfig = {
  A: {
    label: 'Clase A',
    desc: 'Alto impacto · Control prioritario',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-negative',
    bar: 'bg-negative',
    badge: 'bg-red-100 text-negative',
  },
  B: {
    label: 'Clase B',
    desc: 'Impacto medio · Monitoreo regular',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-warning',
    bar: 'bg-warning',
    badge: 'bg-amber-100 text-amber-700',
  },
  C: {
    label: 'Clase C',
    desc: 'Bajo impacto · Revisión periódica',
    border: 'border-surface-200',
    bg: 'bg-surface-50',
    text: 'text-surface-600',
    bar: 'bg-surface-300',
    badge: 'bg-surface-100 text-surface-600',
  },
}

export default function ABCAnalysis() {
  const { data, fetchData } = useDataStore()
  const transactions = useFilteredTransactions()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const abcItems = computeABC(transactions)
  const grand = abcItems.reduce((a, i) => a + i.total, 0)

  const byClass = (cls: ABCItem['clase']) => abcItems.filter((i) => i.clase === cls)

  return (
    <div className="animate-fade-in">
      <Header title="Análisis ABC" subtitle="Clasificación de productos por participación en costo" />
      <FilterPanel />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['A', 'B', 'C'] as const).map((cls) => {
          const items = byClass(cls)
          const total = items.reduce((a, i) => a + i.total, 0)
          const cfg = classConfig[cls]
          return (
            <div key={cls} className={`card p-5 border-2 ${cfg.border} ${cfg.bg}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</p>
              <p className="text-2xl font-display font-bold mono text-surface-900 mt-1">{fmtMXN(total)}</p>
              <p className="text-sm text-surface-500 mt-0.5">
                {items.length} productos · {fmtPct(grand > 0 ? (total / grand) * 100 : 0)} del total
              </p>
              <p className={`text-xs mt-2 font-medium ${cfg.text}`}>{cfg.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 mb-6 text-sm text-brand-700">
        <strong>Regla 80/15/5:</strong> Clase A comprende el 80% del costo (control prioritario), Clase B el 15% siguiente (monitoreo regular), Clase C el 5% restante (revisión periódica).
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">{abcItems.length} productos clasificados</p>
          <button
            onClick={() => exportABC(abcItems)}
            disabled={abcItems.length === 0}
            className="btn-secondary text-xs"
          >
            <Download size={13} />
            Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-right">Costo Total</th>
                <th className="text-right">% Individual</th>
                <th>% Acumulado</th>
                <th>Clase</th>
              </tr>
            </thead>
            <tbody>
              {abcItems.map((item, i) => {
                const cfg = classConfig[item.clase]
                return (
                  <tr key={item.producto}>
                    <td className="text-surface-400 mono text-xs">{i + 1}</td>
                    <td className="font-medium max-w-[200px] truncate">{item.producto}</td>
                    <td className="text-surface-500 text-xs">{item.categoria}</td>
                    <td className="text-right mono">{fmtMXN(item.total)}</td>
                    <td className="text-right text-surface-500">{fmtPct(item.pct, 2)}</td>
                    <td className="w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cfg.bar} rounded-full`}
                            style={{ width: `${Math.min(item.pctAcum, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs mono text-surface-500 w-12 text-right">
                          {fmtPct(item.pctAcum, 1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badge}`}>{item.clase}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
