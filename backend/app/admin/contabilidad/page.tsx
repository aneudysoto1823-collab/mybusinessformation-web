'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  totalBalance: number
  totalRevenue: number
  totalExpenses: number
  monthRevenue: number
  monthExpenses: number
  monthBalance: number
  activeClients: number
  pendingAmount: number
  recentIncome: { id: string; invoice_number: string; invoice_date: string; service_type: string; amount: number; payment_status: string; accounting_clients: { name: string } | null }[]
  recentExpenses: { id: string; expense_date: string; category: string; description: string; amount: number }[]
}

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]

const SERVICE_LABELS: Record<string, string> = {
  llc: 'LLC', corp: 'Corp', ein: 'EIN', itin: 'ITIN',
  addon: 'Add-on', new_business_letter: 'New Biz Letter', other: 'Otro',
}
const STATUS_CLASS: Record<string, string> = { paid: 'badge-green', pending: 'badge-yellow', partial: 'badge-blue' }
const STATUS_LABEL: Record<string, string> = { paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial' }

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
.page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.top-bar h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.breadcrumb { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.breadcrumb a { color: #2563eb; text-decoration: none; }
.nav-tabs { display: flex; gap: 4px; background: #e5e7eb; border-radius: 10px; padding: 4px; margin-bottom: 28px; overflow-x: auto; }
.nav-tab { flex: 1; white-space: nowrap; text-align: center; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; transition: all .15s; }
.nav-tab:hover { color: #1a1a2e; }
.nav-tab.active { background: #fff; color: #1a1a2e; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
.stat-card { background: #fff; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
.stat-card .label { font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.stat-card .value { font-size: 26px; font-weight: 700; color: #1a1a2e; margin-top: 6px; line-height: 1; }
.stat-card .value.green { color: #059669; }
.stat-card .value.red { color: #dc2626; }
.stat-card .value.blue { color: #2563eb; }
.stat-card .value.orange { color: #d97706; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
.card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.card-header a { font-size: 12px; color: #2563eb; text-decoration: none; font-weight: 600; }
.item { display: flex; justify-content: space-between; align-items: center; padding: 11px 18px; border-bottom: 1px solid #f9fafb; font-size: 13px; }
.item:last-child { border-bottom: none; }
.item-left { display: flex; flex-direction: column; gap: 2px; }
.item-name { font-weight: 600; color: #1a1a2e; }
.item-sub { font-size: 11px; color: #9ca3af; }
.item-right { text-align: right; }
.item-amount { font-weight: 700; color: #1a1a2e; }
.item-amount.green { color: #059669; }
.item-amount.red { color: #dc2626; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 3px; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
@media (max-width: 768px) {
  .page { padding: 16px 12px; }
  .cols { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card { padding: 14px 16px; }
  .stat-card .value { font-size: 20px; }
}
`

export default function ContabilidadDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contabilidad/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <Link href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
            ← Admin
          </Link>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Panel Admin</a> / Contabilidad
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : !data ? (
          <div className="loading">Error al cargar. Recarga la página.</div>
        ) : (
          <>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Mes actual</div>
            <div className="stats-grid" style={{ marginBottom: '16px' }}>
              <div className="stat-card">
                <div className="label">Ingresos del Mes</div>
                <div className={`value ${data.monthRevenue >= 0 ? 'green' : 'red'}`}>{fmt(data.monthRevenue)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Gastos del Mes</div>
                <div className="value red">{fmt(data.monthExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Balance del Mes</div>
                <div className={`value ${data.monthBalance >= 0 ? 'green' : 'red'}`}>{fmt(data.monthBalance)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Por Cobrar</div>
                <div className="value orange">{fmt(data.pendingAmount)}</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Acumulado total</div>
            <div className="stats-grid" style={{ marginBottom: '28px' }}>
              <div className="stat-card">
                <div className="label">Balance General</div>
                <div className={`value ${data.totalBalance >= 0 ? 'green' : 'red'}`}>{fmt(data.totalBalance)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Ingresos Totales</div>
                <div className="value green">{fmt(data.totalRevenue)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Gastos Totales</div>
                <div className="value red">{fmt(data.totalExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Clientes Activos</div>
                <div className="value blue">{data.activeClients}</div>
              </div>
            </div>

            <div className="cols">
              <div className="card">
                <div className="card-header">
                  <h2>Últimos Ingresos</h2>
                  <a href="/admin/contabilidad/ingresos">Ver todos →</a>
                </div>
                {data.recentIncome.length === 0 ? (
                  <div className="empty">Sin ingresos registrados</div>
                ) : data.recentIncome.map(r => (
                  <div key={r.id} className="item">
                    <div className="item-left">
                      <span className="item-name">{r.accounting_clients?.name ?? '—'}</span>
                      <span className="item-sub">{SERVICE_LABELS[r.service_type] ?? r.service_type} · {r.invoice_date}</span>
                      <span className={`badge ${STATUS_CLASS[r.payment_status]}`}>{STATUS_LABEL[r.payment_status]}</span>
                    </div>
                    <div className="item-right">
                      <div className="item-amount green">{fmt(r.amount)}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{r.invoice_number}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Últimos Gastos</h2>
                  <a href="/admin/contabilidad/gastos">Ver todos →</a>
                </div>
                {data.recentExpenses.length === 0 ? (
                  <div className="empty">Sin gastos registrados</div>
                ) : data.recentExpenses.map(r => (
                  <div key={r.id} className="item">
                    <div className="item-left">
                      <span className="item-name">{r.description}</span>
                      <span className="item-sub">{r.category} · {r.expense_date}</span>
                    </div>
                    <div className="item-right">
                      <div className="item-amount red">-{fmt(r.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
