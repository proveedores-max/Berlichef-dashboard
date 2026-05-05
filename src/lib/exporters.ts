import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { Transaction, ABCItem, CategoryCost, UDNSummary, Financial } from '@/types'
import { numFmt, EXCEL_COLORS } from '@/utils/excelStyles'
import {
  setWorkbookProps,
  setSheetProps,
  buildExcelHeader,
  applyColumnConfig,
  addDataRow,
  addSectionHeader,
  todayStr,
  type ColConfig,
} from '@/utils/excelBuilder'

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
}

// ── 1. Costo de Venta ────────────────────────────────────────────────────────

export async function exportTransactions(rows: Transaction[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  const ws = wb.addWorksheet('Costo de Venta')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: 'Fecha',       key: 'fecha',        width: 14, align: 'center' },
    { header: 'Mes',         key: 'mes',          width: 12, align: 'center' },
    { header: 'Semana',      key: 'semana',       width: 10, align: 'center', numFmt: numFmt.integer },
    { header: 'UDN',         key: 'udn',          width: 18 },
    { header: 'Producto',    key: 'producto',     width: 32 },
    { header: 'Categoría',   key: 'categoria',    width: 20 },
    { header: 'Área',        key: 'area',         width: 16 },
    { header: 'Cantidad',    key: 'cantidad',     width: 12, numFmt: numFmt.decimal2, align: 'right' },
    { header: 'C. Unitario', key: 'costoUnitario',width: 14, numFmt: numFmt.currency, align: 'right' },
    { header: 'Total',       key: 'total',        width: 16, numFmt: numFmt.currency, align: 'right' },
    { header: 'Notas',       key: 'notas',        width: 24 },
  ]

  buildExcelHeader(ws, 'Costo de Venta', filters, cols.length)
  applyColumnConfig(ws, cols)

  let grandTotal = 0
  rows.forEach((r, i) => {
    addDataRow(ws, [r.fecha, r.mes, r.semana, r.udn, r.producto, r.categoria, r.area, r.cantidad, r.costoUnitario, r.total, r.notas ?? ''], cols, i)
    grandTotal += r.total
  })

  addDataRow(ws, ['', '', '', '', '', '', '', '', 'TOTAL', grandTotal, ''], cols, rows.length, true)

  await saveWorkbook(wb, filename ?? `berlichef_costo_venta_${todayStr()}.xlsx`)
}

// ── 2. Análisis ABC ──────────────────────────────────────────────────────────

const ABC_COLORS: Record<'A' | 'B' | 'C', { bg: string; font: string }> = {
  A: { bg: 'FFFEE2E2', font: 'FFDC2626' },
  B: { bg: 'FFFFF7ED', font: 'FFD97706' },
  C: { bg: 'FFF0FDF4', font: 'FF059669' },
}

export async function exportABC(rows: ABCItem[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  const ws = wb.addWorksheet('Análisis ABC')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: '#',          key: 'num',      width: 7,  align: 'center', numFmt: numFmt.integer },
    { header: 'Producto',   key: 'producto', width: 34 },
    { header: 'Categoría',  key: 'categoria',width: 20 },
    { header: 'Costo Total',key: 'total',    width: 16, numFmt: numFmt.currency, align: 'right' },
    { header: '% Indiv.',   key: 'pct',      width: 12, numFmt: numFmt.percent,  align: 'right' },
    { header: '% Acumulado',key: 'pctAcum',  width: 14, numFmt: numFmt.percent,  align: 'right' },
    { header: 'Clase',      key: 'clase',    width: 10, align: 'center' },
  ]

  buildExcelHeader(ws, 'Análisis ABC — Pareto de Costos', filters, cols.length)
  applyColumnConfig(ws, cols)

  // Summary block before table rows
  addSectionHeader(ws, 'Resumen por clase', cols.length)
  const byClass = { A: { count: 0, total: 0 }, B: { count: 0, total: 0 }, C: { count: 0, total: 0 } }
  rows.forEach((r) => { byClass[r.clase].count++; byClass[r.clase].total += r.total })
  const grandTotalABC = rows.reduce((s, r) => s + r.total, 0);
  (['A', 'B', 'C'] as const).forEach((cls, i) => {
    const pct = grandTotalABC > 0 ? (byClass[cls].total / grandTotalABC) * 100 : 0
    const row = addDataRow(ws, [cls, `${byClass[cls].count} productos`, '', byClass[cls].total, pct, '', ''], cols, i)
    const clsCell = row.getCell(1)
    clsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ABC_COLORS[cls].bg } }
    clsCell.font  = { ...clsCell.font, bold: true, color: { argb: ABC_COLORS[cls].font } }
  })

  addSectionHeader(ws, 'Detalle por producto', cols.length)

  rows.forEach((r, i) => {
    const row = addDataRow(ws, [i + 1, r.producto, r.categoria, r.total, r.pct, r.pctAcum, r.clase], cols, i)
    const clsCell = row.getCell(7)
    clsCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: ABC_COLORS[r.clase].bg } }
    clsCell.font  = { ...clsCell.font, bold: true, color: { argb: ABC_COLORS[r.clase].font } }
    clsCell.border = { top: { style: 'thin', color: { argb: ABC_COLORS[r.clase].font } }, bottom: { style: 'thin', color: { argb: ABC_COLORS[r.clase].font } }, left: { style: 'thin', color: { argb: ABC_COLORS[r.clase].font } }, right: { style: 'thin', color: { argb: ABC_COLORS[r.clase].font } } }
  })

  addDataRow(ws, ['', 'TOTAL', '', grandTotalABC, 100, '', ''], cols, rows.length, true)

  await saveWorkbook(wb, filename ?? `berlichef_abc_${todayStr()}.xlsx`)
}

