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
  upcomingRenewals: { id: string; description: string; amount: number; recurrence: string; renewal_date: string }[]
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

// IRS 2025 quarterly estimated tax deadlines
const QUARTERS = [
  { label: 'Q1', period: 'Ene – Mar', due: 'Apr 15, 2025', dueDate: new Date('2025-04-15') },
  { label: 'Q2', period: 'Abr – May', due: 'Jun 16, 2025', dueDate: new Date('2025-06-16') },
  { label: 'Q3', period: 'Jun – Ago', due: 'Sep 15, 2025', dueDate: new Date('2025-09-15') },
  { label: 'Q4', period: 'Sep – Dic', due: 'Ene 15, 2026', dueDate: new Date('2026-01-15') },
]

const TAX_RATE_KEY = 'contabilidad_tax_rate'
const DEFAULT_TAX_RATE = 25

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
.stat-card.highlight { border: 2px solid #059669; }
.stat-card .label { font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.stat-card .value { font-size: 26px; font-weight: 700; color: #1a1a2e; margin-top: 6px; line-height: 1; }
.stat-card .value.green { color: #059669; }
.stat-card .value.red { color: #dc2626; }
.stat-card .value.blue { color: #2563eb; }
.stat-card .value.orange { color: #d97706; }
.stat-card .value.purple { color: #7c3aed; }
.stat-card .sub { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; }
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
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-gray { background: #f3f4f6; color: #374151; }
.empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.actions-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-sync { background: #2563eb; color: #fff; }
.btn-sync:hover:not(:disabled) { background: #1d4ed8; }
.btn-reset { background: transparent; color: #dc2626; border: 1.5px solid #fecaca; }
.btn-reset:hover:not(:disabled) { background: #fef2f2; }
.sync-msg { font-size: 13px; color: #374151; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px; }
.sync-msg.err { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.renewals-banner { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; }
.renewals-title { font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.renewals-title a { font-size: 12px; color: #c2410c; text-decoration: none; font-weight: 600; text-transform: none; letter-spacing: 0; }
.renewal-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #fed7aa; font-size: 13px; }
.renewal-row:last-child { border-bottom: none; }
.renewal-badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.rb-expired { background: #fee2e2; color: #991b1b; }
.rb-urgent { background: #fef3c7; color: #92400e; }
.rb-soon { background: #fde8d8; color: #c2410c; }
.tax-bar { display: flex; align-items: center; gap: 12px; background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 16px; margin-bottom: 24px; flex-wrap: wrap; }
.tax-bar-label { font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .5px; }
.tax-bar-value { font-size: 18px; font-weight: 700; color: #78350f; }
.tax-bar-note { font-size: 11px; color: #a16207; flex: 1; }
.tax-input { width: 64px; padding: 4px 8px; border: 1.5px solid #fde68a; border-radius: 6px; font-size: 14px; font-weight: 700; color: #78350f; background: #fff; font-family: inherit; text-align: center; }
.tax-input:focus { outline: none; border-color: #f59e0b; }
.btn-tax-save { padding: 4px 12px; background: #f59e0b; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.btn-tax-edit { padding: 4px 12px; background: transparent; color: #92400e; border: 1.5px solid #fde68a; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
.section-label { font-size: 11px; color: #9ca3af; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.quarter-card { background: #fff; border-radius: 10px; padding: 18px 20px; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
.quarter-card .q-label { font-size: 18px; font-weight: 800; color: #1a1a2e; }
.quarter-card .q-period { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.quarter-card .q-amount { font-size: 20px; font-weight: 700; color: #7c3aed; margin-top: 10px; }
.quarter-card .q-due { font-size: 11px; margin-top: 6px; font-weight: 600; }
.quarter-card .q-due.past { color: #6b7280; }
.quarter-card .q-due.upcoming { color: #d97706; }
.quarter-card .q-due.due-soon { color: #dc2626; }
@media (max-width: 768px) {
  .page { padding: 16px 12px; }
  .cols { grid-template-columns: 1fr; }
  .cols-3 { grid-template-columns: repeat(2, 1fr); }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card { padding: 14px 16px; }
  .stat-card .value { font-size: 20px; }
  .tax-bar-note { display: none; }
}
@media (max-width: 480px) {
  .cols-3 { grid-template-columns: 1fr 1fr; }
}
`

export default function ContabilidadDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE)
  const [editingTax, setEditingTax] = useState(false)
  const [taxInput, setTaxInput] = useState(String(DEFAULT_TAX_RATE))

  useEffect(() => {
    const saved = localStorage.getItem(TAX_RATE_KEY)
    if (saved) { setTaxRate(Number(saved)); setTaxInput(saved) }
    loadData()
  }, [])

  function loadData() {
    setLoading(true)
    fetch('/api/contabilidad/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  function saveTaxRate() {
    const val = Math.max(0, Math.min(100, Number(taxInput) || DEFAULT_TAX_RATE))
    setTaxRate(val)
    setTaxInput(String(val))
    localStorage.setItem(TAX_RATE_KEY, String(val))
    setEditingTax(false)
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    const res = await fetch('/api/contabilidad/sync-orders', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setSyncMsg(`✓ ${json.imported} orden${json.imported !== 1 ? 'es' : ''} importada${json.imported !== 1 ? 's' : ''}${json.skipped > 0 ? ` · ${json.skipped} ya existían` : ''}.`)
      loadData()
    } else { setSyncMsg(`Error: ${json.error}`) }
    setSyncing(false)
  }

  async function handleReset() {
    if (!window.confirm('¿Seguro que quieres borrar TODOS los datos de contabilidad? Esto no se puede deshacer.')) return
    setResetting(true)
    const res = await fetch('/api/contabilidad/reset', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'RESET_CONTABILIDAD' }),
    })
    const json = await res.json()
    if (res.ok) { setSyncMsg('Datos de prueba eliminados. Módulo en cero.'); loadData() }
    else { setSyncMsg(`Error: ${json.error}`) }
    setResetting(false)
  }

  function quarterDueClass(dueDate: Date): string {
    const now = new Date()
    const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return 'past'
    if (diff <= 30) return 'due-soon'
    return 'upcoming'
  }

  function quarterDuePrefix(dueDate: Date): string {
    const now = new Date()
    const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return '✓ Venció'
    if (diff <= 30) return '⚠ Vence pronto —'
    return 'Vence'
  }

  const totalTax = data ? Math.max(0, data.totalBalance) * (taxRate / 100) : 0
  const netProfit = data ? Math.max(0, data.totalBalance) - totalTax : 0
  const monthTax = data ? Math.max(0, data.monthBalance) * (taxRate / 100) : 0
  const monthNet = data ? Math.max(0, data.monthBalance) - monthTax : 0
  const quarterlyPayment = totalTax / 4

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

        <div className="actions-bar">
          <button className="btn btn-sync" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Importando...' : '↓ Importar órdenes del admin'}
          </button>
          <button className="btn btn-reset" onClick={handleReset} disabled={resetting}>
            {resetting ? 'Borrando...' : 'Poner en cero (datos de prueba)'}
          </button>
          {syncMsg && (
            <span className={`sync-msg${syncMsg.startsWith('Error') ? ' err' : ''}`}>{syncMsg}</span>
          )}
        </div>

        {/* Tax rate configurator */}
        <div className="tax-bar">
          <span className="tax-bar-label">Tasa Federal Estimada (IRS)</span>
          {editingTax ? (
            <>
              <input
                className="tax-input"
                type="number"
                min={0} max={100}
                value={taxInput}
                onChange={e => setTaxInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTaxRate()}
                autoFocus
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#78350f' }}>%</span>
              <button className="btn-tax-save" onClick={saveTaxRate}>Guardar</button>
            </>
          ) : (
            <>
              <span className="tax-bar-value">{taxRate}%</span>
              <button className="btn-tax-edit" onClick={() => setEditingTax(true)}>Cambiar</button>
            </>
          )}
          <span className="tax-bar-note">
            SE tax ~15.3% + income tax estimado. Florida no tiene state income tax.
            Recomendado: 25–30% para LLC/sole proprietor.
          </span>
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
            {/* Renewal alerts */}
            {data.upcomingRenewals.length > 0 && (
              <div className="renewals-banner">
                <div className="renewals-title">
                  <span>⚠ Vencimientos próximos ({data.upcomingRenewals.length})</span>
                  <a href="/admin/contabilidad/gastos">Ver gastos →</a>
                </div>
                {data.upcomingRenewals.map(r => {
                  const d = Math.ceil((new Date(r.renewal_date).getTime() - Date.now()) / 86400000)
                  const cls = d < 0 ? 'rb-expired' : d <= 7 ? 'rb-urgent' : 'rb-soon'
                  const label = d < 0 ? `Venció hace ${Math.abs(d)}d` : d === 0 ? 'Vence HOY' : `Vence en ${d}d`
                  return (
                    <div key={r.id} className="renewal-row">
                      <div>
                        <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{r.description}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 8 }}>{fmt(r.amount)}</span>
                      </div>
                      <span className={`renewal-badge ${cls}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mes actual */}
            <div className="section-label">Mes actual</div>
            <div className="stats-grid" style={{ marginBottom: '16px' }}>
              <div className="stat-card">
                <div className="label">Ingresos del Mes</div>
                <div className="value green">{fmt(data.monthRevenue)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Gastos del Mes</div>
                <div className="value red">{fmt(data.monthExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Taxes Est. del Mes</div>
                <div className="value orange">{fmt(monthTax)}</div>
                <div className="sub">{taxRate}% sobre ganancia bruta</div>
              </div>
              <div className="stat-card highlight">
                <div className="label">Ganancia Neta del Mes</div>
                <div className={`value ${monthNet >= 0 ? 'green' : 'red'}`}>{fmt(monthNet)}</div>
                <div className="sub">después de taxes estimados</div>
              </div>
            </div>

            {/* Acumulado total */}
            <div className="section-label">Acumulado total</div>
            <div className="stats-grid" style={{ marginBottom: '28px' }}>
              <div className="stat-card">
                <div className="label">Ingresos Totales</div>
                <div className="value green">{fmt(data.totalRevenue)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Gastos Totales</div>
                <div className="value red">{fmt(data.totalExpenses)}</div>
              </div>
              <div className="stat-card">
                <div className="label">Reserva para Taxes</div>
                <div className="value orange">{fmt(totalTax)}</div>
                <div className="sub">{taxRate}% × ganancia bruta</div>
              </div>
              <div className="stat-card highlight">
                <div className="label">Ganancia Neta Total</div>
                <div className={`value ${netProfit >= 0 ? 'green' : 'red'}`}>{fmt(netProfit)}</div>
                <div className="sub">después de taxes estimados</div>
              </div>
            </div>

            {/* Otros indicadores */}
            <div className="section-label">Otros indicadores</div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '28px' }}>
              <div className="stat-card">
                <div className="label">Clientes Activos</div>
                <div className="value blue">{data.activeClients}</div>
              </div>
              <div className="stat-card">
                <div className="label">Por Cobrar</div>
                <div className="value orange">{fmt(data.pendingAmount)}</div>
              </div>
            </div>

            {/* Pagos trimestrales IRS */}
            <div className="section-label" style={{ marginBottom: '12px' }}>Pagos trimestrales IRS (Estimated Tax)</div>
            <div className="cols-3" style={{ marginBottom: '28px' }}>
              {QUARTERS.map(q => {
                const cls = quarterDueClass(q.dueDate)
                const prefix = quarterDuePrefix(q.dueDate)
                return (
                  <div key={q.label} className="quarter-card">
                    <div className="q-label">{q.label}</div>
                    <div className="q-period">{q.period}</div>
                    <div className="q-amount">{fmt(quarterlyPayment)}</div>
                    <div className={`q-due ${cls}`}>{prefix} {q.due}</div>
                  </div>
                )
              })}
            </div>

            {/* Últimos movimientos */}
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
