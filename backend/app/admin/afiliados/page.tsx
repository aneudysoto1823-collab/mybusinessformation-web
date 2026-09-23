'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
type ApplicationType = 'affiliate' | 'agent'

type Affiliate = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  ptin: string | null
  application_type: ApplicationType
  status: AffiliateStatus
  commission_percent: number
  coupon_code: string | null
  brand: 'opabiz' | 'fbfc'
  notes: string | null
  first_order_at: string | null
  total_commission_owed: number
  total_commission_paid: number
  last_paid_at: string | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  employment_status: 'independent' | 'employed' | null
  employer_name: string | null
  experience_notes: string | null
  empleados_id: string | null
}

type Empleado = {
  id: string // usuarios.id
  nombre: string
  estado: string
  EMPLEADOS: { id: string } | { id: string }[] | null
}

type Commission = {
  id: string
  order_number: string | null
  service_fee_subtotal: number
  discount_percent: number
  commission_percent: number
  commission_amount: number
  created_at: string
  paid: boolean
}

const PAYOUT_THRESHOLD_USD = 200
const PAYOUT_MONTHS = 2

function isPayoutDue(a: Affiliate): boolean {
  if (a.total_commission_owed <= 0) return false
  if (a.total_commission_owed >= PAYOUT_THRESHOLD_USD) return true
  if (!a.first_order_at) return false
  const monthsSince = (Date.now() - new Date(a.first_order_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  return monthsSince >= PAYOUT_MONTHS
}

const money = (n: number) => `$${(n || 0).toFixed(2)}`

const STATUS_LABEL: Record<AffiliateStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', suspended: 'Suspendido',
}
const STATUS_COLOR: Record<AffiliateStatus, string> = {
  pending: '#b45309', approved: '#047857', rejected: '#991B1B', suspended: '#64748b',
}
const TYPE_LABEL: Record<ApplicationType, string> = { affiliate: 'Afiliado', agent: 'Agente' }
const TYPE_COLOR: Record<ApplicationType, string> = { affiliate: '#2563EB', agent: '#7c3aed' }

export default function AfiliadosAdminPage() {
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'all'>('pending')
  const [typeFilter, setTypeFilter] = useState<ApplicationType | 'all'>('all')
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [editAffiliate, setEditAffiliate] = useState<Affiliate | null>(null)
  const [editCommission, setEditCommission] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [ledgerAffiliate, setLedgerAffiliate] = useState<Affiliate | null>(null)
  const [ledger, setLedger] = useState<Commission[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const [detailAffiliate, setDetailAffiliate] = useState<Affiliate | null>(null)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [linkEmpleadoId, setLinkEmpleadoId] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState('')

  const fetchAffiliates = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/affiliates?status=${statusFilter}`)
    if (res.ok) {
      const data = await res.json()
      setAffiliates(data.affiliates)
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchAffiliates() }, [fetchAffiliates])

  const visibleAffiliates = affiliates.filter(a => typeFilter === 'all' || a.application_type === typeFilter)

  const runAction = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    if (action === 'reject' && !confirm('¿Rechazar esta aplicación?')) return
    if (action === 'suspend' && !confirm('¿Suspender esta cuenta? Deja de poder generar comisión.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchAffiliates()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusyId(null)
    }
  }

  const markPaid = async (id: string) => {
    if (!confirm('¿Confirmás que ya le pagaste a este afiliado por fuera del sistema (Zelle, etc.)? Esto solo actualiza el registro, no transfiere plata.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/affiliates/${id}/mark-paid`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchAffiliates()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusyId(null)
    }
  }

  const openEdit = (a: Affiliate) => {
    setEditAffiliate(a)
    setEditCommission(String(a.commission_percent))
    setEditNotes(a.notes || '')
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editAffiliate) return
    const pct = Number(editCommission)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setEditError('El % de comisión debe ser un número entre 0 y 100.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/affiliates/${editAffiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', commission_percent: pct, notes: editNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setEditAffiliate(null)
      await fetchAffiliates()
    } catch (e) {
      setEditError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const empleadosIdOf = (e: Empleado): string | null => {
    const emp = Array.isArray(e.EMPLEADOS) ? e.EMPLEADOS[0] ?? null : e.EMPLEADOS
    return emp?.id ?? null
  }

  const openDetail = async (a: Affiliate) => {
    setDetailAffiliate(a)
    setLinkEmpleadoId(a.empleados_id || '')
    setLinkError('')
    const res = await fetch('/api/opabiz/employees')
    if (res.ok) {
      const data = await res.json()
      setEmpleados(data.empleados ?? [])
    }
  }

  const saveEmpleadoLink = async () => {
    if (!detailAffiliate) return
    setLinkSaving(true)
    setLinkError('')
    try {
      const res = await fetch(`/api/admin/affiliates/${detailAffiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', empleados_id: linkEmpleadoId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setDetailAffiliate(data.affiliate)
      await fetchAffiliates()
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : String(e))
    } finally {
      setLinkSaving(false)
    }
  }

  const openLedger = async (a: Affiliate) => {
    setLedgerAffiliate(a)
    setLedgerLoading(true)
    const res = await fetch(`/api/admin/affiliates/${a.id}/commissions`)
    if (res.ok) {
      const data = await res.json()
      setLedger(data.commissions)
    } else {
      setLedger([])
    }
    setLedgerLoading(false)
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .wrap{max-width:1200px;margin:0 auto;padding:28px 24px}
        .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 4px rgba(28,46,68,.05);overflow:hidden}
        .card-head{padding:16px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .card-title{font-size:.95rem;font-weight:700;color:#1C2E44}
        .btn{padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-primary{background:#2563EB;color:#fff}
        .btn-primary:hover:not(:disabled){background:#1d4ed8}
        .btn-ghost{background:#F1F5F9;color:#475569;border:1px solid #E2E8F0}
        .btn-ghost:hover:not(:disabled){background:#E2E8F0}
        .btn-green{background:#059669;color:#fff}
        .btn-green:hover:not(:disabled){background:#047857}
        .btn-red{background:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5}
        .btn-red:hover:not(:disabled){background:#FCA5A5}
        .btn-sm{padding:5px 11px;font-size:.72rem}
        .status-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .status-tab{padding:6px 12px;border-radius:16px;font-size:.75rem;font-weight:700;border:1px solid #E2E8F0;background:#F8FAFC;color:#64748b;cursor:pointer;font-family:inherit}
        .status-tab.active{background:#EFF6FF;color:#2563EB;border-color:#2563EB}
        table{width:100%;border-collapse:collapse}
        th{padding:10px 14px;font-size:.7rem;font-weight:700;color:#94A3B8;text-align:left;text-transform:uppercase;letter-spacing:.5px;background:#F8FAFC;border-bottom:1px solid #E2E8F0}
        td{padding:11px 14px;font-size:.8rem;color:#374151;border-bottom:1px solid #F1F5F9;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#FAFBFC}
        .pill{display:inline-block;padding:2px 9px;border-radius:12px;font-size:.7rem;font-weight:700}
        .payout-badge{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:700;background:#FEF3C7;color:#b45309}
        .modal-overlay{position:fixed;inset:0;background:rgba(15,28,46,.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:520px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:85vh;overflow-y:auto}
        .field-label{font-size:.75rem;font-weight:700;color:#64748b;margin-bottom:5px;display:block}
        .field-input{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;font-family:inherit;color:#1e293b;box-sizing:border-box;margin-bottom:14px}
        @media(max-width:768px){.wrap{padding:18px 14px}.card-head{padding:14px 16px}th,td{padding:8px 10px}}
      `}</style>

      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Afiliados</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>Afiliados y Agentes</h1>
            <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>Aplicaciones de referidos (cupón + comisión) y de agentes de campo (OpaBiz Connect)</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">Aplicaciones ({visibleAffiliates.length})</span>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="status-tabs">
                {(['affiliate', 'agent', 'all'] as const).map(t => (
                  <button key={t} className={`status-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                    {t === 'all' ? 'Todos los tipos' : TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              <div className="status-tabs">
                {(['pending', 'approved', 'rejected', 'suspended', 'all'] as const).map(s => (
                  <button key={s} className={`status-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Cargando...</div>
          ) : visibleAffiliates.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>No hay aplicaciones en este filtro.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Código</th>
                    <th>Comisión</th>
                    <th>Deuda</th>
                    <th>Pagado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAffiliates.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: '#1C2E44' }}>
                        {a.name}
                        <div style={{ fontSize: '.7rem', color: '#94A3B8', fontWeight: 400 }}>{a.brand}{a.ptin ? ` · PTIN ${a.ptin}` : ''}</div>
                      </td>
                      <td>
                        {a.email}
                        <div style={{ fontSize: '.72rem', color: '#64748b' }}>{a.phone}</div>
                      </td>
                      <td><span className="pill" style={{ background: '#F1F5F9', color: TYPE_COLOR[a.application_type] }}>{TYPE_LABEL[a.application_type]}</span></td>
                      <td><span className="pill" style={{ background: '#F1F5F9', color: STATUS_COLOR[a.status] }}>{STATUS_LABEL[a.status]}</span></td>
                      <td style={{ fontWeight: 700, color: '#1C2E44' }}>{a.coupon_code || (a.application_type === 'agent' ? 'N/A' : '—')}</td>
                      <td>
                        {a.commission_percent}%
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => openEdit(a)}>Editar</button>
                      </td>
                      <td>
                        {money(a.total_commission_owed)}
                        {isPayoutDue(a) && <span className="payout-badge">Vencido</span>}
                      </td>
                      <td>{money(a.total_commission_paid)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {a.application_type === 'agent' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openDetail(a)}>Ver detalle</button>
                          )}
                          {a.status === 'pending' && (
                            <>
                              <button className="btn btn-green btn-sm" disabled={busyId === a.id} onClick={() => runAction(a.id, 'approve')}>Aprobar</button>
                              <button className="btn btn-red btn-sm" disabled={busyId === a.id} onClick={() => runAction(a.id, 'reject')}>Rechazar</button>
                            </>
                          )}
                          {a.status === 'approved' && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => openLedger(a)}>Historial</button>
                              {a.total_commission_owed > 0 && (
                                <button className="btn btn-primary btn-sm" disabled={busyId === a.id} onClick={() => markPaid(a.id)}>Marcar pagado</button>
                              )}
                              <button className="btn btn-red btn-sm" disabled={busyId === a.id} onClick={() => runAction(a.id, 'suspend')}>Suspender</button>
                            </>
                          )}
                          {a.status === 'suspended' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openLedger(a)}>Historial</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editAffiliate && (
        <div className="modal-overlay" onClick={() => !saving && setEditAffiliate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.95rem', marginBottom: 4 }}>Editar {TYPE_LABEL[editAffiliate.application_type].toLowerCase()}</div>
            <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 16 }}>{editAffiliate.name} · {editAffiliate.email}</div>
            <label className="field-label">% de comisión</label>
            <input className="field-input" type="number" min={0} max={100} step={0.5} value={editCommission} onChange={e => setEditCommission(e.target.value)} />
            <label className="field-label">Notas internas</label>
            <textarea className="field-input" style={{ minHeight: 90, resize: 'vertical' }} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas de seguimiento..." />
            {editError && <div style={{ color: '#991B1B', fontSize: '.8rem', marginBottom: 10 }}>{editError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditAffiliate(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {ledgerAffiliate && (
        <div className="modal-overlay" onClick={() => setLedgerAffiliate(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.95rem', marginBottom: 4 }}>Historial de comisiones</div>
            <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 16 }}>
              {ledgerAffiliate.name} · {ledgerAffiliate.application_type === 'agent' ? 'órdenes asistidas' : `código ${ledgerAffiliate.coupon_code}`}
            </div>
            {ledgerLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Cargando...</div>
            ) : ledger.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Todavía no hay órdenes registradas.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Subtotal servicio</th>
                      <th>Comisión</th>
                      <th>Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: '#1C2E44' }}>{c.order_number || '—'}</td>
                        <td style={{ fontSize: '.75rem', color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>{money(c.service_fee_subtotal)}</td>
                        <td style={{ fontWeight: 700 }}>{money(c.commission_amount)} <span style={{ color: '#94A3B8', fontWeight: 400 }}>({c.commission_percent}%)</span></td>
                        <td>{c.paid ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setLedgerAffiliate(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {detailAffiliate && (
        <div className="modal-overlay" onClick={() => setDetailAffiliate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.95rem', marginBottom: 4 }}>Detalle del agente</div>
            <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 16 }}>{detailAffiliate.name} · {detailAffiliate.email}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', color: '#64748b', width: '38%' }}>Dirección</td><td style={{ padding: '6px 0', color: '#374151' }}>
                  {[detailAffiliate.address_street, detailAffiliate.address_city, detailAffiliate.address_state, detailAffiliate.address_zip].filter(Boolean).join(', ') || '—'}
                </td></tr>
                <tr><td style={{ padding: '6px 0', color: '#64748b' }}>Situación laboral</td><td style={{ padding: '6px 0', color: '#374151' }}>
                  {detailAffiliate.employment_status === 'employed'
                    ? `Empleado${detailAffiliate.employer_name ? ` — ${detailAffiliate.employer_name}` : ''}`
                    : detailAffiliate.employment_status === 'independent' ? 'Independiente' : '—'}
                </td></tr>
                <tr><td style={{ padding: '6px 0', color: '#64748b', verticalAlign: 'top' }}>Experiencia</td><td style={{ padding: '6px 0', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {detailAffiliate.experience_notes || '—'}
                </td></tr>
              </tbody>
            </table>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
              <label className="field-label">Cuenta de OpaBiz Connect</label>
              <div style={{ fontSize: '.72rem', color: '#94A3B8', marginBottom: 8 }}>
                Sin vincular, este agente no genera comisión aunque asista órdenes — el sistema no sabe a qué empleado pertenece.
              </div>
              <select className="field-input" value={linkEmpleadoId} onChange={e => setLinkEmpleadoId(e.target.value)}>
                <option value="">— Sin vincular —</option>
                {empleados.filter(e => e.estado === 'activo' && empleadosIdOf(e)).map(e => (
                  <option key={e.id} value={empleadosIdOf(e)!}>{e.nombre}</option>
                ))}
              </select>
              {linkError && <div style={{ color: '#991B1B', fontSize: '.8rem', marginBottom: 10 }}>{linkError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={saveEmpleadoLink} disabled={linkSaving}>{linkSaving ? 'Guardando...' : 'Guardar vínculo'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailAffiliate(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
