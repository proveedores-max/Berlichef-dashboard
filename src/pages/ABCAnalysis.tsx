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
    accentColor: 'var(--color-danger)',
    textColor:   'var(--color-danger)',
    bar: 'bg-negative',
    badge: 'bg-red-100 text-negative',
  },
  B: {
    label: 'Clase B',
    desc: 'Impacto medio · Monitoreo regular',
    accentColor: 'var(--color-warning)',
    textColor:   'var(--color-warning)',
    bar: 'bg-warning',
    badge: 'bg-amber-100 text-amber-700',
  },
  C: {
    label: 'Clase C',
    desc: 'Bajo impacto · Revisión periódica',
    accentColor: 'var(--color-success)',
    textColor:   'var(--color-success)',
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
            <div
              key={cls}
              className="kpi-card"
              style={{ borderLeft: `4px solid ${cfg.accentColor}` }}
            >
              <div className="kpi-card-header">
                <span className="label-kpi" style={{ color: cfg.textColor }}>{cfg.label}</span>
              </div>
              <p className="text-kpi" style={{ color: cfg.textColor, fontSize: '1.5rem' }}>
                {fmtMXN(total)}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {items.length} productos · {fmtPct(grand > 0 ? (total / grand) * 100 : 0)} del total
              </p>
              <p style={{ fontSize: 11, fontWeight: 500, marginTop: 6, color: cfg.textColor }}>
                {cfg.desc}
              </p>
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
                <th className="col-center">#</th>
                <th className="col-left">Producto</th>
                <th className="col-left">Categoría</th>
                <th className="col-right">Costo Total</th>
                <th className="col-right">% del Total</th>
                <th className="col-right">% Acumulado</th>
                <th className="col-center">Clase</th>
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
