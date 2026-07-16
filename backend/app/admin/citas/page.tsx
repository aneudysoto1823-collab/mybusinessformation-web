'use client'

import { useState, useEffect, useCallback } from 'react'

interface Appointment {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  date: string
  time: string
  note: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  meeting_method: 'phone' | 'whatsapp' | null
}

interface BlockedSlot {
  id: string
  date: string
  time: string | null
  reason: string | null
}

interface EmpleadoOption {
  id: string // usuarios.id
  nombre: string
}

const ALL_SLOTS = [
  '09:00','09:40','10:20','11:00','11:40',
  '12:20','13:00','13:40','14:20','15:00',
  '15:40','16:20','17:00','17:40','18:20',
]

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'background:#fef3c7;color:#92400e',
  confirmed: 'background:#d1fae5;color:#065f46',
  cancelled: 'background:#fee2e2;color:#991b1b',
}

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blocked, setBlocked] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking] = useState(false)
  const [tab, setTab] = useState<'appointments' | 'blocked'>('appointments')

  // Crear orden de OpaBiz Connect a partir de una cita (manual, ver
  // LOGICA_DE_NEGOCIO/17). `linkedAppointmentIds` evita crear duplicados.
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([])
  const [linkedAppointmentIds, setLinkedAppointmentIds] = useState<Set<string>>(new Set())
  const [creatingFor, setCreatingFor] = useState<Appointment | null>(null)
  const [orderTipoServicio, setOrderTipoServicio] = useState('Consulta agendada')
  const [orderNotas, setOrderNotas] = useState('')
  const [orderEsUrgente, setOrderEsUrgente] = useState(false)
  const [orderEmpleadoId, setOrderEmpleadoId] = useState('')
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [orderMsg, setOrderMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Nota interna de la cita (appointments.note) — mismo patrón 📝 que /admin y
  // /admin/campaigns. Distinto de orderNotas de arriba (esa es la nota de la
  // orden de OpaBiz Connect, ordenes_opabiz.notas).
  const [noteEdit, setNoteEdit] = useState<{ id: string; label: string; text: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [apptRes, blockedRes, empleadosRes, ordenesRes] = await Promise.all([
      fetch('/api/booking/appointments'),
      fetch('/api/booking/blocked'),
      fetch('/api/opabiz/employees'),
      fetch('/api/opabiz/orders'),
    ])
    setAppointments(await apptRes.json())
    setBlocked(await blockedRes.json())
    if (empleadosRes.ok) {
      const d = await empleadosRes.json()
      setEmpleados((d.empleados ?? []).map((e: { id: string; nombre: string }) => ({ id: e.id, nombre: e.nombre })))
    }
    if (ordenesRes.ok) {
      const d = await ordenesRes.json()
      setLinkedAppointmentIds(new Set((d.ordenes ?? []).map((o: { appointment_id: string | null }) => o.appointment_id).filter(Boolean)))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreateOrder(a: Appointment) {
    setCreatingFor(a)
    setOrderTipoServicio('Consulta agendada')
    setOrderNotas(a.note || '')
    setOrderEsUrgente(false)
    setOrderEmpleadoId('')
    setOrderMsg(null)
  }

  async function submitCreateOrder() {
    if (!creatingFor || !orderEmpleadoId) return
    setCreatingOrder(true)
    setOrderMsg(null)
    const res = await fetch('/api/opabiz/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteEmail: creatingFor.email,
        clienteNombre: creatingFor.name,
        clienteTelefono: creatingFor.phone,
        tipoServicio: orderTipoServicio,
        esUrgente: orderEsUrgente,
        fechaHoraCita: `${creatingFor.date}T${creatingFor.time}:00`,
        notas: orderNotas,
        appointmentId: creatingFor.id,
        empleadoUsuarioId: orderEmpleadoId,
      }),
    })
    setCreatingOrder(false)
    if (res.ok) {
      setLinkedAppointmentIds(prev => new Set(prev).add(creatingFor.id))
      setOrderMsg({ ok: true, text: 'Orden creada y asignada.' })
      setTimeout(() => setCreatingFor(null), 1200)
    } else {
      const d = await res.json().catch(() => ({}))
      setOrderMsg({ ok: false, text: d.error ?? 'No se pudo crear la orden.' })
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/booking/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a))
  }

  async function saveNote() {
    if (!noteEdit) return
    setSavingNote(true)
    const res = await fetch(`/api/booking/appointments/${noteEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteEdit.text }),
    })
    setSavingNote(false)
    if (res.ok) {
      const cleaned = noteEdit.text.trim() || null
      setAppointments(prev => prev.map(a => a.id === noteEdit.id ? { ...a, note: cleaned } : a))
      setNoteEdit(null)
    } else {
      alert('No se pudo guardar la nota.')
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Delete this appointment?')) return
    await fetch(`/api/booking/appointments/${id}`, { method: 'DELETE' })
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  async function addBlock() {
    if (!blockDate) return
    setBlocking(true)
    const res = await fetch('/api/booking/blocked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: blockDate, time: blockTime || null, reason: blockReason || null }),
    })
    const data = await res.json()
    setBlocked(prev => [...prev, data])
    setBlockDate(''); setBlockTime(''); setBlockReason('')
    setBlocking(false)
  }

  async function removeBlock(id: string) {
    await fetch(`/api/booking/blocked/${id}`, { method: 'DELETE' })
    setBlocked(prev => prev.filter(b => b.id !== id))
  }

  const filtered = appointments.filter(a => filter === 'all' || a.status === filter)
  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.date + 'T23:59:59') >= new Date())
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled')

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: var(--font-sans); }
        .pg { max-width: 1000px; margin: 0 auto; padding: 32px 24px 80px; }
        .pg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .pg-title { font-size: 1.3rem; font-weight: 800; color: #1a1a2e; }
        .pg-title span { display: block; font-size: 0.8rem; font-weight: 400; color: #6b7280; margin-top: 2px; }
        .btn-back { color: #6b7280; font-size: 0.85rem; text-decoration: none; }
        .btn-back:hover { color: #2563EB; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
        .stat-card { background: #fff; border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .stat-val { font-size: 1.6rem; font-weight: 800; color: #1a1a2e; }
        .stat-label { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
        .tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .tab { padding: 10px 18px; background: none; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
        .tab.active { color: #2563EB; border-bottom-color: #2563EB; }
        .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #6b7280; }
        .filter-btn.active { background: #1C2E44; color: #fff; border-color: #1C2E44; }
        .appt-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .appt-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .appt-table td { padding: 14px 16px; font-size: 0.85rem; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .appt-table tr:last-child td { border-bottom: none; }
        .appt-table tr:hover td { background: #f9fafb; }
        .status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
        .action-btn { padding: 5px 12px; border-radius: 6px; border: 1.5px solid; font-size: 0.78rem; font-weight: 600; cursor: pointer; background: #fff; margin-right: 4px; }
        .action-btn:hover { opacity: 0.8; }
        .wa-link { color: #25D366; text-decoration: none; font-weight: 600; font-size: 0.8rem; }
        .wa-link:hover { text-decoration: underline; }
        /* Block form */
        .block-form { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 20px; }
        .block-form h3 { font-size: 0.9rem; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
        .block-row { display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 12px; align-items: end; }
        .block-input { padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.85rem; font-family: inherit; width: 100%; }
        .block-input:focus { outline: none; border-color: #2563EB; }
        .block-label { font-size: 0.78rem; font-weight: 600; color: #6b7280; display: block; margin-bottom: 5px; }
        .btn-block { background: #1C2E44; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .btn-block:hover { background: #2d3f5c; }
        .blocked-list { display: flex; flex-direction: column; gap: 8px; }
        .blocked-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); gap: 12px; }
        .blocked-info { font-size: 0.85rem; color: #374151; }
        .blocked-info strong { color: #1a1a2e; }
        .btn-remove { background: none; border: 1.5px solid #fee2e2; color: #991b1b; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer; }
        .btn-remove:hover { background: #fee2e2; }
        .empty-state { text-align: center; padding: 40px; color: #9ca3af; font-size: 0.9rem; }
        .btn-booking { display: inline-flex; align-items: center; gap: 6px; background: #2563EB; color: #fff; padding: 9px 18px; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
        @media(max-width: 700px) {
          .stats { grid-template-columns: repeat(3, 1fr); }
          .block-row { grid-template-columns: 1fr 1fr; }
          .appt-table { display: block; overflow-x: auto; }
        }
      `}</style>

      <div className="pg">
        <div className="pg-header">
          <div>
            <a href="/admin" className="btn-back">← Admin</a>
            <h1 className="pg-title" style={{ marginTop: '4px' }}>
              Citas / Appointments
              <span>Gestión de consultas agendadas</span>
            </h1>
          </div>
          <a href="/booking" target="_blank" rel="noopener noreferrer" className="btn-booking">
            📅 Ver Página de Citas
          </a>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-val">{todayAppts.length}</div>
            <div className="stat-label">Citas hoy</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{upcoming.length}</div>
            <div className="stat-label">Próximas citas</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{appointments.filter(a => a.status === 'pending').length}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab${tab === 'appointments' ? ' active' : ''}`} onClick={() => setTab('appointments')}>
            Citas ({appointments.length})
          </button>
          <button className={`tab${tab === 'blocked' ? ' active' : ''}`} onClick={() => setTab('blocked')}>
            Horarios Bloqueados ({blocked.length})
          </button>
        </div>

        {tab === 'appointments' && (
          <>
            <div className="filters">
              {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'confirmed' ? 'Confirmadas' : 'Canceladas'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="empty-state">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No hay citas {filter !== 'all' ? `con estado "${filter}"` : ''}.</div>
            ) : (
              <table className="appt-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha y Hora</th>
                    <th>Reunión</th>
                    <th>Nota</th>
                    <th>Estado</th>
                    <th>Contacto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const waText = encodeURIComponent(`Hola ${a.name}, te contactamos de OpaBiz sobre tu consulta del ${formatDate(a.date)} a las ${formatTime(a.time)}.`)
                    const waLink = a.phone ? `https://wa.me/${a.phone.replace(/\D/g, '')}?text=${waText}` : null
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{a.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{a.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatDate(a.date)}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{formatTime(a.time)}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {a.meeting_method === 'whatsapp' ? '💬 WhatsApp' : '📞 Phone'}
                        </td>
                        <td style={{ maxWidth: '180px' }}>
                          <button
                            onClick={() => setNoteEdit({ id: a.id, label: `${a.name} — ${formatDate(a.date)} ${formatTime(a.time)}`, text: a.note || '' })}
                            title={a.note || 'Agregar nota'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: '0.8rem', color: a.note ? '#374151' : '#9ca3af', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                          >
                            {a.note ? `📝 ${a.note}` : '+ Agregar nota'}
                          </button>
                        </td>
                        <td>
                          <span className="status-pill" style={{ ...Object.fromEntries(STATUS_COLORS[a.status].split(';').map(s => s.split(':').map(x => x.trim()))) }}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <a href={`mailto:${a.email}`} style={{ fontSize: '0.78rem', color: '#2563EB' }}>✉️ Email</a>
                            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="wa-link">💬 WhatsApp</a>}
                          </div>
                        </td>
                        <td>
                          {a.status !== 'confirmed' && (
                            <button className="action-btn" style={{ borderColor: '#d1fae5', color: '#065f46' }} onClick={() => updateStatus(a.id, 'confirmed')}>✓ Confirm</button>
                          )}
                          {a.status !== 'cancelled' && (
                            <button className="action-btn" style={{ borderColor: '#fee2e2', color: '#991b1b' }} onClick={() => updateStatus(a.id, 'cancelled')}>✕ Cancel</button>
                          )}
                          <button className="action-btn" style={{ borderColor: '#e5e7eb', color: '#6b7280' }} onClick={() => deleteAppointment(a.id)}>🗑</button>
                          <button
                            className="action-btn"
                            style={{ borderColor: '#bfdbfe', color: '#2563EB' }}
                            disabled={linkedAppointmentIds.has(a.id)}
                            onClick={() => openCreateOrder(a)}
                          >
                            {linkedAppointmentIds.has(a.id) ? '✓ Orden creada' : '🧭 Crear orden OpaBiz Connect'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === 'blocked' && (
          <>
            <div className="block-form">
              <h3>🚫 Bloquear horario o día completo</h3>
              <div className="block-row">
                <div>
                  <label className="block-label">Fecha *</label>
                  <input type="date" className="block-input" value={blockDate} onChange={e => setBlockDate(e.target.value)} />
                </div>
                <div>
                  <label className="block-label">Hora (vacío = día completo)</label>
                  <select className="block-input" value={blockTime} onChange={e => setBlockTime(e.target.value)}>
                    <option value="">— Día completo —</option>
                    {ALL_SLOTS.map(s => <option key={s} value={s}>{formatTime(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block-label">Motivo (opcional)</label>
                  <input className="block-input" placeholder="ej. Vacaciones, reunión interna..." value={blockReason} onChange={e => setBlockReason(e.target.value)} />
                </div>
                <button className="btn-block" onClick={addBlock} disabled={!blockDate || blocking}>
                  {blocking ? '...' : 'Bloquear'}
                </button>
              </div>
            </div>

            {blocked.length === 0 ? (
              <div className="empty-state">No hay horarios bloqueados.</div>
            ) : (
              <div className="blocked-list">
                {blocked.map(b => (
                  <div key={b.id} className="blocked-item">
                    <div className="blocked-info">
                      <strong>{formatDate(b.date)}</strong>
                      {b.time ? ` · ${formatTime(b.time)}` : ' · Día completo'}
                      {b.reason && <span style={{ color: '#6b7280', marginLeft: '8px' }}>— {b.reason}</span>}
                    </div>
                    <button className="btn-remove" onClick={() => removeBlock(b.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {creatingFor && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1C2E44', marginBottom: 4 }}>Crear orden OpaBiz Connect</h3>
              <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 16 }}>{creatingFor.name} — {formatDate(creatingFor.date)} {formatTime(creatingFor.time)}</p>

              <label className="block-label">Tipo de servicio</label>
              <input className="block-input" style={{ marginBottom: 12 }} value={orderTipoServicio} onChange={e => setOrderTipoServicio(e.target.value)} />

              <label className="block-label">Notas</label>
              <textarea className="block-input" style={{ marginBottom: 12, minHeight: 70, resize: 'vertical' }} value={orderNotas} onChange={e => setOrderNotas(e.target.value)} />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', color: '#374151', marginBottom: 12 }}>
                <input type="checkbox" checked={orderEsUrgente} onChange={e => setOrderEsUrgente(e.target.checked)} />
                Urgente
              </label>

              <label className="block-label">Asignar a *</label>
              <select className="block-input" style={{ marginBottom: 16 }} value={orderEmpleadoId} onChange={e => setOrderEmpleadoId(e.target.value)}>
                <option value="">— Elegir empleado —</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>

              {orderMsg && (
                <p style={{ fontSize: '.8rem', marginBottom: 12, color: orderMsg.ok ? '#059669' : '#dc2626' }}>{orderMsg.text}</p>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="action-btn" style={{ borderColor: '#e5e7eb', color: '#6b7280' }} onClick={() => setCreatingFor(null)}>Cancelar</button>
                <button className="btn-block" disabled={!orderEmpleadoId || creatingOrder} onClick={submitCreateOrder}>
                  {creatingOrder ? 'Creando…' : 'Crear y asignar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {noteEdit && (
          <div onClick={() => !savingNote && setNoteEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>📝 Nota de la cita</h3>
              <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 16 }}>{noteEdit.label}</p>
              <textarea
                className="block-input"
                style={{ minHeight: 100, resize: 'vertical' }}
                value={noteEdit.text}
                onChange={e => setNoteEdit({ ...noteEdit, text: e.target.value })}
                placeholder="Ej: Cliente preguntó por EIN, quiere que lo llamen antes de la cita..."
                autoFocus
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button className="action-btn" style={{ borderColor: '#e5e7eb', color: '#6b7280' }} onClick={() => setNoteEdit(null)} disabled={savingNote}>Cancelar</button>
                <button className="btn-block" onClick={saveNote} disabled={savingNote}>{savingNote ? 'Guardando…' : 'Guardar nota'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
