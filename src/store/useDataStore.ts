import { create } from 'zustand'
import type {
  SheetData,
  FilterState,
  Transaction,
  Financial,
  Sale,
  EstadoCuenta,
  KPIs,
  UDNSummary,
  CategoryCost,
  ABCItem,
} from '@/types'

interface DataStore {
  data: SheetData | null
  loading: boolean
  error: string | null
  filters: FilterState
  fetchData: () => Promise<void>
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  mes: [],
  semana: [],
  udn: [],
  area: [],
  categoria: [],
  producto: '',
  fechaDesde: '',
  fechaHasta: '',
}

function parseDateMX(dateStr: string): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export const useDataStore = create<DataStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  filters: defaultFilters,

  fetchData: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/.netlify/functions/sheets')
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data: SheetData = await res.json()
      set({ data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error desconocido', loading: false })
    }
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }))
  },

  resetFilters: () => {
    set({ filters: defaultFilters })
  },
}))

export function useFilteredTransactions(): Transaction[] {
  const { data, filters } = useDataStore()
  if (!data) return []
  return data.transactions.filter((t) => {
    if (filters.mes.length > 0 && !filters.mes.includes(t.mes)) return false
    if (filters.semana.length > 0 && !filters.semana.includes(t.semana)) return false
    if (filters.udn.length > 0 && !filters.udn.includes(t.udn)) return false
    if (filters.area.length > 0 && !filters.area.includes(t.area)) return false
    if (filters.categoria.length > 0 && !filters.categoria.includes(t.categoria)) return false
    if (filters.producto && !t.producto.toLowerCase().includes(filters.producto.toLowerCase()))
      return false
    if (filters.fechaDesde) {
      const d = parseDateMX(t.fecha)
      if (d && d < new Date(filters.fechaDesde)) return false
    }
    if (filters.fechaHasta) {
      const d = parseDateMX(t.fecha)
      if (d && d > new Date(filters.fechaHasta)) return false
    }
    return true
  })
}

export function useFilteredFinancials(): Financial[] {
  const { data, filters } = useDataStore()
  if (!data) return []
  return data.financials.filter((f) => {
    if (filters.mes.length > 0 && !filters.mes.includes(f.mes)) return false
    if (filters.udn.length > 0 && !filters.udn.includes(f.udn)) return false
    return true
  })
}

export function useFilteredSales(): Sale[] {
  const { data, filters } = useDataStore()
  if (!data) return []
  return data.sales.filter((s) => {
    if (filters.mes.length > 0 && !filters.mes.includes(s.mes)) return false
    if (filters.udn.length > 0 && !filters.udn.includes(s.udn)) return false
    return true
  })
}

export function useFilteredEstadoCuenta(): EstadoCuenta[] {
  const { data, filters } = useDataStore()
  if (!data || !data.estadoCuenta) return []
  return data.estadoCuenta.filter((e) => {
    if (e.udn === 'General') return false  // fila consolidada, no es UDN real
    if (filters.mes.length > 0 && !filters.mes.includes(e.mes)) return false
    if (filters.udn.length > 0 && !filters.udn.includes(e.udn)) return false
    return true
  })
}

