'use client'
import { useEffect, useState } from 'react'

interface ReportData {
  from: string; to: string
  totalIncome: number; totalExpenses: number; balance: number
  byService: Record<string, { total: number; count: number }>
  byCategory: Record<string, number>
  income: { id: string; invoice_date: string; invoice_number: string; service_type: string; description: string | null; amount: number; payment_status: string; accounting_clients: { name: string } | null }[]
  expenses: { id: string; expense_date: string; category: string; description: string; amount: number; expense_type: string }[]
}

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]
const SERVICE_LABELS: Record<string, string> = { llc: 'LLC', corp: 'Corp', ein: 'EIN', itin: 'ITIN', addon: 'Add-on', new_business_letter: 'New Biz Letter', other: 'Otro' }
const CATEGORY_LABELS: Record<string, string> = { marketing: 'Marketing', software: 'Software', office: 'Oficina', state_fees: 'Fees del Estado', payroll: 'Nómina', taxes: 'Impuestos', other: 'Otro' }
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
const today = () => new Date().toISOString().split('T')[0]

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
.page { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.top-bar h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.breadcrumb { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.breadcrumb a { color: #2563eb; text-decoration: none; }
.nav-tabs { display: flex; gap: 4px; background: #e5e7eb; border-radius: 10px; padding: 4px; margin-bottom: 28px; overflow-x: auto; }
.nav-tab { flex: 1; white-space: nowrap; text-align: center; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; }
.nav-tab.active { background: #fff; color: #1a1a2e; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.date-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: #fff; padding: 16px 20px; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); margin-bottom: 24px; }
.date-bar label { font-size: 12px; font-weight: 600; color: #6b7280; }
.date-bar input[type=date] { padding: 7px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; outline: none; font-family: inherit; }
.date-bar input[type=date]:focus { border-color: #2563eb; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-outline { background: transparent; border: 1.5px solid #2563eb; color: #2563eb; }
.btn-outline:hover { background: #eff6ff; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 10px; padding: 18px 22px; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
.stat-card .label { font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.stat-card .value { font-size: 26px; font-weight: 700; margin-top: 6px; }
.value.green { color: #059669; }
.value.red { color: #dc2626; }
.value.blue { color: #2563eb; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
.card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; }
.card-header h2 { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; border-bottom: 1px solid #f9fafb; font-size: 13px; }
.breakdown-row:last-child { border-bottom: none; }
.breakdown-label { color: #374151; }
.breakdown-bar { flex: 1; height: 6px; background: #f3f4f6; border-radius: 3px; margin: 0 12px; overflow: hidden; }
.breakdown-fill { height: 100%; border-radius: 3px; }
.fill-green { background: #10b981; }
.fill-red { background: #ef4444; }
.breakdown-amount { font-weight: 700; color: #1a1a2e; min-width: 70px; text-align: right; }
.breakdown-count { font-size: 11px; color: #9ca3af; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
td { padding: 10px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
.empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-blue { background: #dbeafe; color: #1e40af; }
@media (max-width: 768px) { .page { padding: 16px 12px; } .cols { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: 1fr 1fr; } }
`

export default function ReportesPage() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/contabilidad/reportes?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleExportCSV = async () => {
    setExporting(true)
    const res = await fetch(`/api/contabilidad/reportes?from=${from}&to=${to}&format=csv`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${from}-al-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const maxService = data ? Math.max(...Object.values(data.byService).map(v => v.total), 1) : 1
  const maxCategory = data ? Math.max(...Object.values(data.byCategory), 1) : 1

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>← Admin</a>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / Reportes
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad/reportes' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        <div className="date-bar">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label>Desde</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label>Hasta</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={load}>Generar Reporte</button>
          <button className="btn btn-outline" onClick={handleExportCSV} disabled={exporting || !data} style={{ marginLeft: 'auto' }}>
            {exporting ? 'Exportando...' : '↓ Exportar CSV'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Generando reporte...</div>
        ) : !data ? (
          <div className="loading">Selecciona un rango de fechas y genera el reporte.</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="label">Ingresos del período</div>
                <div className="value green">{fmt(data.totalIncome)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Gastos del período</div>
                <div className="value red">{fmt(data.totalExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Ganancia neta</div>
                <div className={`value ${data.balance >= 0 ? 'green' : 'red'}`}>{fmt(data.balance)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Margen</div>
                <div className={`value ${data.balance >= 0 ? 'green' : 'red'}`}>
                  {data.totalIncome > 0 ? `${Math.round((data.balance / data.totalIncome) * 100)}%` : '—'}
                </div>
              </div>
            </div>

            <div className="cols">
              <div className="card">
                <div className="card-header"><h2>Ingresos por Servicio</h2></div>
                {Object.keys(data.byService).length === 0 ? (
                  <div className="empty">Sin datos</div>
                ) : Object.entries(data.byService).sort((a, b) => b[1].total - a[1].total).map(([svc, v]) => (
                  <div key={svc} className="breakdown-row">
                    <span className="breakdown-label" style={{ minWidth: '100px' }}>{SERVICE_LABELS[svc] ?? svc}</span>
                    <div className="breakdown-bar">
                      <div className="breakdown-fill fill-green" style={{ width: `${(v.total / maxService) * 100}%` }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="breakdown-amount">{fmt(v.total)}</div>
                      <div className="breakdown-count">{v.count} factura{v.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header"><h2>Gastos por Categoría</h2></div>
                {Object.keys(data.byCategory).length === 0 ? (
                  <div className="empty">Sin datos</div>
                ) : Object.entries(data.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="breakdown-row">
                    <span className="breakdown-label" style={{ minWidth: '100px' }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <div className="breakdown-bar">
                      <div className="breakdown-fill fill-red" style={{ width: `${(amt / maxCategory) * 100}%` }} />
                    </div>
                    <div className="breakdown-amount">{fmt(amt)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header"><h2>Detalle de Ingresos ({data.income.length})</h2></div>
              {data.income.length === 0 ? <div className="empty">Sin ingresos en este período</div> : (
                <table>
                  <thead>
                    <tr><th>Fecha</th><th>Factura</th><th>Cliente</th><th>Servicio</th><th>Monto</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {data.income.map(r => (
                      <tr key={r.id}>
                        <td>{r.invoice_date}</td>
                        <td style={{ fontSize: '12px', color: '#9ca3af' }}>{r.invoice_number}</td>
                        <td>{r.accounting_clients?.name ?? '—'}</td>
                        <td>{SERVICE_LABELS[r.service_type] ?? r.service_type}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(r.amount)}</td>
                        <td><span className={`badge ${r.payment_status === 'paid' ? 'badge-green' : r.payment_status === 'partial' ? 'badge-blue' : 'badge-yellow'}`}>{r.payment_status === 'paid' ? 'Pagado' : r.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <div className="card-header"><h2>Detalle de Gastos ({data.expenses.length})</h2></div>
              {data.expenses.length === 0 ? <div className="empty">Sin gastos en este período</div> : (
                <table>
                  <thead>
                    <tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th>Monto</th></tr>
                  </thead>
                  <tbody>
                    {data.expenses.map(r => (
                      <tr key={r.id}>
                        <td>{r.expense_date}</td>
                        <td style={{ fontWeight: 600 }}>{r.description}</td>
                        <td>{CATEGORY_LABELS[r.category] ?? r.category}</td>
                        <td style={{ textTransform: 'capitalize' }}>{r.expense_type === 'fixed' ? 'Fijo' : 'Variable'}</td>
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
