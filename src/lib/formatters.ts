export function fmtMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtMXNDec(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n)
}
