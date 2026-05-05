import { RefreshCw, AlertCircle } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { loading, error, data, fetchData } = useDataStore()

  return (
    <div className="page-header">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-subtitle" style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>

      <div className="page-header-actions">
        {error && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #FECACA' }}
          >
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        {data && !error && (
          <span className="update-timestamp">
            Actualizado: {new Date(data.lastUpdated).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        )}

        <button onClick={() => fetchData()} disabled={loading} className="btn-refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  )
}
