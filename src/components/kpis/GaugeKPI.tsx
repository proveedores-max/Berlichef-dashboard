import { useEffect, useState } from 'react'
import { getGaugeColor } from '@/utils/gaugeColors'
import type { GaugeThresholds } from '@/config/gaugeConfig'

const CX = 100
const CY = 95
const R  = 72

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

// Convert a pct (0–1) position along the semicircle to SVG coordinates.
// alpha=π → left end (pct=0), alpha=0 → right end (pct=1)
function arcPoint(pct: number): [number, number] {
  const alpha = Math.PI * (1 - pct)
  return [CX + R * Math.cos(alpha), CY - R * Math.sin(alpha)]
}

interface ZoneDef { from: number; to: number; color: string }

function buildZones(thresholds: GaugeThresholds, invertColors: boolean, min: number, max: number): ZoneDef[] {
  if (!invertColors) {
    return [
      { from: min,                  to: thresholds.warning!,  color: '#FF4757' },
      { from: thresholds.warning!,  to: thresholds.good!,     color: '#FFB800' },
      { from: thresholds.good!,     to: max,                  color: '#00C48C' },
    ]
  } else {
    return [
      { from: min,                  to: thresholds.warning,   color: '#00C48C' },
      { from: thresholds.warning,   to: thresholds.danger!,   color: '#FFB800' },
      { from: thresholds.danger!,   to: max,                  color: '#FF4757' },
    ]
  }
}

function TrackZones({ thresholds, invertColors, min, max }: {
  thresholds: GaugeThresholds; invertColors: boolean; min: number; max: number
}) {
  const total = max - min
  const zones = buildZones(thresholds, invertColors, min, max)
  return (
    <>
      {zones.map((z, i) => {
        const pctStart = (z.from - min) / total
        const pctEnd   = (z.to   - min) / total
        if (pctEnd <= pctStart) return null
        const [x1, y1] = arcPoint(pctStart)
        const [x2, y2] = arcPoint(pctEnd)
        const large = (pctEnd - pctStart) > 0.5 ? 1 : 0
        return (
          <path
            key={i}
            d={`M ${x1.toFixed(2)},${y1.toFixed(2)} A ${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}`}
            fill="none"
            stroke={z.color}
            strokeOpacity="0.2"
            strokeWidth="13"
            strokeLinecap="butt"
          />
        )
      })}
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

  const clamped = Math.max(min, Math.min(max, isNaN(value) ? 0 : value))
  const color   = getGaugeColor(clamped, thresholds, invertColors)
  const noData  = value === 0

  // Animate from 0 on first render
  const displayPct = mounted ? (clamped - min) / (max - min) : 0

  // Value arc endpoint — use 0.9999 cap to avoid degenerate path when pct=1
  const arcPct          = Math.min(0.9999, displayPct)
  const [endX, endY]    = arcPoint(arcPct)
  const largeArc        = displayPct > 0.5 ? 1 : 0

  // Needle tip follows the arc end
  const realPct         = (clamped - min) / (max - min)
  const [needleX, needleY] = arcPoint(Math.min(0.9999, mounted ? realPct : 0))

  // Delta vs benchmark (parsed from label like ">70%" or "<28%")
  const benchmarkNum = parseFloat(benchmarkLabel.replace(/[^0-9.]/g, ''))
  const delta        = invertColors ? benchmarkNum - clamped : clamped - benchmarkNum
  const deltaGood    = delta >= 0

  return (
    <div className="gauge-card animate-fade-in" title={tooltip}>
      {tooltip && <button className="gauge-help-btn" tabIndex={-1}>?</button>}

      <svg
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', maxWidth: 180, display: 'block', margin: '0 auto' }}
      >
        {/* 1. Gray base track */}
        <path
          d={`M 28,95 A ${R},${R} 0 0,1 172,95`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="13"
          strokeLinecap="butt"
        />

        {/* 2. Multicolor zone track */}
        <TrackZones
          thresholds={thresholds}
          invertColors={invertColors}
          min={min}
          max={max}
        />

        {/* 3. Value arc */}
        {!noData && (
          <path
            d={`M 28,95 A ${R},${R} 0 ${largeArc},1 ${endX.toFixed(2)},${endY.toFixed(2)}`}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
            style={{ transition: 'all 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}

        {/* 4. Range labels */}
        <text x="16" y="108" textAnchor="middle"
          fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="500" fill="#94A3B8">
          {min}%
        </text>
        <text x="184" y="108" textAnchor="middle"
          fontFamily="'DM Sans',sans-serif" fontSize="9" fontWeight="500" fill="#94A3B8">
          {max}%
        </text>

        {/* 5. Needle */}
        <line
          x1={CX} y1={CY}
          x2={needleX.toFixed(2)} y2={needleY.toFixed(2)}
          stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'x2 1s cubic-bezier(0.34,1.56,0.64,1), y2 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        <circle cx={CX} cy={CY} r="5.5" fill="#1E293B" />
        <circle cx={CX} cy={CY} r="3"   fill="#64748B" />

        {/* 6. Value */}
        <text x={CX} y="115" textAnchor="middle"
          fontFamily="'DM Sans',sans-serif"
          fontSize={noData ? 11 : 22} fontWeight="700"
          fill={noData ? '#94A3B8' : color}
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {noData ? 'Sin datos' : `${clamped.toFixed(1)}%`}
        </text>

        {/* 7. Label */}
        <text x={CX} y="128" textAnchor="middle"
          fontFamily="'DM Sans',sans-serif"
          fontSize="8" fontWeight="600" fill="#64748B" letterSpacing="0.8">
          {label.toUpperCase()}
        </text>

        {/* 8. Benchmark */}
        <text x={CX} y="141" textAnchor="middle"
          fontFamily="'DM Sans',sans-serif"
          fontSize="8" fontWeight="400" fill="#94A3B8">
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
