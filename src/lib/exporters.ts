import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { Transaction, ABCItem, UDNSummary, Financial, KPIs } from '@/types'
import { getUDNColor } from '@/config/udnColors'
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

// ── Worksheet builders (reusable for single and multi-export) ────────────────

function buildTransactionsWS(wb: ExcelJS.Workbook, rows: Transaction[], filters = '') {
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
}

const ABC_COLORS: Record<'A' | 'B' | 'C', { bg: string; font: string }> = {
  A: { bg: 'FFFEE2E2', font: 'FFDC2626' },
  B: { bg: 'FFFFF7ED', font: 'FFD97706' },
  C: { bg: 'FFF0FDF4', font: 'FF059669' },
}

function buildAbcWS(wb: ExcelJS.Workbook, rows: ABCItem[], filters = '') {
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
}

function buildCategoriesWS(wb: ExcelJS.Workbook, transactions: Transaction[], filters = '') {
  const ws = wb.addWorksheet('Por Categoría')
  setSheetProps(ws)

  // Two-level grouping: categoría → área
  const catMap: Record<string, Record<string, number>> = {}
  transactions.forEach((t) => {
    if (!catMap[t.categoria]) catMap[t.categoria] = {}
    catMap[t.categoria][t.area] = (catMap[t.categoria][t.area] ?? 0) + t.total
  })
  const grouped = Object.entries(catMap)
    .map(([categoria, areas]) => ({
      categoria,
      total: Object.values(areas).reduce((s, v) => s + v, 0),
      areas: Object.entries(areas)
        .map(([area, total]) => ({ area, total }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total)

  // Single source of truth: sum of category totals (avoids any transaction-level double-count)
  const grandTotal = grouped.reduce((s, c) => s + c.total, 0)

  const cols: ColConfig[] = [
    { header: '#',           key: 'num',      width: 7,  align: 'center', numFmt: numFmt.integer },
    { header: 'Categoría',   key: 'categoria',width: 28 },
    { header: 'Área',        key: 'area',     width: 22 },
    { header: 'Total',       key: 'total',    width: 18, numFmt: numFmt.currency, align: 'right' },
    { header: '% del Total', key: 'pct',      width: 16, numFmt: numFmt.percent,  align: 'right' },
  ]

  buildExcelHeader(ws, 'Costo por Categoría', filters, cols.length)
  applyColumnConfig(ws, cols)

  // Style helper: iterate over exactly cols.length cells by index to avoid eachCell phantom-column bugs
  const styleRow = (row: ExcelJS.Row, font: Partial<ExcelJS.Font>, fill: ExcelJS.Fill, border: Partial<ExcelJS.Borders>) => {
    cols.forEach((col, i) => {
      const cell = row.getCell(i + 1)
      cell.font      = font as ExcelJS.Font
      cell.fill      = fill
      cell.border    = border
      cell.alignment = { horizontal: col.align ?? 'left', vertical: 'middle' }
      if (col.numFmt) cell.numFmt = col.numFmt
    })
  }

  let flatIdx = 0
  grouped.forEach((cat, catIdx) => {
    const catPct = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0

    // Parent row — bold, light-blue background
    const pRow = ws.addRow([catIdx + 1, cat.categoria, '', cat.total, catPct])
    pRow.height = 18
    styleRow(
      pRow,
      { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF1E3A8A' } },
      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } },
      { bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } } },
    )
    flatIdx++

    // Child rows — indented area name, normal alternating style
    cat.areas.forEach((area) => {
      const areaPct = grandTotal > 0 ? (area.total / grandTotal) * 100 : 0
      const cRow = addDataRow(ws, ['', '', area.area, area.total, areaPct], cols, flatIdx++)
      cRow.getCell(3).alignment = { indent: 3, horizontal: 'left', vertical: 'middle' }
    })
  })

  // Grand-total row — same index-based styling, numFmt applied explicitly
  const totalRow = ws.addRow(['', 'TOTAL', '', grandTotal, 100])
  totalRow.height = 18
  styleRow(
    totalRow,
    { name: 'Calibri', bold: true, size: 11, color: { argb: EXCEL_COLORS.totalText } },
    { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.totalBg } },
    { top: { style: 'medium', color: { argb: EXCEL_COLORS.headerBg } }, bottom: { style: 'medium', color: { argb: EXCEL_COLORS.headerBg } } },
  )
}

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

