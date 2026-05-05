import * as XLSX from 'xlsx'
import type { Transaction, ABCItem, CategoryCost, UDNSummary, Financial } from '@/types'

function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
  const colWidths: number[] = []
  data.forEach((row) => {
    row.forEach((cell, i) => {
      const len = cell ? String(cell).length : 10
      colWidths[i] = Math.max(colWidths[i] ?? 10, len)
    })
  })
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 2, 50) }))
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function exportTransactions(rows: Transaction[], filename?: string) {
  const mapped = rows.map((r) => ({
    Fecha: r.fecha,
    Mes: r.mes,
    Semana: r.semana,
    UDN: r.udn,
    Producto: r.producto,
    Categoría: r.categoria,
    Área: r.area,
    Cantidad: r.cantidad,
    'C. Unitario': r.costoUnitario,
    Total: r.total,
    Notas: r.notas ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(mapped)
  autoWidth(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Costo de Venta')
  XLSX.writeFile(wb, filename ?? `berlichef_costo_venta_${todayStr()}.xlsx`)
}

export function exportABC(rows: ABCItem[], filename?: string) {
  const mapped = rows.map((r) => ({
    Producto: r.producto,
    Categoría: r.categoria,
    'Costo Total': r.total,
    '% Individual': r.pct.toFixed(2),
    '% Acumulado': r.pctAcum.toFixed(2),
    Clase: r.clase,
  }))
  const ws = XLSX.utils.json_to_sheet(mapped)
  autoWidth(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Análisis ABC')
  XLSX.writeFile(wb, filename ?? `berlichef_abc_${todayStr()}.xlsx`)
}

export function exportCategories(rows: CategoryCost[], filename?: string) {
  const mapped = rows.map((r) => ({
    Categoría: r.categoria,
    Total: r.total,
    '% Participación': r.pct.toFixed(2),
  }))
  const ws = XLSX.utils.json_to_sheet(mapped)
  autoWidth(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por Categoría')
  XLSX.writeFile(wb, filename ?? `berlichef_categorias_${todayStr()}.xlsx`)
}

export function exportUDNSummary(rows: UDNSummary[], filename?: string) {
  const mapped = rows.map((r) => ({
    Unidad: r.udn,
    'Ventas Netas': r.ventasNetas,
    'Costo Venta': r.costoVenta,
    'Utilidad Bruta': r.utilidadBruta,
    'U. Bruta %': r.utilidadBrutaPct.toFixed(1),
    'Mano de Obra': r.manoDeObra,
    'MO %': r.manoDeObraPct.toFixed(1),
    'Gastos Op.': r.gastosOperativos,
    'Gastos Op. %': r.gastosOperativosPct.toFixed(1),
    EBITDA: r.ebitda,
    'EBITDA %': r.ebitdaPct.toFixed(1),
    'Food Cost %': r.foodCostPct.toFixed(1),
    'Labour Cost %': r.labourCostPct.toFixed(1),
  }))
  const ws = XLSX.utils.json_to_sheet(mapped)
  autoWidth(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por UDN')
  XLSX.writeFile(wb, filename ?? `berlichef_udns_${todayStr()}.xlsx`)
}

export function exportFinancials(rows: Financial[], filename?: string) {
  const mapped = rows.map((r) => ({
    Mes: r.mes,
    UDN: r.udn,
    Clasificación: r.clasificacion,
    Categoría: r.categoria,
    Descripción: r.descripcion,
    Total: r.total,
    Notas: r.notas ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(mapped)
  autoWidth(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos Operativos')
  XLSX.writeFile(wb, filename ?? `berlichef_gastos_${todayStr()}.xlsx`)
}
