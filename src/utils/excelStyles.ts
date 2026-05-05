import type ExcelJS from 'exceljs'

export const EXCEL_COLORS = {
  headerBg:      'FF1E40AF',
  headerText:    'FFFFFFFF',
  subheaderBg:   'FFEFF6FF',
  subheaderText: 'FF1E40AF',
  rowAlt:        'FFF8FAFC',
  rowNormal:     'FFFFFFFF',
  totalBg:       'FF0F172A',
  totalText:     'FFFFFFFF',
  borderColor:   'FFE2E8F0',
  dangerText:    'FFDC2626',
  successText:   'FF059669',
  warningText:   'FFD97706',
}

export const numFmt = {
  currency:    '"$"#,##0.00',
  currencyInt: '"$"#,##0',
  percent:     '0.00"%"',
  decimal2:    '#,##0.00',
  integer:     '#,##0',
  date:        'DD/MM/YYYY',
}

type Style = Partial<ExcelJS.Style>

export const styles: Record<string, Style> = {
  reportTitle: {
    font: { name: 'Calibri', bold: true, size: 16, color: { argb: EXCEL_COLORS.headerText } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'left' },
  },

  reportMeta: {
    font: { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.subheaderBg } },
    alignment: { vertical: 'middle' },
  },

  columnHeader: {
    font: { name: 'Calibri', bold: true, size: 11, color: { argb: EXCEL_COLORS.headerText } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: false },
    border: {
      top:    { style: 'thin', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      left:   { style: 'thin', color: { argb: 'FF1E3A8A' } },
      right:  { style: 'thin', color: { argb: 'FF1E3A8A' } },
    },
  },

  dataRow: {
    font: { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.rowNormal } },
    alignment: { vertical: 'middle' },
    border: {
      bottom: { style: 'hair', color: { argb: EXCEL_COLORS.borderColor } },
      right:  { style: 'hair', color: { argb: EXCEL_COLORS.borderColor } },
    },
  },

  dataRowAlt: {
    font: { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.rowAlt } },
    alignment: { vertical: 'middle' },
    border: {
      bottom: { style: 'hair', color: { argb: EXCEL_COLORS.borderColor } },
      right:  { style: 'hair', color: { argb: EXCEL_COLORS.borderColor } },
    },
  },

  totalRow: {
    font: { name: 'Calibri', bold: true, size: 11, color: { argb: EXCEL_COLORS.totalText } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.totalBg } },
    alignment: { vertical: 'middle' },
    border: {
      top:    { style: 'medium', color: { argb: EXCEL_COLORS.headerBg } },
      bottom: { style: 'medium', color: { argb: EXCEL_COLORS.headerBg } },
    },
  },

  sectionHeader: {
    font: { name: 'Calibri', bold: true, size: 10, color: { argb: EXCEL_COLORS.subheaderText } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.subheaderBg } },
    alignment: { vertical: 'middle' },
    border: {
      top:    { style: 'thin', color: { argb: 'FFB0C4DE' } },
      bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
    },
  },
}

export function applyStyle(cell: ExcelJS.Cell, style: Style) {
  if (style.font)      cell.font      = style.font
  if (style.fill)      cell.fill      = style.fill
  if (style.alignment) cell.alignment = style.alignment
  if (style.border)    cell.border    = style.border
}
