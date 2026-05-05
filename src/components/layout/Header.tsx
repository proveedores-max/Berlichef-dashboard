import { RefreshCw, AlertCircle } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { loading, error, data, fetchData } = useDataStore()

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {error && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-negative text-xs font-medium">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        {data && !error && (
          <span className="text-xs text-surface-400">
            Actualizado: {new Date(data.lastUpdated).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        )}

        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  )
}
