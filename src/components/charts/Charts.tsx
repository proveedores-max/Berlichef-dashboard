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

const PALETTE = ['#1a4dff', '#0ab86e', '#f59e0b', '#e63946', '#8b5cf6', '#06b6d4', '#f97316', '#10b981']

const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #e4e7f0',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
  },
}

interface BerliBarProps {
  data: { name: string; value: number }[]
  currency?: boolean
  color?: string
  height?: number
}

export function BerliBar({ data, currency = true, color = PALETTE[0], height = 280 }: BerliBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717899' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#717899' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [currency ? fmtMXN(Number(value)) : value, 'Valor']}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  )
}

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
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717899' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#717899' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [currency ? fmtMXN(Number(value)) : value, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} maxBarSize={40} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface BerliLineProps {
  data: { name: string; value: number }[]
  currency?: boolean
  color?: string
  height?: number
}

export function BerliLine({ data, currency = true, color = PALETTE[0], height = 280 }: BerliLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717899' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#717899' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (currency ? fmtMXN(v) : String(v))}
          width={80}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [currency ? fmtMXN(Number(value)) : value, 'Valor']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

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
            <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [fmtMXN(Number(value)), 'Total']}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => <span style={{ color: '#505670' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