function buildUDNWS(wb: ExcelJS.Workbook, rows: UDNSummary[], filters = '') {
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
    colorCell(row.getCell(6),  r.foodCostPct,        true,  [28, 35])
    colorCell(row.getCell(7),  r.labourCostPct,      true,  [32, 40])
    colorCell(row.getCell(9),  r.gastosOperativosPct,true,  [15, 20])
    colorCell(row.getCell(11), r.ebitdaPct,          false, [18, 10])
  })

  const totalVentas  = rows.reduce((s, r) => s + r.ventasNetas, 0)
  const totalCosto   = rows.reduce((s, r) => s + r.costoVenta, 0)
  const totalUB      = rows.reduce((s, r) => s + r.utilidadBruta, 0)
  const totalEBITDA  = rows.reduce((s, r) => s + r.ebitda, 0)
  const avgFoodCost  = totalVentas > 0 ? (totalCosto / totalVentas) * 100 : 0
  const avgEBITDAPct = totalVentas > 0 ? (totalEBITDA / totalVentas) * 100 : 0
  const avgUBPct     = totalVentas > 0 ? (totalUB / totalVentas) * 100 : 0

  addDataRow(ws, [
    'CONSOLIDADO', totalVentas, totalCosto, totalUB,
    avgUBPct, avgFoodCost, 0, 0, 0, totalEBITDA, avgEBITDAPct,
  ], cols, rows.length, true)
}

function buildFinancialsWS(wb: ExcelJS.Workbook, rows: Financial[], filters = '') {
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
    const subRow = addDataRow(ws, ['', '', '', `Subtotal ${cat}`, '', subtotal, ''], cols, rowIdx++, false)
    const subCell = subRow.getCell(6)
    subCell.font   = { name: 'Calibri', bold: true, size: 10, color: { argb: EXCEL_COLORS.subheaderText } }
    subCell.numFmt = numFmt.currency
  }
  addDataRow(ws, ['', '', '', '', 'TOTAL', grandTotal, ''], cols, rowIdx, true)
}

// ── Estado de Resultados — UDN worksheet (full Spanish columns + UDN colors) ─

