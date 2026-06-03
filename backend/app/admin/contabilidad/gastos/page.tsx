'use client'
import { useEffect, useState } from 'react'

interface Expense {
  id: string; expense_date: string; category: string; expense_type: string
  description: string; amount: number; receipt_note: string | null; created_at: string
}

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]
const CATEGORY_OPTS = ['marketing', 'software', 'office', 'state_fees', 'payroll', 'taxes', 'other']
const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing', software: 'Software', office: 'Oficina',
  state_fees: 'Fees del Estado', payroll: 'Nómina', taxes: 'Impuestos', other: 'Otro',
}
const TYPE_OPTS = ['fixed', 'variable']
const TYPE_LABELS: Record<string, string> = { fixed: 'Fijo', variable: 'Variable' }
const TYPE_CLASS: Record<string, string> = { fixed: 'badge-blue', variable: 'badge-gray' }
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = { expense_date: today(), category: 'other', expense_type: 'variable', description: '', amount: '', receipt_note: '' }

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
.layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.toolbar select, .toolbar input[type=date] { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; outline: none; font-family: inherit; }
.toolbar select:focus, .toolbar input[type=date]:focus { border-color: #2563eb; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-sm { font-size: 12px; padding: 4px 10px; background: #f3f4f6; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; margin-right: 4px; }
.btn-del { font-size: 12px; padding: 4px 10px; background: transparent; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 6px; cursor: pointer; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
.sidebar-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); padding: 18px; }
.sidebar-card h3 { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; }
.cat-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
.cat-row:last-child { border-bottom: none; }
.cat-label { color: #374151; }
.cat-amount { font-weight: 700; color: #dc2626; }
.total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 10px; padding-top: 10px; border-top: 2px solid #f3f4f6; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; white-space: nowrap; }
td { padding: 11px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-gray { background: #f3f4f6; color: #374151; }
.empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px; justify-content: flex-end; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; font-family: inherit; outline: none; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #2563eb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.err { color: #dc2626; font-size: 12px; }
@media (max-width: 768px) { .page { padding: 16px 12px; } .layout { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
`

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Expense | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory) params.set('category', filterCategory)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    fetch(`/api/contabilidad/gastos?${params}`)
      .then(r => r.json())
      .then(d => { setExpenses(d.expenses ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterCategory, fromDate, toDate])

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErr(''); setShowModal(true) }
  const openEdit = (item: Expense) => {
    setEditItem(item)
    setForm({ expense_date: item.expense_date, category: item.category, expense_type: item.expense_type, description: item.description, amount: String(item.amount), receipt_note: item.receipt_note ?? '' })
    setErr('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setErr('')
    if (!form.description.trim() || !form.amount || !form.category) { setErr('Categoría, descripción y monto son requeridos'); return }
    setSaving(true)
    const url = editItem ? `/api/contabilidad/gastos/${editItem.id}` : '/api/contabilidad/gastos'
    const method = editItem ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'Error al guardar'); return }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/contabilidad/gastos/${id}`, { method: 'DELETE' })
    load()
  }

  const total = expenses.reduce((s, r) => s + r.amount, 0)
  const byCategory = CATEGORY_OPTS.reduce((acc, cat) => {
    const sum = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
    if (sum > 0) acc[cat] = sum
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>← Admin</a>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / Gastos
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad/gastos' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        <div className="toolbar">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORY_OPTS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Desde" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Hasta" />
          <button className="btn btn-primary" onClick={openAdd}>+ Registrar Gasto</button>
        </div>

        <div className="layout">
          <div className="card">
            {loading ? <div className="loading">Cargando...</div> : expenses.length === 0 ? (
              <div className="empty">No hay gastos registrados.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Comprobante</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(r => (
                    <tr key={r.id}>
                      <td>{r.expense_date}</td>
                      <td style={{ fontWeight: 600 }}>{r.description}</td>
                      <td>{CATEGORY_LABELS[r.category] ?? r.category}</td>
                      <td><span className={`badge ${TYPE_CLASS[r.expense_type]}`}>{TYPE_LABELS[r.expense_type]}</span></td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(r.amount)}</td>
                      <td style={{ fontSize: '12px', color: '#9ca3af' }}>{r.receipt_note ?? '—'}</td>
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

          <div className="sidebar-card">
            <h3>Resumen por Categoría</h3>
            {Object.entries(byCategory).map(([cat, amt]) => (
              <div key={cat} className="cat-row">
                <span className="cat-label">{CATEGORY_LABELS[cat]}</span>
                <span className="cat-amount">{fmt(amt)}</span>
              </div>
            ))}
            <div className="total-row">
              <span>Total</span>
              <span style={{ color: '#dc2626' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Monto ($) *</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORY_OPTS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.expense_type} onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))}>
                    {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Suscripción Adobe, Fee de registro FL..." />
              </div>
              <div className="form-group">
                <label>Comprobante / Nota</label>
                <textarea rows={2} value={form.receipt_note} onChange={e => setForm(f => ({ ...f, receipt_note: e.target.value }))} placeholder="Número de recibo, referencia, foto del comprobante..." style={{ resize: 'vertical' }} />
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
