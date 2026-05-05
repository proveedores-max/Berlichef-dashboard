import { useEffect, useState } from 'react'
import { GAUGE_COLORS } from '@/utils/gaugeColors'
import type { GaugeThresholds } from '@/config/gaugeConfig'

// SVG geometry
const CX  = 100
const CY  = 110
const R   = 75
const SW  = 14
const ARC_LEN = Math.PI * R            // ≈ 235.6
const ARC_D   = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

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

function getColor(value: number, t: GaugeThresholds, inv: boolean): string {
  if (!inv) {
    if (value >= t.good)    return GAUGE_COLORS.green
    if (value >= t.warning) return GAUGE_COLORS.yellow
    return GAUGE_COLORS.red
  } else {
    if (value <= t.warning) return GAUGE_COLORS.green
    if (value <= t.danger)  return GAUGE_COLORS.yellow
    return GAUGE_COLORS.red
  }
}

interface Segment { startFrac: number; endFrac: number; color: string }

function buildZones(t: GaugeThresholds, inv: boolean, max: number): Segment[] {
  if (!inv) {
    return [
      { startFrac: 0,                endFrac: t.warning / max, color: GAUGE_COLORS.red    },
      { startFrac: t.warning / max,  endFrac: t.good / max,    color: GAUGE_COLORS.yellow },
      { startFrac: t.good / max,     endFrac: 1,               color: GAUGE_COLORS.green  },
    ]
  } else {
    return [
      { startFrac: 0,               endFrac: t.warning / max, color: GAUGE_COLORS.green  },
      { startFrac: t.warning / max, endFrac: t.danger / max,  color: GAUGE_COLORS.yellow },
      { startFrac: t.danger / max,  endFrac: 1,               color: GAUGE_COLORS.red    },
    ]
  }
}

function ZoneArc({ startFrac, endFrac, color }: Segment) {
  const segLen  = (endFrac - startFrac) * ARC_LEN
  const startAt = startFrac * ARC_LEN
  if (segLen <= 0) return null
  return (
    <path
      d={ARC_D}
      fill="none"
      stroke={color}
      strokeWidth={SW}
      strokeLinecap="butt"
      strokeDasharray={`${segLen} ${ARC_LEN * 2}`}
      strokeDashoffset={-startAt}
      opacity={0.28}
    />
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
  const color    = getColor(clamped, thresholds, invertColors)
  const zones    = buildZones(thresholds, invertColors, max)

  // Value arc animation
  const dashOffset = mounted ? ARC_LEN * (1 - fraction) : ARC_LEN

  // Needle: -90° = far left, +90° = far right
  const needleAngle = fraction * 180 - 90

  // Delta vs benchmark
  const benchmarkNum = invertColors ? thresholds.warning : thresholds.good
  const delta        = invertColors ? benchmarkNum - clamped : clamped - benchmarkNum
  const deltaGood    = delta >= 0
  const noData       = !isNaN(value) && value === 0

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 12px 10px',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
      title={tooltip}
    >
      {/* Tooltip hint */}
      {tooltip && (
        <div style={{
          position: 'absolute', top: 8, right: 10,
          width: 15, height: 15, borderRadius: '50%',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: 'var(--color-text-muted)',
          cursor: 'help', fontWeight: 700,
        }}>?</div>
      )}

      <svg viewBox="0 0 200 125" style={{ width: '100%', maxWidth: 200, display: 'block', overflow: 'visible' }}>
        {/* 1. Gray base track */}
        <path
          d={ARC_D}
          fill="none"
          stroke={GAUGE_COLORS.track}
          strokeWidth={SW}
          strokeLinecap="butt"
        />

        {/* 2. Multicolor zone segments */}
        {zones.map((z, i) => <ZoneArc key={i} {...z} />)}

        {/* 3. Active value arc */}
        <path
          d={ARC_D}
          fill="none"
          stroke={color}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* 4. Needle group — rotates from left (-90°) to value angle */}
        <g style={{
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${mounted ? needleAngle : -90}deg)`,
          transition: mounted ? 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}>
          {/* Needle body (pointing up toward arc) */}
          <line
            x1={CX} y1={CY}
            x2={CX} y2={CY - R + 6}
            stroke={GAUGE_COLORS.needle}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Counterweight (pointing down) */}
          <line
            x1={CX} y1={CY}
            x2={CX} y2={CY + 10}
            stroke={GAUGE_COLORS.needle}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Center hub outer */}
          <circle cx={CX} cy={CY} r={7}  fill={GAUGE_COLORS.needle} />
          {/* Center hub inner */}
          <circle cx={CX} cy={CY} r={4}  fill={GAUGE_COLORS.needleCenter} />
        </g>

        {/* 5. Range labels at arc ends */}
        <text x={CX - R + 2} y={CY + 14} fontSize={8.5} fill="#94A3B8" textAnchor="middle"
          fontFamily="'DM Sans', sans-serif">
          {min}%
        </text>
        <text x={CX + R - 2} y={CY + 14} fontSize={8.5} fill="#94A3B8" textAnchor="middle"
          fontFamily="'DM Sans', sans-serif">
          {max}%
        </text>

        {/* 6. Value (large) */}
        <text
          x={CX} y={noData ? 88 : 84}
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize={noData ? 12 : 24}
          fontWeight={700}
          fill={noData ? '#94A3B8' : color}
          letterSpacing="-0.5"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {noData ? 'Sin datos' : `${clamped.toFixed(1)}%`}
        </text>

        {/* 7. Label */}
        <text x={CX} y={97} textAnchor="middle"
          fontFamily="'DM Sans', sans-serif" fontSize={8} fontWeight={600}
          fill="#64748B" letterSpacing="1">
          {label}
        </text>

        {/* 8. Benchmark reference */}
        <text x={CX} y={108} textAnchor="middle"
          fontFamily="'DM Sans', sans-serif" fontSize={7.5} fontWeight={400}
          fill="#94A3B8">
          Ref: {benchmarkLabel}
        </text>
      </svg>

      {/* Delta badge below gauge */}
      {!noData && (
        <div style={{
          marginTop: 2,
          fontSize: 11,
          fontWeight: 500,
          color: deltaGood ? GAUGE_COLORS.green : GAUGE_COLORS.red,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <span>{deltaGood ? '▲' : '▼'}</span>
          <span>{Math.abs(delta).toFixed(1)}pp {deltaGood ? 'sobre' : 'bajo'} objetivo</span>
        </div>
      )}
    </div>
  )
}
