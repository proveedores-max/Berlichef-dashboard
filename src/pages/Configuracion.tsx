import Header from '@/components/layout/Header'
import { CheckCircle } from 'lucide-react'

const SHEET_ID = '14cre1M0kuiEASpBeDqln5a8gC-mgeC7ewE7KqqRUorA'

const sheets = [
  { name: 'Costo de Venta', desc: 'Transacciones detalladas de costo de venta por producto' },
  { name: 'Ventas', desc: 'Ventas netas por mes y unidad de negocio' },
  { name: 'Gastos Operativos', desc: 'Gastos operativos, nómina y costos de estructura' },
  { name: 'BDD Precios', desc: 'Catálogo de productos con precios unitarios (+500 items)' },
  { name: 'Resumen', desc: 'Vista ejecutiva pre-calculada (referencia)' },
]

export default function Configuracion() {
  return (
    <div className="animate-fade-in">
      <Header title="Configuración" subtitle="Parámetros de conexión y despliegue" />

      <div className="max-w-2xl space-y-4">
        {/* Data source */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-surface-800 mb-4">Fuente de datos</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Google Sheet ID</label>
              <input
                type="text"
                readOnly
                value={SHEET_ID}
                className="input-base mono bg-surface-50 cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">API Key</label>
              <input
                type="text"
                readOnly
                value="••••••••••••••••••••••••••••••"
                className="input-base mono bg-surface-50 cursor-default"
              />
              <p className="text-xs text-surface-400 mt-1">
                Configurar en variables de entorno Netlify: <code className="font-mono text-brand-600">GOOGLE_API_KEY</code>
              </p>
            </div>
          </div>
        </div>

        {/* Sheets */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-surface-800 mb-4">Hojas del spreadsheet</h2>
          <div className="space-y-2.5">
            {sheets.map((s) => (
              <div key={s.name} className="flex items-start gap-3">
                <CheckCircle size={15} className="text-positive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-surface-800">{s.name}</p>
                  <p className="text-xs text-surface-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deploy instructions */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-surface-800 mb-4">Deploy en Netlify</h2>
          <ol className="space-y-3 text-sm text-surface-600">
            <li className="flex gap-2">
              <span className="font-bold text-brand-600 w-5 flex-shrink-0">1.</span>
              <span>Crea un nuevo sitio en Netlify desde tu repositorio Git</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600 w-5 flex-shrink-0">2.</span>
              <span>
                En <em>Site settings → Environment variables</em>, agrega:
                <br />
                <code className="block mt-1 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-mono text-xs">
                  GOOGLE_API_KEY = tu_api_key_aquí<br />
                  GOOGLE_SHEET_ID = {SHEET_ID}
                </code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600 w-5 flex-shrink-0">3.</span>
              <span>
                Comando de build: <code className="font-mono bg-surface-50 px-1.5 py-0.5 rounded border border-surface-200 text-xs">npm run build</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600 w-5 flex-shrink-0">4.</span>
              <span>
                Directorio de publicación: <code className="font-mono bg-surface-50 px-1.5 py-0.5 rounded border border-surface-200 text-xs">dist</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600 w-5 flex-shrink-0">5.</span>
              <span>Netlify detectará automáticamente las Functions en <code className="font-mono bg-surface-50 px-1.5 py-0.5 rounded border border-surface-200 text-xs">netlify/functions/</code></span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
