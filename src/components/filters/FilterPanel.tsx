import { type ChangeEvent } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import { useDataStore, getUniqueValues } from '@/store/useDataStore'
import type { FilterState } from '@/types'

export default function FilterPanel() {
  const { data, filters, setFilter, resetFilters } = useDataStore()

  const { meses, udns, areas, categorias } = data
    ? getUniqueValues(data)
    : { meses: [], udns: [], areas: [], categorias: [] }

  const semanas = [1, 2, 3, 4, 5]

  const activeCount = [
    filters.mes.length > 0,
    filters.semana.length > 0,
    filters.udn.length > 0,
    filters.area.length > 0,
    filters.categoria.length > 0,
    filters.producto !== '',
    filters.fechaDesde !== '',
    filters.fechaHasta !== '',
  ].filter(Boolean).length

  function handleMultiSelect<K extends keyof FilterState>(
    key: K,
    e: ChangeEvent<HTMLSelectElement>
  ) {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value)
    if (key === 'semana') {
      setFilter(key, values.map(Number) as FilterState[K])
    } else {
      setFilter(key, values as FilterState[K])
    }
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-surface-400" />
          <span className="text-sm font-semibold text-surface-700">Filtros</span>
          {activeCount > 0 && (
            <span className="badge bg-brand-50 text-brand-600">{activeCount} activo{activeCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={resetFilters} className="btn-secondary text-xs py-1 px-2.5 gap-1">
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Mes */}
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">Mes</label>
          <select
            multiple
            size={2}
            value={filters.mes}
            onChange={(e) => handleMultiSelect('mes', e)}
            className="filter-select"
          >
            {meses.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Semana */}
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">Semana</label>
          <select
            multiple
            size={2}
            value={filters.semana.map(String)}
            onChange={(e) => handleMultiSelect('semana', e)}
            className="filter-select"
          >
            {semanas.map((s) => <option key={s} value={s}>Semana {s}</option>)}
          </select>
        </div>

        {/* UDN */}
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">UDN</label>
          <select
            multiple
            size={2}
            value={filters.udn}
            onChange={(e) => handleMultiSelect('udn', e)}
            className="filter-select"
          >
            {udns.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* Área */}
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">Área</label>
          <select
            multiple
            size={2}
            value={filters.area}
            onChange={(e) => handleMultiSelect('area', e)}
            className="filter-select"
          >
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">Categoría</label>
          <select
            multiple
            size={2}
            value={filters.categoria}
            onChange={(e) => handleMultiSelect('categoria', e)}
            className="filter-select"
          >
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Producto + Fechas */}
        <div className="flex flex-col gap-1.5">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Producto</label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.producto}
              onChange={(e) => setFilter('producto', e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Desde</label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilter('fechaDesde', e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilter('fechaHasta', e.target.value)}
              className="input-base"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-surface-400 mt-3">Ctrl/Cmd para seleccionar múltiples valores</p>
    </div>
  )
}
