'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type EmpleadoDetalle = {
  nivel: string
  puntaje_actual: number
  estado_disponibilidad: string
  inactividades_totales: number
}

type Empleado = {
  id: string
  email: string
  nombre: string
  telefono: string
  estado: string
  fecha_creacion: string
  tieneClave: boolean
  EMPLEADOS: EmpleadoDetalle | EmpleadoDetalle[] | null
}

const NIVELES = ['basico', 'intermedio', 'avanzado', 'administrador']

const DISPONIBILIDAD_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  disponible:    { label: 'Disponible',    color: '#059669', bg: '#ECFDF5', dot: '#10b981' },
  ocupado:       { label: 'Ocupado',       color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  no_disponible: { label: 'No disponible', color: '#64748b', bg: '#F1F5F9', dot: '#94a3b8' },
}

function empleadoDetalle(e: Empleado): EmpleadoDetalle | null {
  if (!e.EMPLEADOS) return null
  return Array.isArray(e.EMPLEADOS) ? e.EMPLEADOS[0] ?? null : e.EMPLEADOS
}

type ClienteRef = { nombre: string; email: string }
type EmpleadoRef = { nivel: string; usuarios: { id: string; nombre: string } | { id: string; nombre: string }[] | null }

type Orden = {
  id: string
  tipo_servicio: string
  estado: string
  es_urgente: boolean
  notas: string | null
  fecha_creacion: string
  fecha_asignacion: string | null
  usuarios: ClienteRef | ClienteRef[] | null
  EMPLEADOS: EmpleadoRef | EmpleadoRef[] | null
}

const ESTADO_ORDEN_META: Record<string, { label: string; color: string; bg: string }> = {
  asignada:    { label: 'Asignada',    color: '#d97706', bg: '#fffbeb' },
  en_progreso: { label: 'En progreso', color: '#2563EB', bg: '#eff6ff' },
  completada:  { label: 'Completada',  color: '#059669', bg: '#ECFDF5' },
  pendiente:   { label: 'Sin asignar', color: '#64748b', bg: '#F1F5F9' },
}

function unwrap<T>(v: T | T[] | null): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function nombreEmpleadoDe(o: Orden): string {
  const emp = unwrap(o.EMPLEADOS)
  if (!emp) return '—'
  const usr = unwrap(emp.usuarios)
  return usr?.nombre ?? '—'
}

function usuarioIdEmpleadoDe(o: Orden): string {
  const emp = unwrap(o.EMPLEADOS)
  if (!emp) return ''
  const usr = unwrap(emp.usuarios)
  return usr?.id ?? ''
}

