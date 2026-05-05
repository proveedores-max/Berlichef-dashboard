import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import { fmtMXN } from '@/lib/formatters'
import { CHART_PALETTE, CHART_GRADIENT_START, CHART_GRADIENT_END } from '@/utils/chartColors'

const tooltipStyle = {
  contentStyle: {
    background: '#0F172A',
    border: 'none',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.24)',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    padding: '10px 14px',
  },
  labelStyle: { color: '#94A3B8', marginBottom: 4, fontWeight: 500 },
  itemStyle:  { color: '#FFFFFF' },
  cursor:     { fill: 'rgba(255,255,255,0.04)' },
}

function fmtTooltip(value: number, currency: boolean) {
  return currency
    ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value.toLocaleString('es-MX')
}

// ── BerliBar ─────────────────────────────────────────────────────────────────

interface BerliBarProps {
  data: { name: string; value: number }[]
  currency?: boolean
  color?: string
  height?: number
  gradient?: boolean
}

export function BerliBar({
  data,
  currency = true,
  color,
  height = 280,
  gradient = true,
}: BerliBarProps) {
  const fillColor = color ?? CHART_PALETTE[0]
  const gradientId = `bar-grad-${fillColor.replace('#', '')}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        {gradient && !color && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={CHART_GRADIENT_START} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_GRADIENT_END}   stopOpacity={0.7} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [fmtTooltip(Number(value), currency), 'Valor']}
        />
        <Bar
          dataKey="value"
          fill={gradient && !color ? `url(#${gradientId})` : fillColor}
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── BerliMultiBar ─────────────────────────────────────────────────────────────

interface BerliMultiBarProps {
  data: Record<string, number | string>[]
  keys: string[]
  currency?: boolean
  height?: number
}

export function BerliMultiBar({ data, keys, currency = true, height = 280 }: BerliMultiBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [fmtTooltip(Number(value), currency), name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#475569' }}
          formatter={(value: string) => <span style={{ color: '#475569' }}>{value}</span>}
        />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_PALETTE[i % CHART_PALETTE.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── BerliLine ─────────────────────────────────────────────────────────────────

interface BerliLineProps {
  data: { name: string; value: number }[]
  currency?: boolean
  color?: string
  height?: number
}

export function BerliLine({
  data,
  currency = true,
  color = CHART_PALETTE[0],
  height = 280,
}: BerliLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [fmtTooltip(Number(value), currency), 'Valor']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── BerliPie ──────────────────────────────────────────────────────────────────

interface BerliPieProps {
  data: { name: string; value: number }[]
  height?: number
}

export function BerliPie({ data, height = 280 }: BerliPieProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="52%"
          outerRadius="72%"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [fmtTooltip(Number(value), true), 'Total']}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => <span style={{ color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
