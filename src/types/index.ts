export interface Transaction {
  fecha: string
  mes: string
  semana: number
  udn: string
  producto: string
  categoria: string
  area: string
  cantidad: number
  costoUnitario: number
  total: number
  notas?: string
}

export interface Financial {
  mes: string
  udn: string
  clasificacion: string
  categoria: string
  descripcion: string
  total: number
  notas?: string
}

export interface Sale {
  mes: string
  udn: string
  ventasNetas: number
  concepto: string
}

export interface Product {
  producto: string
  costoUnitario: number
  categoria: string
}

export interface KPIs {
  ventasNetas: number
  costoVenta: number
  utilidadBruta: number
  utilidadBrutaPct: number
  manoDeObra: number
  manoDeObraPct: number
  gastosOperativos: number
  gastosOperativosPct: number
  ebitda: number
  ebitdaPct: number
  foodCostPct: number
  labourCostPct: number
}

export interface UDNSummary extends KPIs {
  udn: string
}

export interface CategoryCost {
  categoria: string
  total: number
  pct: number
}

export interface ABCItem {
  producto: string
  categoria: string
  total: number
  pct: number
  pctAcum: number
  clase: 'A' | 'B' | 'C'
}

export type FilterState = {
  mes: string[]
  semana: number[]
  udn: string[]
  area: string[]
  categoria: string[]
  producto: string
  fechaDesde: string
  fechaHasta: string
}

export interface EstadoCuenta {
  mes:              string
  udn:              string
  ventasNetas:      number
  costoVenta:       number
  manoDeObra:       number
  gastosOperativos: number
  ebitda:           number
}

export type SheetData = {
  transactions:  Transaction[]
  financials:    Financial[]
  sales:         Sale[]
  products:      Product[]
  estadoCuenta:  EstadoCuenta[]
  lastUpdated:   string
}
