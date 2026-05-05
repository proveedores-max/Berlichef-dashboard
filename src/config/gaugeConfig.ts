export interface GaugeThresholds {
  danger:  number
  warning: number
  good:    number
}

export interface GaugeConfig {
  label:          string
  key:            'margenBruto' | 'foodCost' | 'primeCost' | 'margenEbitda' | 'nominaPct' | 'gastosOpPct'
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
    key: 'margenBruto',
    min: 0, max: 100,
    benchmarkLabel: '>70%',
    thresholds: { danger: 0, warning: 60, good: 70 },
    invertColors: false,
    tooltip: 'Porcentaje de ventas que queda después del costo de alimentos. Benchmark restaurantes: >70%',
  },
  {
    label: 'FOOD COST %',
    key: 'foodCost',
    min: 0, max: 60,
    benchmarkLabel: '<28%',
    thresholds: { danger: 35, warning: 28, good: 0 },
    invertColors: true,
    tooltip: 'Porcentaje del costo de ingredientes sobre ventas. Benchmark restaurantes: 20–28%',
  },
  {
    label: 'PRIME COST %',
    key: 'primeCost',
    min: 0, max: 100,
    benchmarkLabel: '<60%',
    thresholds: { danger: 70, warning: 60, good: 0 },
    invertColors: true,
    tooltip: 'Costo de alimentos + nómina sobre ventas. El indicador más importante en restaurantes. Benchmark: <60%',
  },
  {
    label: 'MARGEN EBITDA %',
    key: 'margenEbitda',
    min: 0, max: 40,
    benchmarkLabel: '>18%',
    thresholds: { danger: 0, warning: 10, good: 18 },
    invertColors: false,
    tooltip: 'Rentabilidad operativa antes de impuestos, depreciación y amortización. Benchmark: >18%',
  },
  {
    label: 'NÓMINA %',
    key: 'nominaPct',
    min: 0, max: 60,
    benchmarkLabel: '<32%',
    thresholds: { danger: 40, warning: 32, good: 0 },
    invertColors: true,
    tooltip: 'Costo de mano de obra sobre ventas. Benchmark restaurantes: 28–32%',
  },
  {
    label: 'GASTOS OP. %',
    key: 'gastosOpPct',
    min: 0, max: 40,
    benchmarkLabel: '<15%',
    thresholds: { danger: 20, warning: 15, good: 0 },
    invertColors: true,
    tooltip: 'Gastos operativos (sin nómina) sobre ventas. Benchmark restaurantes: <15%',
  },
]
