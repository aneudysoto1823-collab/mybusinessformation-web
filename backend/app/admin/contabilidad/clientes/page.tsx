'use client'
import { useEffect, useState } from 'react'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  notes: string | null
  order_id: string | null
  created_at: string
}

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]

const STATUS_OPTS = ['active', 'pending', 'completed']
const STATUS_LABEL: Record<string, string> = { active: 'Activo', pending: 'Pendiente', completed: 'Completado' }
const STATUS_CLASS: Record<string, string> = { active: 'badge-green', pending: 'badge-yellow', completed: 'badge-gray' }

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
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.toolbar input, .toolbar select { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; outline: none; font-family: inherit; }
.toolbar input { flex: 1; min-width: 180px; }
.toolbar input:focus, .toolbar select:focus { border-color: #2563eb; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-danger { background: transparent; color: #dc2626; border: 1.5px solid #fecaca; font-size: 12px; padding: 4px 10px; }
.btn-sm { font-size: 12px; padding: 5px 10px; background: #f3f4f6; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 11px 16px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
td { padding: 12px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f9fafb; cursor: pointer; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
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
.err { color: #dc2626; font-size: 12px; margin-top: 4px; }
@media (max-width: 640px) { .page { padding: 16px 12px; } .form-row { grid-template-columns: 1fr; } }
`

const EMPTY_FORM = { name: '', phone: '', email: '', status: 'active', notes: '', order_id: '' }

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (search) params.set('search', search)
    fetch(`/api/contabilidad/clientes?${params}`)
      .then(r => r.json())
      .then(d => { setClients(d.clients ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus])

  const handleSearch = (e: React.KeyboardEvent) => { if (e.key === 'Enter') load() }

  const handleSave = async () => {
    setErr('')
    if (!form.name.trim()) { setErr('El nombre es requerido'); return }
    setSaving(true)
    const res = await fetch('/api/contabilidad/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'Error al guardar'); return }
    setShowModal(false)
    setForm(EMPTY_FORM)
    load()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    await fetch(`/api/contabilidad/clientes/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>← Admin</a>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Panel Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / Clientes
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad/clientes' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        <div className="toolbar">
          <input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setErr('') }}>+ Agregar Cliente</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : clients.length === 0 ? (
            <div className="empty">No hay clientes. Agrega el primero.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} onClick={() => window.location.href = `/admin/contabilidad/clientes/${c.id}`}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: '#6b7280' }}>{c.email ?? '—'}</td>
                    <td style={{ color: '#6b7280' }}>{c.phone ?? '—'}</td>
                    <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                    <td style={{ color: '#9ca3af' }}>{c.created_at?.split('T')[0]}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-danger btn" onClick={() => handleDelete(c.id, c.name)}>Eliminar</button>
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
              <h3>Nuevo Cliente</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Pérez" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (305) 000-0000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ID de Orden (opcional)</label>
                  <input value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))} placeholder="Vincula a una orden existente" />
                </div>
              </div>
              <div className="form-group">
                <label>Notas internas</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre el cliente..." style={{ resize: 'vertical' }} />
              </div>
              {err && <div className="err">{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" style={{ background: 'transparent', color: '#6b7280', border: '1.5px solid #e5e7eb' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