function buildEstadoResultadosUDNWS(wb: ExcelJS.Workbook, rows: UDNSummary[], filters = '') {
  const ws = wb.addWorksheet('Por Unidad de Negocio')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: 'Unidad de Negocio',  key: 'udn',                width: 24 },
    { header: 'Ventas Netas',       key: 'ventasNetas',        width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: 'Costo de Venta',     key: 'costoVenta',         width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: 'Utilidad Bruta',     key: 'utilidadBruta',      width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: '% Utilidad Bruta',   key: 'utilidadBrutaPct',   width: 17, numFmt: numFmt.percent,  align: 'right' },
    { header: 'Mano de Obra',       key: 'manoDeObra',         width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: 'Gastos Operativos',  key: 'gastosOperativos',   width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: 'EBITDA',             key: 'ebitda',             width: 17, numFmt: numFmt.currency, align: 'right' },
    { header: 'EBITDA %',           key: 'ebitdaPct',          width: 17, numFmt: numFmt.percent,  align: 'right' },
  ]

  buildExcelHeader(ws, 'Estado de Resultados — Desglose por Unidad', filters, cols.length)
  applyColumnConfig(ws, cols)

  rows.forEach((r, i) => {
    const row = addDataRow(ws, [
      r.udn, r.ventasNetas, r.costoVenta, r.utilidadBruta,
      r.utilidadBrutaPct, r.manoDeObra, r.gastosOperativos,
      r.ebitda, r.ebitdaPct,
    ], cols, i)

    // Thick left border with UDN palette color
    const udnHex = getUDNColor(r.udn).replace('#', '')
    const firstCell = row.getCell(1)
    firstCell.border = {
      ...firstCell.border,
      left: { style: 'thick', color: { argb: `FF${udnHex}` } },
    }

    // EBITDA cell (col 8)
    const eCell = row.getCell(8)
    eCell.font   = { ...eCell.font, color: { argb: r.ebitda >= 0 ? 'FF059669' : 'FFDC2626' } }
    eCell.numFmt = numFmt.currency

    // EBITDA % cell (col 9)
    const ePctCell = row.getCell(9)
    ePctCell.font   = { ...ePctCell.font, color: { argb: r.ebitdaPct >= 0 ? 'FF059669' : 'FFDC2626' } }
    ePctCell.numFmt = numFmt.percent
  })

  // Aggregate totals
  const totalVentas  = rows.reduce((s, r) => s + r.ventasNetas, 0)
  const totalCosto   = rows.reduce((s, r) => s + r.costoVenta, 0)
  const totalUB      = rows.reduce((s, r) => s + r.utilidadBruta, 0)
  const totalMO      = rows.reduce((s, r) => s + r.manoDeObra, 0)
  const totalGastos  = rows.reduce((s, r) => s + r.gastosOperativos, 0)
  const totalEBITDA  = rows.reduce((s, r) => s + r.ebitda, 0)
  const avgUBPct     = totalVentas > 0 ? (totalUB / totalVentas) * 100 : 0
  const avgEBITDAPct = totalVentas > 0 ? (totalEBITDA / totalVentas) * 100 : 0

  const totalRow = addDataRow(ws, [
    'Total Consolidado', totalVentas, totalCosto, totalUB,
    avgUBPct, totalMO, totalGastos, totalEBITDA, avgEBITDAPct,
  ], cols, rows.length, true)

  // Override EBITDA colors on dark total row (bright variants readable on #0F172A)
  const teCell = totalRow.getCell(8)
  teCell.font   = { ...teCell.font, color: { argb: totalEBITDA >= 0 ? 'FF34D399' : 'FFF87171' } }
  teCell.numFmt = numFmt.currency

  const tePctCell = totalRow.getCell(9)
  tePctCell.font   = { ...tePctCell.font, color: { argb: avgEBITDAPct >= 0 ? 'FF34D399' : 'FFF87171' } }
  tePctCell.numFmt = numFmt.percent
}

// ── Estado de Resultados — P&L consolidado worksheet ─────────────────────────

function buildPLWS(wb: ExcelJS.Workbook, kpis: KPIs, filters = '') {
  const ws = wb.addWorksheet('Estado de Resultados')
  setSheetProps(ws)

  const cols: ColConfig[] = [
    { header: 'Concepto',  key: 'concepto', width: 28 },
    { header: 'Importe',   key: 'importe',  width: 22, numFmt: numFmt.currency, align: 'right' },
    { header: '% Ventas',  key: 'pct',      width: 16, numFmt: numFmt.percent,  align: 'right' },
  ]

  buildExcelHeader(ws, 'Estado de Resultados — P&L Consolidado', filters, cols.length)
  applyColumnConfig(ws, cols)

  type PLExcelRow = { concepto: string; importe: number; pct: number; fill: string; bold: boolean }
  const plData: PLExcelRow[] = [
    { concepto: 'Ventas Netas',      importe: kpis.ventasNetas,      pct: 100,                       fill: 'FFEFF6FF', bold: false },
    { concepto: 'Costo de Venta',    importe: kpis.costoVenta,       pct: kpis.foodCostPct,          fill: 'FFFFF5F5', bold: false },
    { concepto: 'Utilidad Bruta',    importe: kpis.utilidadBruta,    pct: kpis.utilidadBrutaPct,     fill: 'FFF0FDF4', bold: true  },
    { concepto: 'Mano de Obra',      importe: kpis.manoDeObra,       pct: kpis.manoDeObraPct,        fill: 'FFFFFBEB', bold: false },
    { concepto: 'Gastos Operativos', importe: kpis.gastosOperativos, pct: kpis.gastosOperativosPct,  fill: 'FFF5F3FF', bold: false },
    {
      concepto: 'EBITDA',
      importe: kpis.ebitda,
      pct: kpis.ebitdaPct,
      fill: kpis.ebitda >= 0 ? 'FFF0FDF4' : 'FFFFF5F5',
      bold: true,
    },
  ]

  plData.forEach((row) => {
    const wsRow = ws.addRow([row.concepto, row.importe, row.pct])
    wsRow.height = 20
    const fillStyle: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row.fill } }
    cols.forEach((col, ci) => {
      const cell = wsRow.getCell(ci + 1)
      cell.fill      = fillStyle
      cell.font      = { name: 'Calibri', bold: row.bold, size: row.bold ? 11 : 10, color: { argb: 'FF0F172A' } }
      cell.alignment = { horizontal: col.align ?? 'left', vertical: 'middle' }
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
      if (col.numFmt) cell.numFmt = col.numFmt
    })
  })
}