export function computeKPIs(
  transactions: Transaction[],
  financials: Financial[],
  sales: Sale[],
  estadoCuenta?: EstadoCuenta[]
): KPIs {
  let costoVenta   = transactions.reduce((a, t) => a + t.total, 0)
  let ventasNetas: number
  let manoDeObra: number
  let gastosOperativos: number
  let utilidadBruta: number
  let ebitda: number

  if (estadoCuenta && estadoCuenta.length > 0) {
    ventasNetas      = estadoCuenta.reduce((a, e) => a + e.ventasNetas,      0)
    costoVenta       = estadoCuenta.reduce((a, e) => a + e.costoVenta,       0)
    utilidadBruta    = estadoCuenta.reduce((a, e) => a + e.utilidadBruta,    0)
    manoDeObra       = estadoCuenta.reduce((a, e) => a + e.manoDeObra,       0)
    gastosOperativos = estadoCuenta.reduce((a, e) => a + e.gastosOperativos, 0)
    ebitda           = estadoCuenta.reduce((a, e) => a + e.ebitda,           0)
  } else {
    ventasNetas      = sales.reduce((a, s) => a + s.ventasNetas, 0)
    manoDeObra       = financials.filter((f) => f.clasificacion === 'Nomina').reduce((a, f) => a + f.total, 0)
    gastosOperativos = financials.filter((f) => f.clasificacion === 'Gasto operativo').reduce((a, f) => a + f.total, 0)
    utilidadBruta    = ventasNetas - costoVenta
    ebitda           = utilidadBruta - manoDeObra - gastosOperativos
  }

  const safe = (n: number) => (ventasNetas === 0 ? 0 : (n / ventasNetas) * 100)

  return {
    ventasNetas,
    costoVenta,
    utilidadBruta,
    utilidadBrutaPct: safe(utilidadBruta),
    manoDeObra,
    manoDeObraPct: safe(manoDeObra),
    gastosOperativos,
    gastosOperativosPct: safe(gastosOperativos),
    ebitda,
    ebitdaPct: safe(ebitda),
    foodCostPct: safe(costoVenta),
    labourCostPct: safe(manoDeObra),
  }
}

export function computeUDNSummaries(
  transactions: Transaction[],
  financials: Financial[],
  sales: Sale[],
  estadoCuenta?: EstadoCuenta[]
): UDNSummary[] {
  const udns = Array.from(
    new Set([
      ...transactions.map((t) => t.udn),
      ...financials.map((f) => f.udn),
      ...sales.map((s) => s.udn),
      ...(estadoCuenta ?? []).map((e) => e.udn),
    ])
  ).filter(Boolean)

  return udns.map((udn) => {
    const t = transactions.filter((x) => x.udn === udn)
    const f = financials.filter((x) => x.udn === udn)
    const s = sales.filter((x) => x.udn === udn)
    const e = estadoCuenta?.filter((x) => x.udn === udn)
    return { udn, ...computeKPIs(t, f, s, e) }
  })
}

export function computeCategoryCosts(transactions: Transaction[]): CategoryCost[] {
  const totals: Record<string, number> = {}
  transactions.forEach((t) => {
    totals[t.categoria] = (totals[t.categoria] ?? 0) + t.total
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0)
  return Object.entries(totals)
    .map(([categoria, total]) => ({
      categoria,
      total,
      pct: grand === 0 ? 0 : (total / grand) * 100,
    }))
    .sort((a, b) => b.total - a.total)
}

export function computeABC(transactions: Transaction[]): ABCItem[] {
  const totals: Record<string, { total: number; categoria: string }> = {}
  transactions.forEach((t) => {
    if (!totals[t.producto]) totals[t.producto] = { total: 0, categoria: t.categoria }
    totals[t.producto].total += t.total
  })
  const grand = Object.values(totals).reduce((a, b) => a + b.total, 0)
  const sorted = Object.entries(totals).sort((a, b) => b[1].total - a[1].total)
  let acum = 0
  return sorted.map(([producto, { total, categoria }]) => {
    const pct = grand === 0 ? 0 : (total / grand) * 100
    acum += pct
    const clase: 'A' | 'B' | 'C' = acum <= 80 ? 'A' : acum <= 95 ? 'B' : 'C'
    return { producto, categoria, total, pct, pctAcum: acum, clase }
  })
}

export function getUniqueValues(data: SheetData) {
  const meses = Array.from(new Set(data.transactions.map((t) => t.mes))).filter(Boolean)
  const udns = Array.from(
    new Set([
      ...data.transactions.map((t) => t.udn),
      ...data.sales.map((s) => s.udn),
      ...data.financials.map((f) => f.udn),
    ])
  ).filter(Boolean)
  const areas = Array.from(new Set(data.transactions.map((t) => t.area))).filter(Boolean)
  const categorias = Array.from(new Set(data.transactions.map((t) => t.categoria))).filter(Boolean)
  return { meses, udns, areas, categorias }
}
