import type { GaugeThresholds } from '@/config/gaugeConfig'

export const GAUGE_COLORS = {
  green:  '#00C48C',
  yellow: '#FFB800',
  red:    '#FF4757',
}

export function getGaugeColor(value: number, thresholds: GaugeThresholds, invertColors: boolean): string {
  if (invertColors) {
    if (value <= thresholds.warning) return GAUGE_COLORS.green
    if (value <= thresholds.danger)  return GAUGE_COLORS.yellow
    return GAUGE_COLORS.red
  } else {
    if (value >= thresholds.good)    return GAUGE_COLORS.green
    if (value >= thresholds.warning) return GAUGE_COLORS.yellow
    return GAUGE_COLORS.red
  }
}