// ── 3. Por Categoría ─────────────────────────────────────────────────────────

export async function exportCategories(rows: CategoryCost[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  const ws = wb.addWorksheet('Por Categoría')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: '#',             key: 'num',      width: 7,  align: 'center', numFmt: numFmt.integer },
    { header: 'Categoría',     key: 'categoria',width: 30 },
    { header: 'Total',         key: 'total',    width: 18, numFmt: numFmt.currency, align: 'right' },
    { header: '% Participación',key: 'pct',     width: 18, numFmt: numFmt.percent,  align: 'right' },
  ]

  buildExcelHeader(ws, 'Costo por Categoría', filters, cols.length)
  applyColumnConfig(ws, cols)

  const maxPct = Math.max(...rows.map((r) => r.pct), 1)

  rows.forEach((r, i) => {
    const row = addDataRow(ws, [i + 1, r.categoria, r.total, r.pct], cols, i)
    // Visual data-bar effect: gradient fill on the % cell proportional to value
    const barCell = row.getCell(4)
    const intensity = Math.round((r.pct / maxPct) * 180)
    const hex = intensity.toString(16).padStart(2, '0').toUpperCase()
    barCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hex}C4DE` } }
    barCell.font = { name: 'Calibri', size: 10, bold: r.pct > 20, color: { argb: 'FF0F172A' } }
  })

  const grandTotal = rows.reduce((s, r) => s + r.total, 0)
  addDataRow(ws, ['', 'TOTAL', grandTotal, 100], cols, rows.length, true)

  await saveWorkbook(wb, filename ?? `berlichef_categorias_${todayStr()}.xlsx`)
}

// ── 4. Por UDN ───────────────────────────────────────────────────────────────

function colorCell(cell: ExcelJS.Cell, value: number, lowGood: boolean, thresholds: [number, number]) {
  const [warn, bad] = thresholds
  let bg: string
  if (lowGood) {
    bg = value <= warn ? EXCEL_COLORS.successText : value <= bad ? EXCEL_COLORS.warningText : EXCEL_COLORS.dangerText
  } else {
    bg = value >= warn ? EXCEL_COLORS.successText : value >= bad ? EXCEL_COLORS.warningText : EXCEL_COLORS.dangerText
  }
  cell.font = { ...cell.font, bold: true, color: { argb: bg } }
}

export async function exportUDNSummary(rows: UDNSummary[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  const ws = wb.addWorksheet('Por UDN')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: 'Unidad',       key: 'udn',                width: 20 },
    { header: 'Ventas Netas', key: 'ventasNetas',        width: 16, numFmt: numFmt.currency, align: 'right' },
    { header: 'Costo Venta',  key: 'costoVenta',         width: 14, numFmt: numFmt.currency, align: 'right' },
    { header: 'Util. Bruta',  key: 'utilidadBruta',      width: 14, numFmt: numFmt.currency, align: 'right' },
    { header: 'Util. Bruta %',key: 'utilidadBrutaPct',   width: 13, numFmt: numFmt.percent,  align: 'right' },
    { header: 'Food Cost %',  key: 'foodCostPct',        width: 13, numFmt: numFmt.percent,  align: 'right' },
    { header: 'Labour %',     key: 'labourCostPct',      width: 12, numFmt: numFmt.percent,  align: 'right' },
    { header: 'Gastos Op.',   key: 'gastosOperativos',   width: 14, numFmt: numFmt.currency, align: 'right' },
    { header: 'Gastos Op. %', key: 'gastosOperativosPct',width: 13, numFmt: numFmt.percent,  align: 'right' },
    { header: 'EBITDA',       key: 'ebitda',             width: 14, numFmt: numFmt.currency, align: 'right' },
    { header: 'EBITDA %',     key: 'ebitdaPct',          width: 12, numFmt: numFmt.percent,  align: 'right' },
  ]

  buildExcelHeader(ws, 'Comparativo por Unidad de Negocio', filters, cols.length)
  applyColumnConfig(ws, cols)

  rows.forEach((r, i) => {
    const row = addDataRow(ws, [
      r.udn, r.ventasNetas, r.costoVenta, r.utilidadBruta,
      r.utilidadBrutaPct, r.foodCostPct, r.labourCostPct,
      r.gastosOperativos, r.gastosOperativosPct, r.ebitda, r.ebitdaPct,
    ], cols, i)

    // Food Cost %: good < 28, warn < 35, bad >= 35
    colorCell(row.getCell(6),  r.foodCostPct,        true,  [28, 35])
    // Labour %: good < 32, warn < 40
    colorCell(row.getCell(7),  r.labourCostPct,      true,  [32, 40])
    // Gastos Op. %: good < 15, warn < 20
    colorCell(row.getCell(9),  r.gastosOperativosPct,true,  [15, 20])
    // EBITDA %: good >= 18, warn >= 10
    colorCell(row.getCell(11), r.ebitdaPct,          false, [18, 10])
  })

  // Totals / averages row
  const totalVentas    = rows.reduce((s, r) => s + r.ventasNetas, 0)
  const totalCosto     = rows.reduce((s, r) => s + r.costoVenta, 0)
  const totalUB        = rows.reduce((s, r) => s + r.utilidadBruta, 0)
  const totalEBITDA    = rows.reduce((s, r) => s + r.ebitda, 0)
  const avgFoodCost    = totalVentas > 0 ? (totalCosto / totalVentas) * 100 : 0
  const avgEBITDAPct   = totalVentas > 0 ? (totalEBITDA / totalVentas) * 100 : 0
  const avgUBPct       = totalVentas > 0 ? (totalUB / totalVentas) * 100 : 0

  addDataRow(ws, [
    'CONSOLIDADO', totalVentas, totalCosto, totalUB,
    avgUBPct, avgFoodCost, 0,
    0, 0, totalEBITDA, avgEBITDAPct,
  ], cols, rows.length, true)

  await saveWorkbook(wb, filename ?? `berlichef_udns_${todayStr()}.xlsx`)
}

// ── 5. Gastos Operativos ─────────────────────────────────────────────────────

export async function exportFinancials(rows: Financial[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  const ws = wb.addWorksheet('Gastos Operativos')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: 'Mes',          key: 'mes',          width: 12 },
    { header: 'UDN',          key: 'udn',          width: 18 },
    { header: 'Clasificación',key: 'clasificacion', width: 18 },
    { header: 'Categoría',    key: 'categoria',    width: 22 },
    { header: 'Descripción',  key: 'descripcion',  width: 34 },
    { header: 'Total',        key: 'total',        width: 16, numFmt: numFmt.currency, align: 'right' },
    { header: 'Notas',        key: 'notas',        width: 24 },
  ]

  buildExcelHeader(ws, 'Gastos Operativos', filters, cols.length)
  applyColumnConfig(ws, cols)

  // Group by clasificacion → categoria
  const groups = new Map<string, Financial[]>()
  rows.forEach((r) => {
    const key = `${r.clasificacion}||${r.categoria}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  })

  let rowIdx = 0
  let grandTotal = 0
  let currentClasif = ''

  for (const [key, items] of groups) {
    const [clasif, cat] = key.split('||')

    if (clasif !== currentClasif) {
      addSectionHeader(ws, `▸ ${clasif}`, cols.length)
      currentClasif = clasif
    }

    addSectionHeader(ws, `  ${cat}`, cols.length)

    let subtotal = 0
    items.forEach((r) => {
      addDataRow(ws, [r.mes, r.udn, r.clasificacion, r.categoria, r.descripcion, r.total, r.notas ?? ''], cols, rowIdx++)
      subtotal  += r.total
      grandTotal += r.total
    })

    // Subtotal row for this category
    const subRow = addDataRow(ws, ['', '', '', `Subtotal ${cat}`, '', subtotal, ''], cols, rowIdx++, false)
    const subCell = subRow.getCell(6)
    subCell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: EXCEL_COLORS.subheaderText } }
    subCell.numFmt = numFmt.currency
  }

  addDataRow(ws, ['', '', '', '', 'TOTAL', grandTotal, ''], cols, rowIdx, true)

  await saveWorkbook(wb, filename ?? `berlichef_gastos_${todayStr()}.xlsx`)
}
