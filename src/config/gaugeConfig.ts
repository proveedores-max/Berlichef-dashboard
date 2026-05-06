// Legacy interface kept for gaugeColors.ts backward compatibility
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
  /** Lower boundary separating zone 1 from zone 2 */
  t1:             number
  /** Upper boundary separating zone 2 from zone 3 */
  t2:             number
  /** true = lower is better  → zones left→right: green / yellow / red
   *  false = higher is better → zones left→right: red / yellow / green */
  invertColors:   boolean
  benchmarkLabel: string
  tooltip:        string
}

export const GAUGE_CONFIG: GaugeConfig[] = [
  {
    label: 'Margen Bruto',
    key: 'utilBrutaPct',
    min: 20, max: 90, t1: 40, t2: 65,
    invertColors: false,
    benchmarkLabel: 'restaurantes >65%',
    tooltip: 'Porcentaje de ventas que queda tras el costo de alimentos. Benchmark: >65%',
  },
  {
    label: 'Costo de Venta',
    key: 'foodCostPct',
    min: 0, max: 60, t1: 30, t2: 45,
    invertColors: true,
    benchmarkLabel: 'restaurantes <30%',
    tooltip: 'Costo de ingredientes sobre ventas. Benchmark restaurantes: <30%',
  },
  {
    label: 'Prime Cost',
    key: 'primeCostPct',
    min: 40, max: 100, t1: 60, t2: 75,
    invertColors: true,
    benchmarkLabel: 'restaurantes <60%',
    tooltip: 'Costo de alimentos + nómina sobre ventas. Indicador clave. Benchmark: <60%',
  },
  {
    label: 'Margen EBITDA',
    key: 'ebitdaPct',
    min: -30, max: 30, t1: 0, t2: 12,
    invertColors: false,
    benchmarkLabel: 'restaurantes >12%',
    tooltip: 'Rentabilidad operativa antes de intereses, impuestos y amortizaciones. Benchmark: >12%',
  },
  {
    label: 'Nómina',
    key: 'manoObraPct',
    min: 0, max: 70, t1: 35, t2: 50,
    invertColors: true,
    benchmarkLabel: 'restaurantes <35%',
    tooltip: 'Costo de mano de obra sobre ventas. Benchmark: <35%',
  },
  {
    label: 'Gastos Operativos',
    key: 'gastosOpPct',
    min: 0, max: 50, t1: 20, t2: 35,
    invertColors: true,
    benchmarkLabel: 'restaurantes <20%',
    tooltip: 'Gastos operativos sin nómina sobre ventas. Benchmark: <20%',
  },
]
