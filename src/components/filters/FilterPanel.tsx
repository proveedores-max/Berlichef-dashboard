import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { useDataStore, getUniqueValues } from '@/store/useDataStore'
import type { FilterState } from '@/types'

// ── CheckboxList ─────────────────────────────────────────────────────────────

interface CheckboxListProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}

function CheckboxList({ label, options, selected, onChange }: CheckboxListProps) {
  const allSelected = selected.length === 0 || selected.length === options.length

  function toggle(value: string) {
    if (selected.includes(value)) {
      const next = selected.filter((v) => v !== value)
      onChange(next.length === options.length ? [] : next)
    } else {
      const next = [...selected, value]
      onChange(next.length === options.length ? [] : next)
    }
  }

  function toggleAll() {
    onChange([])
  }

  const isChecked = (v: string) => selected.length === 0 || selected.includes(v)

  return (
    <div>
      <div className="checkbox-list-label">
        <span>{label}</span>
        {!allSelected && (
          <button onClick={toggleAll}>Todos</button>
        )}
      </div>
      <div className="checkbox-list-scroll">
        {options.map((opt) => (
          <label key={opt} className={`checkbox-list-item${isChecked(opt) ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={isChecked(opt)}
              onChange={() => toggle(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Chip helpers ──────────────────────────────────────────────────────────────

interface Chip { label: string; onRemove: () => void }

// ── FilterPanel ───────────────────────────────────────────────────────────────

export default function FilterPanel() {
  const { data, filters, setFilter, resetFilters } = useDataStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const { meses, udns, areas, categorias } = data
    ? getUniqueValues(data)
    : { meses: [], udns: [], areas: [], categorias: [] }

  const semanas = [1, 2, 3, 4, 5]
  const semanaOpts = semanas.map(String)

  // Build active chips
  const chips: Chip[] = [
    ...filters.mes.map((v) => ({
      label: `Mes: ${v}`,
      onRemove: () => setFilter('mes', filters.mes.filter((x) => x !== v) as FilterState['mes']),
    })),
    ...filters.semana.map((v) => ({
      label: `Sem. ${v}`,
      onRemove: () => setFilter('semana', filters.semana.filter((x) => x !== v) as FilterState['semana']),
    })),
    ...filters.udn.map((v) => ({
      label: `UDN: ${v}`,
      onRemove: () => setFilter('udn', filters.udn.filter((x) => x !== v) as FilterState['udn']),
    })),
    ...filters.area.map((v) => ({
      label: `Área: ${v}`,
      onRemove: () => setFilter('area', filters.area.filter((x) => x !== v) as FilterState['area']),
    })),
    ...filters.categoria.map((v) => ({
      label: `Cat: ${v}`,
      onRemove: () => setFilter('categoria', filters.categoria.filter((x) => x !== v) as FilterState['categoria']),
    })),
    ...(filters.producto ? [{ label: `Prod: ${filters.producto}`, onRemove: () => setFilter('producto', '') }] : []),
    ...(filters.fechaDesde ? [{ label: `Desde: ${filters.fechaDesde}`, onRemove: () => setFilter('fechaDesde', '') }] : []),
    ...(filters.fechaHasta ? [{ label: `Hasta: ${filters.fechaHasta}`, onRemove: () => setFilter('fechaHasta', '') }] : []),
  ]

  const hasFilters = chips.length > 0

  function handleSemanaChange(values: string[]) {
    setFilter('semana', values.map(Number) as FilterState['semana'])
  }

  return (
    <div className="mb-6">
      {/* ── Collapsed bar ── */}
      <div className="filter-bar-header">
        <button className="filter-toggle-btn" onClick={() => setIsExpanded((v) => !v)}>
          <SlidersHorizontal size={14} />
          Filtros
        </button>

        <div className="active-filters-chips">
          {chips.map((chip, i) => (
            <span key={i} className="filter-chip">
              {chip.label}
              <button onClick={chip.onRemove} aria-label="Quitar filtro">×</button>
            </span>
          ))}
          {!hasFilters && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Todos los datos</span>
          )}
        </div>

        {hasFilters && (
          <button className="clear-filters-btn" onClick={resetFilters}>
            Limpiar
          </button>
        )}

        <button className="expand-filters-btn" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? <><ChevronUp size={13} /> Ocultar</> : <><ChevronDown size={13} /> Mostrar</>}
        </button>
      </div>

      {/* ── Expandable body ── */}
      <div className={`filter-panel-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="filter-panel-inner">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

            <CheckboxList
              label="Mes"
              options={meses}
              selected={filters.mes}
              onChange={(v) => setFilter('mes', v as FilterState['mes'])}
            />

            <CheckboxList
              label="Semana"
              options={semanaOpts}
              selected={filters.semana.map(String)}
              onChange={handleSemanaChange}
            />

            <CheckboxList
              label="UDN"
              options={udns}
              selected={filters.udn}
              onChange={(v) => setFilter('udn', v as FilterState['udn'])}
            />

            <CheckboxList
              label="Área"
              options={areas}
              selected={filters.area}
              onChange={(v) => setFilter('area', v as FilterState['area'])}
            />

            <CheckboxList
              label="Categoría"
              options={categorias}
              selected={filters.categoria}
              onChange={(v) => setFilter('categoria', v as FilterState['categoria'])}
            />

            {/* Producto + Fechas */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="checkbox-list-label"><span>Producto</span></div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.producto}
                  onChange={(e) => setFilter('producto', e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <div className="checkbox-list-label"><span>Desde</span></div>
                <input
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => setFilter('fechaDesde', e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <div className="checkbox-list-label"><span>Hasta</span></div>
                <input
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => setFilter('fechaHasta', e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
