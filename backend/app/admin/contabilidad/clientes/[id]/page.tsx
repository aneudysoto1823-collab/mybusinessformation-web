'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Client {
  id: string; name: string; phone: string | null; email: string | null
  status: string; notes: string | null; order_id: string | null; created_at: string
}
interface Income {
  id: string; invoice_number: string; invoice_date: string; service_type: string
  description: string | null; amount: number; payment_method: string
  payment_status: string; amount_paid: number; notes: string | null
}

const STATUS_LABEL: Record<string, string> = { active: 'Activo', pending: 'Pendiente', completed: 'Completado' }
const STATUS_CLASS: Record<string, string> = { active: 'badge-green', pending: 'badge-yellow', completed: 'badge-gray' }
const PAY_LABEL: Record<string, string> = { paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial' }
const PAY_CLASS: Record<string, string> = { paid: 'badge-green', pending: 'badge-yellow', partial: 'badge-blue' }
const SERVICE_LABELS: Record<string, string> = {
  llc: 'LLC', corp: 'Corp', ein: 'EIN', itin: 'ITIN',
  addon: 'Add-on', new_business_letter: 'New Biz Letter', other: 'Otro',
}
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f6f9; font-family: var(--font-sans); }
.page { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
.breadcrumb { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.breadcrumb a { color: #2563eb; text-decoration: none; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); margin-bottom: 20px; }
.card-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { font-size: 15px; font-weight: 700; color: #1a1a2e; }
.card-body { padding: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; }
.info-item .val { font-size: 14px; color: #1a1a2e; margin-top: 3px; font-weight: 500; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-gray { background: #f3f4f6; color: #374151; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; font-family: inherit; outline: none; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #2563eb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-danger { background: #dc2626; color: #fff; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
td { padding: 11px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
tr:last-child td { border-bottom: none; }
.empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
@media (max-width: 640px) { .page { padding: 16px 12px; } .info-grid, .form-row { grid-template-columns: 1fr; } }
`

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch(`/api/contabilidad/clientes/${id}`)
      .then(r => r.json())
      .then(d => { setClient(d.client); setForm(d.client); setIncome(d.income ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/contabilidad/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { setClient(data.client); setEditing(false) }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este cliente? No se puede deshacer.')) return
    await fetch(`/api/contabilidad/clientes/${id}`, { method: 'DELETE' })
    router.push('/admin/contabilidad/clientes')
  }

  if (loading) return <><style>{styles}</style><div className="page"><div className="loading">Cargando...</div></div></>
  if (!client) return <><style>{styles}</style><div className="page"><div className="loading">Cliente no encontrado</div></div></>

  const totalPaid = income.reduce((s, r) => s + (r.payment_status === 'paid' ? r.amount : r.amount_paid), 0)
  const totalPending = income.reduce((s, r) => s + (r.payment_status !== 'paid' ? r.amount - r.amount_paid : 0), 0)

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="breadcrumb">
          <a href="/admin">Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / <a href="/admin/contabilidad/clientes">Clientes</a> / {client.name}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>{client.name}</h2>
            <span className={`badge ${STATUS_CLASS[client.status]}`}>{STATUS_LABEL[client.status]}</span>
          </div>
          <div className="card-body">
            {!editing ? (
              <>
                <div className="info-grid">
                  <div className="info-item"><label>Email</label><div className="val">{client.email ?? '—'}</div></div>
                  <div className="info-item"><label>Teléfono</label><div className="val">{client.phone ?? '—'}</div></div>
                  <div className="info-item"><label>ID de Orden vinculada</label><div className="val">{client.order_id ?? '—'}</div></div>
                  <div className="info-item"><label>Registro</label><div className="val">{client.created_at?.split('T')[0]}</div></div>
                </div>
                {client.notes && (
                  <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                    <strong style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px' }}>Notas</strong>
                    <div style={{ marginTop: '4px' }}>{client.notes}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button className="btn btn-primary" onClick={() => setEditing(true)}>Editar</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
                </div>
              </>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group"><label>Nombre</label><input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="form-group"><label>Estado</label>
                    <select value={form.status ?? 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div className="form-group"><label>Teléfono</label><input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label>Notas internas</label><textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="actions">
                  <button className="btn" style={{ background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb' }} onClick={() => setEditing(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Historial de Pagos</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>Cobrado: {fmt(totalPaid)}</span>
              <span style={{ color: '#d97706', fontWeight: 700 }}>Pendiente: {fmt(totalPending)}</span>
            </div>
          </div>
          {income.length === 0 ? (
            <div className="empty">Sin pagos registrados para este cliente.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>Método</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {income.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, fontSize: '12px', color: '#6b7280' }}>{r.invoice_number}</td>
                    <td>{r.invoice_date}</td>
                    <td>{SERVICE_LABELS[r.service_type] ?? r.service_type}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.payment_method}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(r.amount)}</td>
                    <td>{fmt(r.amount_paid)}</td>
                    <td><span className={`badge ${PAY_CLASS[r.payment_status]}`}>{PAY_LABEL[r.payment_status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
