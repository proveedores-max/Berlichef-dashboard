import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { useDataStore, useFilteredFinancials } from '@/store/useDataStore'
import Header from '@/components/layout/Header'
import FilterPanel from '@/components/filters/FilterPanel'
import KPICard from '@/components/kpis/KPICard'
import { BerliBar } from '@/components/charts/Charts'
import { fmtMXN } from '@/lib/formatters'
import { exportFinancials } from '@/lib/exporters'

export default function GastosOperativos() {
  const { data, fetchData } = useDataStore()
  const financials = useFilteredFinancials()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  const gastos = financials.filter((f) => f.clasificacion === 'Gasto operativo')
  const nomina = financials.filter((f) => f.clasificacion === 'Nomina')
  const totalGastos = gastos.reduce((a, f) => a + f.total, 0)
  const totalNomina = nomina.reduce((a, f) => a + f.total, 0)

  // By category
  const byCat: Record<string, number> = {}
  financials.forEach((f) => {
    byCat[f.categoria] = (byCat[f.categoria] ?? 0) + f.total
  })
  const catData = Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // By UDN
  const byUDN: Record<string, number> = {}
  financials.forEach((f) => {
    byUDN[f.udn] = (byUDN[f.udn] ?? 0) + f.total
  })
  const udnData = Object.entries(byUDN)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="animate-fade-in">
      <Header title="Gastos Operativos" subtitle="Estructura de costos y nómina" />
      <FilterPanel />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPICard label="Gastos Operativos" value={totalGastos} />
        <KPICard label="Nómina" value={totalNomina} />
        <KPICard label="Total Estructura" value={totalGastos + totalNomina} accent="brand" />
      </div>

      <div className="grid xl:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-sm font-semibold text-surface-700 mb-4">Por categoría</p>
          {catData.length > 0 ? (
            <BerliBar data={catData.slice(0, 10)} />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Sin datos</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-surface-700 mb-4">Por unidad de negocio</p>
          {udnData.length > 0 ? (
            <BerliBar data={udnData} color="#8b5cf6" />
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Sin datos</p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-700">{financials.length} registros</p>
          <button
            onClick={() => exportFinancials(financials)}
            disabled={financials.length === 0}
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
                <th>Mes</th>
                <th>UDN</th>
                <th>Clasificación</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {financials.map((f, i) => (
                <tr key={i}>
                  <td>{f.mes}</td>
                  <td><span className="badge badge-neutral">{f.udn}</span></td>
                  <td className="text-surface-500 text-xs">{f.clasificacion}</td>
                  <td className="text-surface-500 text-xs">{f.categoria}</td>
                  <td className="max-w-[200px] truncate">{f.descripcion}</td>
                  <td className="text-right mono font-medium">{fmtMXN(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
