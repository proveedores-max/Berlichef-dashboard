export interface GaugeThresholds {
  danger?:  number
  warning:  number
  good?:    number
}

export interface GaugeConfig {
  label:          string
  key:            'utilBrutaPct' | 'foodCostPct' | 'primeCostPct' | 'ebitdaPct' | 'manoObraPct' | 'gastosOpPct'
  min:            number
  max:            number
  benchmarkLabel: string
  thresholds:     GaugeThresholds
  invertColors:   boolean
  tooltip:        string
}

export const GAUGE_CONFIG: GaugeConfig[] = [
  {
    label: 'MARGEN BRUTO %',
    key: 'utilBrutaPct',
    min: 0, max: 100,
    benchmarkLabel: '>70%',
    thresholds: { warning: 60, good: 70 },
    invertColors: false,
    tooltip: 'Porcentaje de ventas que queda tras el costo de alimentos. Benchmark: >70%',
  },
  {
    label: 'FOOD COST %',
    key: 'foodCostPct',
    min: 0, max: 60,
    benchmarkLabel: '<28%',
    thresholds: { warning: 28, danger: 35 },
    invertColors: true,
    tooltip: 'Costo de ingredientes sobre ventas. Benchmark restaurantes: 20–28%',
  },
  {
    label: 'PRIME COST %',
    key: 'primeCostPct',
    min: 0, max: 100,
    benchmarkLabel: '<60%',
    thresholds: { warning: 60, danger: 70 },
    invertColors: true,
    tooltip: 'Costo de alimentos + nómina sobre ventas. Indicador clave. Benchmark: <60%',
  },
  {
    label: 'MARGEN EBITDA %',
    key: 'ebitdaPct',
    min: 0, max: 40,
    benchmarkLabel: '>18%',
    thresholds: { warning: 10, good: 18 },
    invertColors: false,
    tooltip: 'Rentabilidad operativa. Benchmark restaurantes: >18%',
  },
  {
    label: 'NÓMINA %',
    key: 'manoObraPct',
    min: 0, max: 60,
    benchmarkLabel: '<32%',
    thresholds: { warning: 32, danger: 40 },
    invertColors: true,
    tooltip: 'Costo de mano de obra sobre ventas. Benchmark: 28–32%',
  },
  {
    label: 'GASTOS OP. %',
    key: 'gastosOpPct',
    min: 0, max: 40,
    benchmarkLabel: '<15%',
    thresholds: { warning: 15, danger: 20 },
    invertColors: true,
    tooltip: 'Gastos operativos (sin nómina) sobre ventas. Benchmark: <15%',
  },
]