// ── Public single-export functions ───────────────────────────────────────────

export async function exportTransactions(rows: Transaction[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildTransactionsWS(wb, rows, filters)
  await saveWorkbook(wb, filename ?? `berlichef_costo_venta_${todayStr()}.xlsx`)
}

export async function exportABC(rows: ABCItem[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildAbcWS(wb, rows, filters)
  await saveWorkbook(wb, filename ?? `berlichef_abc_${todayStr()}.xlsx`)
}

export async function exportCategories(transactions: Transaction[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildCategoriesWS(wb, transactions, filters)
  await saveWorkbook(wb, filename ?? `berlichef_categorias_${todayStr()}.xlsx`)
}

export async function exportUDNSummary(rows: UDNSummary[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildUDNWS(wb, rows, filters)
  await saveWorkbook(wb, filename ?? `berlichef_udns_${todayStr()}.xlsx`)
}

export async function exportEstadoResultados(rows: UDNSummary[], kpis: KPIs, filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildEstadoResultadosUDNWS(wb, rows, filters)
  buildPLWS(wb, kpis, filters)
  await saveWorkbook(wb, filename ?? `berlichef_estado_resultados_${todayStr()}.xlsx`)
}

export async function exportFinancials(rows: Financial[], filters = '', filename?: string) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)
  buildFinancialsWS(wb, rows, filters)
  await saveWorkbook(wb, filename ?? `berlichef_gastos_${todayStr()}.xlsx`)
}

// ── Multi-export ─────────────────────────────────────────────────────────────

export interface MultiExportData {
  transactions:  Transaction[]
  abcItems:      ABCItem[]
  categories:    Transaction[]
  udnSummaries:  UDNSummary[]
  financials:    Financial[]
}

const SHEET_ORDER = [
  'costoVentaDetallado',
  'analisisAbc',
  'costoPorCategoria',
  'comparativoUDN',
  'gastosOperativos',
] as const

type ReportKey = typeof SHEET_ORDER[number]

export async function downloadMultipleReports(
  selected: Set<string>,
  data: MultiExportData,
  filters = '',
) {
  const wb = new ExcelJS.Workbook()
  setWorkbookProps(wb)

  const ordered = SHEET_ORDER.filter((k) => selected.has(k))
  for (const key of ordered) {
    if (key === 'costoVentaDetallado') buildTransactionsWS(wb, data.transactions, filters)
    if (key === 'analisisAbc')         buildAbcWS(wb, data.abcItems, filters)
    if (key === 'costoPorCategoria')   buildCategoriesWS(wb, data.categories, filters)
    if (key === 'comparativoUDN')      buildUDNWS(wb, data.udnSummaries, filters)
    if (key === 'gastosOperativos')    buildFinancialsWS(wb, data.financials, filters)
  }

  const dateStr = new Date().toLocaleDateString('es-MX').replace(/\//g, '-')
  await saveWorkbook(wb, `Berlichef_Reportes_${dateStr}.xlsx`)
}

export type { ReportKey }
