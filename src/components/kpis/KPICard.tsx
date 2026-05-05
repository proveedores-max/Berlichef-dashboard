import { TrendingUp, TrendingDown } from 'lucide-react'
import { fmtMXN, fmtPct, fmtNum } from '@/lib/formatters'

interface KPICardProps {
  label: string
  value: number
  format?: 'currency' | 'percent' | 'number'
  trend?: number
  accent?: 'brand' | 'positive' | 'negative' | 'neutral'
  subtitle?: string
  compact?: boolean
  icon?: React.ReactNode
}

const accentColor: Record<string, string> = {
  brand:    'var(--color-primary)',
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral:  'var(--color-text-primary)',
}

export default function KPICard({
  label,
  value,
  format = 'currency',
  trend,
  accent = 'neutral',
  subtitle,
  compact = false,
  icon,
}: KPICardProps) {
  const formatted =
    format === 'currency' ? fmtMXN(value)
    : format === 'percent' ? fmtPct(value)
    : fmtNum(value)

  return (
    <div className="kpi-card animate-fade-in">
      <div className="kpi-card-header">
        <span className="label-kpi">{label}</span>
        {icon && <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>}
      </div>
      <p
        className="text-kpi"
        style={{
          fontSize: compact ? '1.5rem' : '2rem',
          color: accentColor[accent],
        }}
      >
        {formatted}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{subtitle}</p>
      )}
      {trend !== undefined && (
        <div className={`kpi-delta ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>{trend >= 0 ? '+' : ''}{fmtPct(trend)}</span>
        </div>
      )}
    </div>
  )
}
