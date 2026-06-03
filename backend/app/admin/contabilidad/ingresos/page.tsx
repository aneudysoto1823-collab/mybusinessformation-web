'use client'
import { useEffect, useState } from 'react'

interface Income {
  id: string; invoice_number: string; invoice_date: string; service_type: string
  description: string | null; amount: number; payment_method: string
  payment_status: string; amount_paid: number; notes: string | null
  client_id: string | null; order_id: string | null
  accounting_clients: { id: string; name: string; email: string | null } | null
}
interface Client { id: string; name: string }

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]
const SERVICE_OPTS = ['llc', 'corp', 'ein', 'itin', 'addon', 'new_business_letter', 'other']
const SERVICE_LABELS: Record<string, string> = { llc: 'LLC', corp: 'Corp', ein: 'EIN', itin: 'ITIN', addon: 'Add-on', new_business_letter: 'New Biz Letter', other: 'Otro' }
const METHOD_OPTS = ['cash', 'zelle', 'card', 'stripe', 'check', 'other']
const METHOD_LABELS: Record<string, string> = { cash: 'Efectivo', zelle: 'Zelle', card: 'Tarjeta', stripe: 'Stripe', check: 'Cheque', other: 'Otro' }
const STATUS_OPTS = ['paid', 'pending', 'partial']
const STATUS_LABEL: Record<string, string> = { paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial' }
const STATUS_CLASS: Record<string, string> = { paid: 'badge-green', pending: 'badge-yellow', partial: 'badge-blue' }

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = { client_id: '', order_id: '', invoice_date: today(), service_type: 'llc', description: '', amount: '', payment_method: 'zelle', payment_status: 'pending', amount_paid: '0', notes: '' }

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
.page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.top-bar h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.breadcrumb { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.breadcrumb a { color: #2563eb; text-decoration: none; }
.nav-tabs { display: flex; gap: 4px; background: #e5e7eb; border-radius: 10px; padding: 4px; margin-bottom: 28px; overflow-x: auto; }
.nav-tab { flex: 1; white-space: nowrap; text-align: center; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; }
.nav-tab.active { background: #fff; color: #1a1a2e; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }
.toolbar select, .toolbar input[type=date] { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; outline: none; font-family: inherit; }
.toolbar select:focus, .toolbar input[type=date]:focus { border-color: #2563eb; }
.totals { display: flex; gap: 20px; margin-left: auto; }
.total-item { font-size: 13px; font-weight: 700; }
.total-item.green { color: #059669; }
.total-item.orange { color: #d97706; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-sm { font-size: 12px; padding: 4px 10px; background: #f3f4f6; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; margin-right: 4px; }
.btn-del { font-size: 12px; padding: 4px 10px; background: transparent; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 6px; cursor: pointer; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; white-space: nowrap; }
td { padding: 11px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px; justify-content: flex-end; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; font-family: inherit; outline: none; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #2563eb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.err { color: #dc2626; font-size: 12px; }
.hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
@media (max-width: 640px) { .page { padding: 16px 12px; } .form-row { grid-template-columns: 1fr; } .totals { display: none; } }
`

export default function IngresosPage() {
  const [income, setIncome] = useState<Income[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Income | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    fetch(`/api/contabilidad/ingresos?${params}`)
      .then(r => r.json())
      .then(d => { setIncome(d.income ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus, fromDate, toDate])
  useEffect(() => {
    fetch('/api/contabilidad/clientes')
      .then(r => r.json())
      .then(d => setClients(d.clients ?? []))
  }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErr(''); setShowModal(true) }
  const openEdit = (item: Income) => {
    setEditItem(item)
    setForm({
      client_id: item.client_id ?? '', order_id: item.order_id ?? '',
      invoice_date: item.invoice_date, service_type: item.service_type,
      description: item.description ?? '', amount: String(item.amount),
      payment_method: item.payment_method, payment_status: item.payment_status,
      amount_paid: String(item.amount_paid), notes: item.notes ?? '',
    })
    setErr('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setErr('')
    if (!form.amount || !form.service_type || !form.payment_method) { setErr('Monto, servicio y método son requeridos'); return }
    setSaving(true)
    const url = editItem ? `/api/contabilidad/ingresos/${editItem.id}` : '/api/contabilidad/ingresos'
    const method = editItem ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'Error al guardar'); return }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return
    await fetch(`/api/contabilidad/ingresos/${id}`, { method: 'DELETE' })
    load()
  }

  const totalPaid = income.filter(r => r.payment_status === 'paid').reduce((s, r) => s + r.amount, 0)
  const totalPending = income.filter(r => r.payment_status !== 'paid').reduce((s, r) => s + (r.amount - r.amount_paid), 0)

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>← Admin</a>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / Ingresos
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad/ingresos' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        <div className="toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Desde" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Hasta" />
          <div className="totals">
            <span className="total-item green">Cobrado: {fmt(totalPaid)}</span>
            <span className="total-item orange">Pendiente: {fmt(totalPending)}</span>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Registrar Ingreso</button>
        </div>

        <div className="card">
          {loading ? <div className="loading">Cargando...</div> : income.length === 0 ? (
            <div className="empty">No hay ingresos registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Pagado</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {income.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{r.invoice_number}</td>
                    <td>{r.invoice_date}</td>
                    <td style={{ fontWeight: 600 }}>{r.accounting_clients?.name ?? '—'}</td>
                    <td>{SERVICE_LABELS[r.service_type] ?? r.service_type}</td>
                    <td style={{ textTransform: 'capitalize' }}>{METHOD_LABELS[r.payment_method] ?? r.payment_method}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(r.amount)}</td>
                    <td>{fmt(r.amount_paid)}</td>
                    <td><span className={`badge ${STATUS_CLASS[r.payment_status]}`}>{STATUS_LABEL[r.payment_status]}</span></td>
                    <td>
                      <button className="btn-sm" onClick={() => openEdit(r)}>Editar</button>
                      <button className="btn-del" onClick={() => handleDelete(r.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Editar Ingreso' : 'Registrar Ingreso'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Tipo de Servicio *</label>
                  <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                    {SERVICE_OPTS.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">— Sin cliente —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Monto Total ($) *</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Estado de Pago *</label>
                  <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Método de Pago *</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                    {METHOD_OPTS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto Pagado ($)</label>
                  <input type="number" step="0.01" min="0" value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} placeholder="0.00" />
                  <div className="hint">Para pagos parciales</div>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del servicio..." />
              </div>
              <div className="form-group">
                <label>Notas internas</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              {err && <div className="err">{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn" style={{ background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
