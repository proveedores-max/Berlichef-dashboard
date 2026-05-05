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
}

const accentMap = {
  brand: 'text-brand-600',
  positive: 'text-positive',
  negative: 'text-negative',
  neutral: 'text-surface-700',
}

export default function KPICard({
  label,
  value,
  format = 'currency',
  trend,
  accent = 'neutral',
  subtitle,
  compact = false,
}: KPICardProps) {
  const formatted =
    format === 'currency'
      ? fmtMXN(value)
      : format === 'percent'
      ? fmtPct(value)
      : fmtNum(value)

  return (
    <div className="kpi-card animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">{label}</p>
      <p className={`${compact ? 'text-2xl' : 'text-3xl'} font-display font-bold mono ${accentMap[accent]}`}>
        {formatted}
      </p>
      {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-positive' : 'text-negative'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend >= 0 ? '+' : ''}{fmtPct(trend)}</span>
        </div>
      )}
    </div>
  )
}
