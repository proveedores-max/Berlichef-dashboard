import { useEffect, useState } from 'react'
import { GAUGE_COLORS, getGaugeColor } from '@/utils/gaugeColors'
import type { GaugeThresholds } from '@/config/gaugeConfig'

const CX = 100
const CY = 95
const R  = 72
const SW = 14
const CIRC = Math.PI * R  // ≈ 226.2 — semicircle arc length

interface GaugeKPIProps {
  label:          string
  value:          number
  min?:           number
  max?:           number
  thresholds:     GaugeThresholds
  invertColors?:  boolean
  benchmarkLabel: string
  tooltip?:       string
}

interface ZoneProps {
  color: string
  from: number
  to: number
  total: number
}

function ZoneArc({ color, from, to, total }: ZoneProps) {
  const zoneLen   = ((to - from) / total) * CIRC
  const zoneStart = (from / total) * CIRC
  if (zoneLen <= 0) return null
  return (
    <circle
      cx={CX} cy={CY} r={R}
      fill="none"
      stroke={color}
      strokeOpacity="0.25"
      strokeWidth={SW}
      strokeDasharray={`${zoneLen} ${CIRC - zoneLen}`}
      strokeDashoffset={-zoneStart}
      transform={`rotate(-180, ${CX}, ${CY})`}
    />
  )
}

function TrackZones({ thresholds, invertColors, min, max }: {
  thresholds: GaugeThresholds; invertColors: boolean; min: number; max: number
}) {
  const total = max - min
  const zones = invertColors
    ? [
        { color: GAUGE_COLORS.green,  from: 0,                        to: thresholds.warning - min },
        { color: GAUGE_COLORS.yellow, from: thresholds.warning - min, to: thresholds.danger - min  },
        { color: GAUGE_COLORS.red,    from: thresholds.danger - min,  to: total                    },
      ]
    : [
        { color: GAUGE_COLORS.red,    from: 0,                         to: thresholds.warning - min },
        { color: GAUGE_COLORS.yellow, from: thresholds.warning - min,  to: thresholds.good - min   },
        { color: GAUGE_COLORS.green,  from: thresholds.good - min,     to: total                   },
      ]
  return (
    <>
      {zones.map((z, i) => (
        <ZoneArc key={i} color={z.color} from={z.from} to={z.to} total={total} />
      ))}
    </>
  )
}

export default function GaugeKPI({
  label,
  value,
  min = 0,
  max = 100,
  thresholds,
  invertColors = false,
  benchmarkLabel,
  tooltip,
}: GaugeKPIProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const clamped  = Math.max(min, Math.min(max, isNaN(value) ? 0 : value))
  const fraction = (clamped - min) / (max - min)
  const color    = getGaugeColor(clamped, thresholds, invertColors)
  const noData   = value === 0

  // Value arc: strokeDashoffset 0 = full arc, CIRC = empty
  const valueOffset = mounted ? CIRC * (1 - fraction) : CIRC

  // Needle angle: -90° = left end, +90° = right end
  const needleAngle = fraction * 180 - 90
  const needleRad   = (needleAngle * Math.PI) / 180
  const tipX = CX + (R - 10) * Math.sin(needleRad)
  const tipY = CY - (R - 10) * Math.cos(needleRad)

  // Delta vs benchmark
  const benchmarkNum = invertColors ? thresholds.warning : thresholds.good
  const delta        = invertColors ? benchmarkNum - clamped : clamped - benchmarkNum
  const deltaGood    = delta >= 0

  return (
    <div
      className="gauge-card animate-fade-in"
      title={tooltip}
    >
      {tooltip && (
        <button className="gauge-help-btn" tabIndex={-1}>?</button>
      )}

      <svg
        viewBox="0 0 200 145"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', overflow: 'visible' }}
      >
        {/* 1. Gray base track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={SW}
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={0}
          transform={`rotate(-180, ${CX}, ${CY})`}
        />

        {/* 2. Multicolor zone track */}
        <TrackZones
          thresholds={thresholds}
          invertColors={invertColors}
          min={min}
          max={max}
        />

        {/* 3. Active value arc */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={color}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={valueOffset}
          transform={`rotate(-180, ${CX}, ${CY})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* 4. Range labels at arc ends */}
        <text x="22" y="104"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize="9" fontWeight="500" fill="#94A3B8"
        >{min}%</text>
        <text x="178" y="104"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize="9" fontWeight="500" fill="#94A3B8"
        >{max}%</text>

        {/* 5. Needle line */}
        <line
          x1={CX} y1={CY}
          x2={mounted ? tipX : CX - (R - 10)}
          y2={mounted ? tipY : CY}
          stroke="#1E293B"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'x2 1s cubic-bezier(0.34,1.56,0.64,1), y2 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />

        {/* 6. Needle hub */}
        <circle cx={CX} cy={CY} r={5}   fill="#1E293B" />
        <circle cx={CX} cy={CY} r={2.5} fill="#64748B" />

        {/* 7. Value */}
        <text
          x={CX} y="113"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize={noData ? 12 : 24}
          fontWeight="700"
          fill={noData ? '#94A3B8' : color}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {noData ? 'Sin datos' : `${clamped.toFixed(1)}%`}
        </text>

        {/* 8. Label */}
        <text
          x={CX} y="126"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize="8.5" fontWeight="600" fill="#64748B" letterSpacing="1"
        >
          {label.toUpperCase()}
        </text>

        {/* 9. Benchmark reference */}
        <text
          x={CX} y="138"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize="8" fontWeight="400" fill="#94A3B8"
        >
          Ref: {benchmarkLabel}
        </text>
      </svg>

      {/* Delta badge */}
      {!noData && (
        <div className={`gauge-delta ${deltaGood ? 'positive' : 'negative'}`}>
          {deltaGood ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}pp {deltaGood ? 'sobre' : 'bajo'} objetivo
        </div>
      )}
    </div>
  )
}
