import { useEffect, useState } from 'react'

interface Thresholds {
  green: [number, number]
  yellow: [number, number]
  red: [number, number]
}

interface GaugeKPIProps {
  label: string
  value: number
  min?: number
  max?: number
  thresholds: Thresholds
  invertColors?: boolean
  unit?: string
  tooltip?: string
  benchmark?: number
}

const CX = 100
const CY = 105
const R = 80
const SW = 16
const ARC_LEN = Math.PI * R // ≈ 251.33
const ARC_D = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

function getColor(value: number, thresholds: Thresholds, invertColors: boolean): string {
  if (!invertColors) {
    if (value >= thresholds.green[0]) return 'var(--gauge-good)'
    if (value >= thresholds.yellow[0]) return 'var(--gauge-warning)'
    return 'var(--gauge-danger)'
  } else {
    if (value <= thresholds.green[1]) return 'var(--gauge-good)'
    if (value <= thresholds.yellow[1]) return 'var(--gauge-warning)'
    return 'var(--gauge-danger)'
  }
}

interface ZoneSegmentProps {
  startFrac: number
  endFrac: number
  color: string
}

function ZoneSegment({ startFrac, endFrac, color }: ZoneSegmentProps) {
  const startLen = startFrac * ARC_LEN
  const segLen = (endFrac - startFrac) * ARC_LEN
  if (segLen <= 0) return null
  return (
    <path
      d={ARC_D}
      fill="none"
      stroke={color}
      strokeWidth={SW}
      strokeLinecap="butt"
      strokeDasharray={`${segLen} ${ARC_LEN * 2}`}
      strokeDashoffset={-startLen}
      opacity={0.22}
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
  unit = '%',
  tooltip,
  benchmark,
}: GaugeKPIProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const clamped = Math.max(min, Math.min(max, isNaN(value) ? 0 : value))
  const fraction = (clamped - min) / (max - min)
  const color = getColor(clamped, thresholds, invertColors)

  // Dashoffset animation: ARC_LEN = empty, 0 = full
  const dashOffset = mounted ? ARC_LEN * (1 - fraction) : ARC_LEN

  // Zone segments (background hints)
  const zones: ZoneSegmentProps[] = !invertColors
    ? [
        { startFrac: 0,                              endFrac: thresholds.red[1] / max,    color: 'var(--gauge-danger)'  },
        { startFrac: thresholds.red[1] / max,        endFrac: thresholds.yellow[1] / max, color: 'var(--gauge-warning)' },
        { startFrac: thresholds.yellow[1] / max,     endFrac: 1,                          color: 'var(--gauge-good)'    },
      ]
    : [
        { startFrac: 0,                              endFrac: thresholds.green[1] / max,  color: 'var(--gauge-good)'    },
        { startFrac: thresholds.green[1] / max,      endFrac: thresholds.yellow[1] / max, color: 'var(--gauge-warning)' },
        { startFrac: thresholds.yellow[1] / max,     endFrac: 1,                          color: 'var(--gauge-danger)'  },
      ]

  // Delta vs benchmark
  const delta = benchmark !== undefined ? clamped - benchmark : undefined
  const deltaGood = delta !== undefined
    ? (!invertColors ? delta >= 0 : delta <= 0)
    : false
  const deltaColor = deltaGood ? 'var(--color-success)' : 'var(--color-danger)'
  const deltaSymbol = deltaGood ? '▲' : '▼'
  const deltaLabel = deltaGood ? 'sobre objetivo' : 'bajo objetivo'

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 16px 14px',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
      title={tooltip}
    >
      {/* Tooltip icon */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            cursor: 'help',
            fontWeight: 600,
          }}
        >
          ?
        </div>
      )}

      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 200, display: 'block' }}>
        {/* Gray track */}
        <path
          d={ARC_D}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={SW}
          strokeLinecap="round"
        />

        {/* Zone background hints */}
        {zones.map((z, i) => (
          <ZoneSegment key={i} {...z} />
        ))}

        {/* Value arc */}
        <path
          d={ARC_D}
          fill="none"
          stroke={color}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Value text */}
        <text
          x={CX}
          y={92}
          textAnchor="middle"
          fontFamily="Syne, sans-serif"
          fontSize={26}
          fontWeight={700}
          fill={color}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {clamped.toFixed(1)}{unit}
        </text>

        {/* Label */}
        <text
          x={CX}
          y={113}
          textAnchor="middle"
          fontFamily="DM Sans, sans-serif"
          fontSize={9.5}
          fontWeight={600}
          fill="var(--color-text-muted)"
          style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          {label}
        </text>
      </svg>

      {/* Delta badge */}
      {delta !== undefined && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            fontWeight: 500,
            color: deltaColor,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span>{deltaSymbol}</span>
          <span>{Math.abs(delta).toFixed(1)}pp {deltaLabel}</span>
        </div>
      )}

      {/* No data state */}
      {isNaN(value) || value === 0 && benchmark === undefined && (
        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Sin ventas capturadas
        </p>
      )}
    </div>
  )
}
