import type ExcelJS from 'exceljs'
import { styles, applyStyle } from './excelStyles'

function colLetter(n: number): string {
  return String.fromCharCode(64 + n) // A=1 … Z=26
}

export function setWorkbookProps(wb: ExcelJS.Workbook) {
  wb.creator = 'Berlichef Portal Financiero'
  wb.lastModifiedBy = 'Sistema Berlichef'
  wb.created = new Date()
  wb.modified = new Date()
  wb.properties.date1904 = false
}

export function setSheetProps(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    printTitlesRow: '1:4',
  }
  ws.headerFooter = {
    oddFooter: '&L&"Calibri,Regular"&8Berlichef Portal Financiero&C&P de &N&R&8Confidencial',
  }
  ws.properties.tabColor = { argb: 'FF1E40AF' }
}

export function buildExcelHeader(
  ws: ExcelJS.Worksheet,
  reportName: string,
  filters: string,
  totalCols: number,
) {
  const lastCol = colLetter(totalCols)

  // Fila 1 — Título corporativo
  ws.mergeCells(`A1:${lastCol}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = `BERLICHEF  |  ${reportName.toUpperCase()}`
  applyStyle(titleCell, styles.reportTitle)
  ws.getRow(1).height = 32

  // Fila 2 — Fecha + filtros
  const halfCol = colLetter(Math.ceil(totalCols / 2))
  ws.mergeCells(`A2:${halfCol}2`)
  const dateCell = ws.getCell('A2')
  dateCell.value = `Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`
  applyStyle(dateCell, styles.reportMeta)

  const nextCol = colLetter(Math.ceil(totalCols / 2) + 1)
  ws.mergeCells(`${nextCol}2:${lastCol}2`)
  const filterCell = ws.getCell(`${nextCol}2`)
  filterCell.value = `Filtros: ${filters || 'Todos los datos'}`
  applyStyle(filterCell, styles.reportMeta)
  ws.getRow(2).height = 18

  // Fila 3 — Separador azul
  ws.mergeCells(`A3:${lastCol}3`)
  const sepCell = ws.getCell('A3')
  sepCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
  ws.getRow(3).height = 4
}

export interface ColConfig {
  header: string
  key: string
  width: number
  numFmt?: string
  align?: ExcelJS.Alignment['horizontal']
}

export function applyColumnConfig(ws: ExcelJS.Worksheet, cols: ColConfig[], headerRow = 4) {
  // Anchos de columna
  ws.columns = cols.map((c) => ({ key: c.key, width: c.width }))

  // Fila de encabezados
  const hRow = ws.getRow(headerRow)
  hRow.height = 22
  cols.forEach((c, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value = c.header
    applyStyle(cell, styles.columnHeader)
    if (c.align) cell.alignment = { ...cell.alignment, horizontal: c.align }
  })

  // Auto-filter en fila de encabezados
  ws.autoFilter = {
    from: { row: headerRow, column: 1 },
    to:   { row: headerRow, column: cols.length },
  }

  // Congelar filas 1-4
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRow, activeCell: 'A5' }]
}

export function addDataRow(
  ws: ExcelJS.Worksheet,
  values: (string | number | undefined)[],
  cols: ColConfig[],
  rowIndex: number,
  isTotal = false,
) {
  const row = ws.addRow(values)
  const style = isTotal ? styles.totalRow : rowIndex % 2 === 0 ? styles.dataRowAlt : styles.dataRow
  row.height = 18
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    applyStyle(cell, style)
    const col = cols[colNum - 1]
    if (col?.numFmt && !isTotal) cell.numFmt = col.numFmt
    if (col?.align)              cell.alignment = { ...cell.alignment, horizontal: col.align }
  })
  return row
}

export function addSectionHeader(ws: ExcelJS.Worksheet, text: string, totalCols: number) {
  const row = ws.addRow([text])
  ws.mergeCells(`A${row.number}:${colLetter(totalCols)}${row.number}`)
  row.height = 18
  const cell = ws.getCell(`A${row.number}`)
  applyStyle(cell, styles.sectionHeader)
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
