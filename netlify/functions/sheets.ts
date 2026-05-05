import type { Handler } from '@netlify/functions'

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? '14cre1M0kuiEASpBeDqln5a8gC-mgeC7ewE7KqqRUorA'
const API_KEY = process.env.GOOGLE_API_KEY ?? ''

interface Transaction {
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

interface Financial {
  mes: string
  udn: string
  clasificacion: string
  categoria: string
  descripcion: string
  total: number
  notas?: string
}

interface Sale {
  mes: string
  udn: string
  ventasNetas: number
  concepto: string
}

interface Product {
  producto: string
  costoUnitario: number
  categoria: string
}

function parseMoney(val: string | undefined): number {
  if (!val) return 0
  return parseFloat(String(val).replace(/[$,\s]/g, '')) || 0
}

async function fetchSheet(range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Sheets error ${res.status}: ${text}`)
  }
  const json = await res.json() as { values?: string[][] }
  return json.values ?? []
}

function parseTransactions(rows: string[][]): Transaction[] {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    fecha: r[0] ?? '',
    mes: r[1] ?? '',
    semana: parseInt(r[2] ?? '0') || 0,
    udn: r[3] ?? '',
    producto: r[4] ?? '',
    categoria: r[5] ?? '',
    area: r[6] ?? '',
    cantidad: parseFloat(r[7] ?? '0') || 0,
    costoUnitario: parseMoney(r[8]),
    total: parseMoney(r[9]),
    notas: r[10],
  }))
}

function parseFinancials(rows: string[][]): Financial[] {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    mes: r[0] ?? '',
    udn: r[1] ?? '',
    clasificacion: r[2] ?? '',
    categoria: r[3] ?? '',
    descripcion: r[4] ?? '',
    total: parseMoney(r[5]),
    notas: r[6],
  }))
}

function parseSales(rows: string[][]): Sale[] {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    mes: r[0] ?? '',
    udn: r[1] ?? '',
    ventasNetas: parseMoney(r[2]),
    concepto: r[3] ?? '',
  }))
}

function parseProducts(rows: string[][]): Product[] {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    producto: r[0] ?? '',
    costoUnitario: parseMoney(r[1]),
    categoria: r[2] ?? '',
  }))
}

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=300',
  }

  try {
    if (!API_KEY) {
      throw new Error('GOOGLE_API_KEY no configurada')
    }

    const [costoRows, gastosRows, ventasRows, productosRows] = await Promise.all([
      fetchSheet('Costo de Venta!A:K'),
      fetchSheet('Gastos Operativos!A:G'),
      fetchSheet('Ventas!A:D'),
      fetchSheet('BDD Precios!A:C'),
    ])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactions: parseTransactions(costoRows),
        financials: parseFinancials(gastosRows),
        sales: parseSales(ventasRows),
        products: parseProducts(productosRows),
        lastUpdated: new Date().toISOString(),
      }),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: message }),
    }
  }
}
