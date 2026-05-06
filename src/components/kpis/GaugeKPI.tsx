import { useEffect, useState } from 'react'
import { GAUGE_COLORS } from '@/utils/gaugeColors'

/* ─── Gauge geometry ─── */
const CX = 100
const CY = 100
const R  = 75

/** Maps a 0–1 fraction along the semicircle to SVG [x, y].
 *  pct=0 → left end (min), pct=0.5 → top (mid), pct=1 → right end (max)
 */
function arcPoint(pct: number): [number, number] {
  const alpha = Math.PI * (1 - pct)
  return [CX + R * Math.cos(alpha), CY - R * Math.sin(alpha)]
}

/* ─── Props ─── */
interface GaugeKPIProps {
  label:          string
  value:          number
  min:            number
  max:            number
  /** Lower boundary: separates zone 1 from zone 2 */
  t1:             number
  /** Upper boundary: separates zone 2 from zone 3 */
  t2:             number
  /** true = lower is better  → zone order: green / yellow / red (left → right)
   *  false = higher is better → zone order: red / yellow / green */
  invertColors:   boolean
  benchmarkLabel: string
  tooltip?:       string
}

/* ─── Zone arc ─── */
function ZoneArc({ pct0, pct1, color }: { pct0: number; pct1: number; color: string }) {
  const p0 = Math.max(0.0001, Math.min(0.9999, pct0))
  const p1 = Math.max(0.0001, Math.min(0.9999, pct1))
  if (p1 <= p0) return null
  const [x1, y1] = arcPoint(p0)
  const [x2, y2] = arcPoint(p1)
  return (
    <path
      d={`M ${x1.toFixed(2)},${y1.toFixed(2)} A ${R},${R} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)}`}
      fill="none"
      stroke={color}
      strokeWidth={12}
      strokeLinecap="butt"
    />
  )
}

/* ─── Zone / status helpers ─── */
const { green: GREEN, yellow: YELLOW, red: RED } = GAUGE_COLORS

function getZoneColor(val: number, t1: number, t2: number, invertColors: boolean): string {
  if (invertColors) {
    if (val <= t1) return GREEN
    if (val <= t2) return YELLOW
    return RED
  } else {
    if (val < t1) return RED
    if (val < t2) return YELLOW
    return GREEN
  }
}

function getStatus(
  val: number, t1: number, t2: number, invertColors: boolean,
): { label: string; color: string } {
  const color = getZoneColor(val, t1, t2, invertColors)
  if (color === GREEN)  return { label: 'Excelente', color: GREEN }
  if (color === YELLOW) return { label: 'Bueno',     color: YELLOW }
  // Red zone — "Regular" if close to the yellow boundary, "Crítico" if far
  const yellowSpan    = t2 - t1
  const redBoundary   = invertColors ? t2 : t1
  const distToYellow  = Math.abs(val - redBoundary)
  return distToYellow <= yellowSpan * 0.6
    ? { label: 'Regular', color: RED }
    : { label: 'Crítico', color: RED }
}

/* ─── Component ─── */
export default function GaugeKPI({
  label, value, min, max, t1, t2, invertColors, benchmarkLabel, tooltip,
}: GaugeKPIProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 40)
    return () => clearTimeout(id)
  }, [])

  const total   = max - min
  const clamped = Math.max(min, Math.min(max, isNaN(value) ? min : value))

  // "No data" only when value is literally 0 and the gauge doesn't include 0 as a valid range value
  const noData = value === 0 && min > 0

  /* Threshold fractions along the arc */
  const pct1 = (t1 - min) / total
  const pct2 = (t2 - min) / total

  /* Zone colors: zone1=min→t1, zone2=t1→t2, zone3=t2→max */
  const [c1, c2, c3]: [string, string, string] = invertColors
    ? [GREEN,  YELLOW, RED]
    : [RED,    YELLOW, GREEN]

  /* Needle animation: starts at leftmost on first render */
  const valPct          = (clamped - min) / total
  const animPct         = mounted ? Math.min(0.9999, valPct) : 0.0001
  const [nx, ny]        = arcPoint(animPct)

  const zoneColor = getZoneColor(clamped, t1, t2, invertColors)
  const status    = getStatus(clamped, t1, t2, invertColors)

  /* Min / max label positions */
  const [lx, ly] = arcPoint(0.0001)   // left (min)
  const [rx, ry] = arcPoint(0.9999)   // right (max)

  const minLabel = `${min}%`
  const maxLabel = `${max}%`

  return (
    <div
      style={{
        width: 175,
        flexShrink: 0,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 8px 14px',
        cursor: tooltip ? 'help' : 'default',
      }}
      title={tooltip}
    >
      {/* ── SVG semicircle ── */}
      <svg
        viewBox="0 0 200 115"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* 1. Gray base track */}
        <path
          d={`M 25,100 A ${R},${R} 0 0,1 175,100`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={12}
          strokeLinecap="butt"
        />

        {/* 2. Zone arcs (colour bands) */}
        <ZoneArc pct0={0}    pct1={pct1} color={c1} />
        <ZoneArc pct0={pct1} pct1={pct2} color={c2} />
        <ZoneArc pct0={pct2} pct1={1}    color={c3} />

        {/* 3. Min / max labels just below the arc ends */}
        <text
          x={lx - 3} y={ly + 14}
          textAnchor="middle"
          fontFamily="'DM Sans',sans-serif"
          fontSize="8" fontWeight="500" fill="#B0BBCB"
        >
          {minLabel}
        </text>
        <text
          x={rx + 3} y={ry + 14}
          textAnchor="middle"
          fontFamily="'DM Sans',sans-serif"
          fontSize="8" fontWeight="500" fill="#B0BBCB"
        >
          {maxLabel}
        </text>

        {/* 4. Needle */}
        <line
          x1={CX} y1={CY}
          x2={nx.toFixed(2)} y2={ny.toFixed(2)}
          stroke="#1E293B"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transition: mounted
              ? 'x2 1s cubic-bezier(0.34,1.56,0.64,1), y2 1s cubic-bezier(0.34,1.56,0.64,1)'
              : 'none',
          }}
        />

        {/* 5. Pivot dot */}
        <circle cx={CX} cy={CY} r="5.5" fill="#1E293B" />
        <circle cx={CX} cy={CY} r="2.5" fill="#FFFFFF" />
      </svg>

      {/* ── Label ── */}
      <p style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#94A3B8',
        marginTop: 4,
        marginBottom: 4,
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {label}
      </p>

      {/* ── Value ── */}
      <p style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: noData ? 14 : 22,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        color: noData ? '#CBD5E1' : zoneColor,
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {noData ? 'Sin datos' : `${clamped.toFixed(1)}%`}
      </p>

      {/* ── Status badge ── */}
      {!noData && (
        <span style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 20,
          background: `${status.color}1A`,
          color: status.color,
          marginBottom: 5,
          whiteSpace: 'nowrap',
        }}>
          {status.label}
        </span>
      )}

      {/* ── Benchmark reference ── */}
      <p style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 9.5,
        fontWeight: 400,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 1.3,
        marginTop: noData ? 0 : 0,
      }}>
        Ref: {benchmarkLabel}
      </p>
    </div>
  )
}