export default function OpabizAdminPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null)

  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [telefono, setTelefono] = useState('')
  const [nivel, setNivel]       = useState('basico')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [togglingEstadoId, setTogglingEstadoId] = useState<string | null>(null)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)
  const [reasignando, setReasignando] = useState<Orden | null>(null)
  const [reasignEmpleadoId, setReasignEmpleadoId] = useState('')
  const [reasignSaving, setReasignSaving] = useState(false)
  const [reasignMsg, setReasignMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [noteEdit, setNoteEdit] = useState<{ id: string; label: string; text: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)

  // silent=true se usa en el polling de fondo — no muestra el spinner de
  // "Cargando…" para no repintar la tabla cada 20s, mismo patrón que
  // /admin (OrdersTable.tsx) y /admin/orders/[id].
  const cargarEmpleados = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await fetch('/api/opabiz/employees')
    if (res.ok) {
      const data = await res.json()
      setEmpleados(data.empleados ?? [])
    }
    if (!silent) setLoading(false)
  }, [])

  const cargarOrdenes = useCallback(async (silent = false) => {
    if (!silent) setLoadingOrdenes(true)
    const res = await fetch('/api/opabiz/orders')
    if (res.ok) {
      const data = await res.json()
      setOrdenes(data.ordenes ?? [])
    }
    if (!silent) setLoadingOrdenes(false)
  }, [])

  useEffect(() => { cargarEmpleados(); cargarOrdenes() }, [cargarEmpleados, cargarOrdenes])

  // Polling en segundo plano cada 20s — la disponibilidad/puntaje/estado de
  // las órdenes cambian desde la propia PWA del empleado, no desde acá, así
  // que sin esto el admin no lo ve hasta recargar la página a mano.
  useEffect(() => {
    const interval = setInterval(() => { cargarEmpleados(true); cargarOrdenes(true) }, 20000)
    return () => clearInterval(interval)
  }, [cargarEmpleados, cargarOrdenes])

  async function crearEmpleado(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/opabiz/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, nivel }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg({ ok: true, text: `Empleado "${nombre}" creado correctamente.` })
      setNombre(''); setEmail(''); setTelefono(''); setNivel('basico')
      setShowForm(false)
      cargarEmpleados()
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg({ ok: false, text: d.error ?? 'No se pudo crear el empleado.' })
    }
  }

  async function toggleEstado(usuarioId: string, estadoActual: string, nombre: string) {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo'
    const accion = nuevoEstado === 'inactivo' ? 'desactivar' : 'reactivar'
    if (!confirm(`¿Seguro que querés ${accion} a ${nombre}?`)) return
    setTogglingEstadoId(usuarioId)
    const res = await fetch(`/api/opabiz/employees/${usuarioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    setTogglingEstadoId(null)
    if (res.ok) {
      setEmpleados(prev => prev.map(e => e.id === usuarioId ? { ...e, estado: nuevoEstado } : e))
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg({ ok: false, text: d.error ?? 'No se pudo cambiar el estado.' })
    }
  }

  function abrirReasignar(o: Orden) {
    setReasignando(o)
    setReasignEmpleadoId(usuarioIdEmpleadoDe(o))
    setReasignMsg(null)
  }

  async function confirmarReasignar() {
    if (!reasignando || !reasignEmpleadoId) return
    setReasignSaving(true)
    setReasignMsg(null)
    const res = await fetch(`/api/opabiz/orders/${reasignando.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: reasignEmpleadoId }),
    })
    setReasignSaving(false)
    if (res.ok) {
      setReasignando(null)
      cargarOrdenes()
    } else {
      const d = await res.json().catch(() => ({}))
      setReasignMsg({ ok: false, text: d.error ?? 'No se pudo reasignar la orden.' })
    }
  }

  async function saveNote() {
    if (!noteEdit) return
    setSavingNote(true)
    const res = await fetch(`/api/opabiz/orders/${noteEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas: noteEdit.text }),
    })
    setSavingNote(false)
    if (res.ok) {
      const cleaned = noteEdit.text.trim() || null
      setOrdenes(prev => prev.map(o => o.id === noteEdit.id ? { ...o, notas: cleaned } : o))
      setNoteEdit(null)
    } else {
      alert('No se pudo guardar la nota.')
    }
  }

  async function reenviarInvitacion(usuarioId: string) {
    setResendingId(usuarioId)
    const res = await fetch(`/api/opabiz/employees/${usuarioId}/resend-invite`, { method: 'POST' })
    setResendingId(null)
    if (res.ok) {
      setMsg({ ok: true, text: 'Invitación reenviada.' })
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg({ ok: false, text: d.error ?? 'No se pudo reenviar la invitación.' })
    }
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .wrap{max-width:1280px;margin:0 auto;padding:28px 24px}
        .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 4px rgba(28,46,68,.05);overflow:hidden;margin-bottom:24px}
        .card-head{padding:16px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .card-title{font-size:.95rem;font-weight:700;color:#1C2E44}
        .btn{padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-primary{background:#2563EB;color:#fff}
        .btn-primary:hover:not(:disabled){background:#1d4ed8}
        table{width:100%;border-collapse:collapse}
        th{padding:10px 14px;font-size:.72rem;font-weight:700;color:#94A3B8;text-align:left;text-transform:uppercase;letter-spacing:.5px;background:#F8FAFC;border-bottom:1px solid #E2E8F0}
        td{padding:12px 14px;font-size:.82rem;color:#374151;border-bottom:1px solid #F1F5F9;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#FAFBFC}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700}
        .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:22px}
        @media(max-width:640px){.form-grid{grid-template-columns:1fr}}
        .form-field label{display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:5px}
        .form-field input,.form-field select{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;font-family:inherit;color:#1E293B;outline:none}
        .form-field input:focus,.form-field select:focus{border-color:#2563EB}
        .form-actions{padding:0 22px 22px;display:flex;align-items:center;gap:12px}
        .msg-ok{color:#059669;font-size:.78rem;font-weight:600}
        .msg-err{color:#ef4444;font-size:.78rem;font-weight:600}
        .empty{padding:40px 22px;text-align:center;color:#94A3B8;font-size:.85rem}
        @media(max-width:768px){
          .wrap{padding:18px 14px}
          .card-head{padding:14px 16px}
          .form-grid{padding:18px 14px}
          th,td{padding:8px 10px}
        }
      `}</style>

      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>OpaBiz Connect</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>OpaBiz Connect — Empleados</h1>
            <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>Gestión de empleados internos y su estado de asignación</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancelar' : '+ Crear Empleado'}
          </button>
        </div>

        {showForm && (
          <div className="card">
            <div className="card-head"><span className="card-title">Nuevo empleado</span></div>
            <form onSubmit={crearEmpleado}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre completo</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label>Teléfono</label>
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label>Nivel jerárquico</label>
                  <select value={nivel} onChange={e => setNivel(e.target.value)}>
                    {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear empleado'}
                </button>
                {msg && <span className={msg.ok ? 'msg-ok' : 'msg-err'}>{msg.text}</span>}
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="card-head"><span className="card-title">Empleados ({empleados.length})</span></div>
          {loading ? (
            <div className="empty">Cargando…</div>
          ) : empleados.length === 0 ? (
            <div className="empty">Todavía no hay ningún empleado cargado.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Nivel</th>
                  <th>Puntaje</th>
                  <th>Disponibilidad</th>
                  <th>Inactividades</th>
                  <th>Acceso</th>
                  <th>Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map(emp => {
                  const det = empleadoDetalle(emp)
                  const disp = DISPONIBILIDAD_META[det?.estado_disponibilidad ?? ''] ?? DISPONIBILIDAD_META.no_disponible
                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, color: '#1C2E44' }}>{emp.nombre}</td>
                      <td>{emp.email}</td>
                      <td>{emp.telefono}</td>
                      <td>{det?.nivel ?? '—'}</td>
                      <td>{det?.puntaje_actual ?? 0}</td>
                      <td>
                        <span className="badge" style={{ color: disp.color, background: disp.bg }}>
                          <span className="dot" style={{ background: disp.dot }} />
                          {disp.label}
                        </span>
                      </td>
                      <td>{det?.inactividades_totales ?? 0}</td>
                      <td>
                        {emp.tieneClave ? (
                          <span className="badge" style={{ color: '#059669', background: '#ECFDF5' }}>Activo</span>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: '.72rem' }}
                            disabled={resendingId === emp.id}
                            onClick={() => reenviarInvitacion(emp.id)}
                          >
                            {resendingId === emp.id ? 'Enviando…' : '📧 Reenviar invitación'}
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge" style={emp.estado === 'activo' ? { color: '#059669', background: '#ECFDF5' } : { color: '#dc2626', background: '#FEF2F2' }}>
                            {emp.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                          <button
                            className="btn"
                            style={{ padding: '5px 10px', fontSize: '.72rem', border: '1.5px solid #E2E8F0', background: '#fff', color: '#374151' }}
                            disabled={togglingEstadoId === emp.id}
                            onClick={() => toggleEstado(emp.id, emp.estado, emp.nombre)}
                          >
                            {togglingEstadoId === emp.id ? '…' : emp.estado === 'activo' ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Órdenes ({ordenes.length})</span></div>
          {loadingOrdenes ? (
            <div className="empty">Cargando…</div>
          ) : ordenes.length === 0 ? (
            <div className="empty">Todavía no hay ninguna orden creada.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo de servicio</th>
                  <th>Asignada a</th>
                  <th>Estado</th>
                  <th>Urgente</th>
                  <th>Creada</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map(o => {
                  const cliente = unwrap(o.usuarios)
                  const meta = ESTADO_ORDEN_META[o.estado] ?? ESTADO_ORDEN_META.pendiente
                  return (
                    <tr key={o.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1C2E44' }}>{cliente?.nombre ?? '—'}</div>
                        <div style={{ fontSize: '.75rem', color: '#94A3B8' }}>{cliente?.email ?? ''}</div>
                      </td>
                      <td>{o.tipo_servicio}</td>
                      <td style={{ fontWeight: 600 }}>{nombreEmpleadoDe(o)}</td>
                      <td>
                        <span className="badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                      </td>
                      <td>{o.es_urgente ? '⚡ Sí' : '—'}</td>
                      <td>{new Date(o.fecha_creacion).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn"
                          title={o.notas ? o.notas : 'Agregar nota'}
                          style={{ padding: '4px', background: 'none', border: 'none' }}
                          onClick={() => setNoteEdit({ id: o.id, label: `${cliente?.nombre ?? '—'} — ${o.tipo_servicio}`, text: o.notas ?? '' })}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={o.notas ? '#f59e0b' : 'none'} stroke={o.notas ? '#f59e0b' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: '.72rem', border: '1.5px solid #E2E8F0', background: '#fff', color: '#374151' }}
                          onClick={() => abrirReasignar(o)}
                        >
                          {nombreEmpleadoDe(o) === '—' ? 'Asignar' : 'Reasignar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {reasignando && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1C2E44', marginBottom: 4 }}>
                {nombreEmpleadoDe(reasignando) === '—' ? 'Asignar orden' : 'Reasignar orden'}
              </h3>
              <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 16 }}>
                {unwrap(reasignando.usuarios)?.nombre ?? '—'} — {reasignando.tipo_servicio}
              </p>

              <div className="form-field" style={{ marginBottom: 12 }}>
                <label>Asignar a *</label>
                <select value={reasignEmpleadoId} onChange={e => setReasignEmpleadoId(e.target.value)}>
                  <option value="">— Elegir empleado —</option>
                  {empleados.filter(e => e.estado === 'activo').map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              {reasignMsg && <p style={{ fontSize: '.8rem', marginBottom: 12, color: reasignMsg.ok ? '#059669' : '#dc2626' }}>{reasignMsg.text}</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#6b7280' }}
                  onClick={() => setReasignando(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!reasignEmpleadoId || reasignSaving}
                  onClick={confirmarReasignar}
                >
                  {reasignSaving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {noteEdit && (
          <div onClick={() => !savingNote && setNoteEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1C2E44', marginBottom: 4 }}>📝 Nota interna</h3>
              <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 16 }}>{noteEdit.label}</p>
              <textarea
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: '.85rem', fontFamily: 'inherit', color: '#1E293B', outline: 'none', minHeight: 100, resize: 'vertical', boxSizing: 'border-box' }}
                value={noteEdit.text}
                onChange={e => setNoteEdit({ ...noteEdit, text: e.target.value })}
                placeholder="Instrucciones o contexto para el empleado…"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button
                  className="btn"
                  style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#6b7280' }}
                  onClick={() => setNoteEdit(null)}
                  disabled={savingNote}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={saveNote} disabled={savingNote}>
                  {savingNote ? 'Guardando…' : 'Guardar nota'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
