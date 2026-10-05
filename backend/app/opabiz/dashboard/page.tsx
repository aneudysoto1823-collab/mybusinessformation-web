'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Me = {
  nombre: string
  email: string
  nivel: string
  puntajeActual: number
  estadoDisponibilidad: string
  tier: string | null
}

type Orden = {
  id: string
  tipo_servicio: string
  estado: string
  es_urgente: boolean
  notas: string | null
  fecha_hora_cita: string | null
  fecha_creacion: string
  fecha_asignacion: string | null
  usuarios: { nombre: string; email: string; telefono: string } | { nombre: string; email: string; telefono: string }[] | null
}

const ESTADO_META: Record<string, { label: string; color: string; bg: string }> = {
  asignada:    { label: 'Nueva — aceptar',  color: '#d97706', bg: '#fffbeb' },
  en_progreso: { label: 'En progreso',      color: '#2563EB', bg: '#eff6ff' },
  completada:  { label: 'Completada',       color: '#059669', bg: '#ECFDF5' },
  pendiente:   { label: 'Sin asignar',      color: '#64748b', bg: '#F1F5F9' },
}

function clienteDe(o: Orden) {
  if (!o.usuarios) return null
  return Array.isArray(o.usuarios) ? o.usuarios[0] ?? null : o.usuarios
}

// Boilerplate estándar de Web Push: la VAPID public key viene en base64url,
// pero pushManager.subscribe() exige un Uint8Array — no hay forma de saltarse
// esta conversión, es parte del spec.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function OpabizDashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingDisp, setTogglingDisp] = useState(false)
  // 'checking' mientras se lee el estado real del navegador; 'unsupported' =
  // sin Web Push (ej. iPhone sin la app instalada en pantalla de inicio).
  const [pushState, setPushState] = useState<'checking' | 'unsupported' | 'denied' | 'on' | 'off'>('checking')
  const [subscribingPush, setSubscribingPush] = useState(false)
  const [pushStatus, setPushStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const cargar = useCallback(async () => {
    const [meRes, ordersRes] = await Promise.all([
      fetch('/api/opabiz/auth/me'),
      fetch('/api/opabiz/me/orders'),
    ])
    if (meRes.status === 401) {
      router.push('/opabiz/login')
      return
    }
    if (meRes.ok) setMe(await meRes.json())
    if (ordersRes.ok) setOrdenes((await ordersRes.json()).ordenes ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  // Estado del interruptor de notificaciones: lo que manda es si ESTE
  // dispositivo tiene una suscripción push activa, no solo el permiso. iOS
  // Safari solo soporta push si la PWA está instalada en pantalla de inicio
  // (iOS 16.4+).
  useEffect(() => {
    async function leerEstadoPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setPushState('unsupported'); return
      }
      if (Notification.permission === 'denied') { setPushState('denied'); return }
      if (Notification.permission !== 'granted') { setPushState('off'); return }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/opabiz-sw.js')
        const sub = reg ? await reg.pushManager.getSubscription() : null
        setPushState(sub ? 'on' : 'off')
      } catch {
        setPushState('off')
      }
    }
    leerEstadoPush()
  }, [])

  // Cada falla muestra su motivo en pantalla: antes fallaba en silencio y no
  // había forma de saber si faltaba la clave VAPID, la migración o el permiso.
  async function activarNotificaciones() {
    setSubscribingPush(true)
    setPushStatus(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setPushState(permiso === 'denied' ? 'denied' : 'off')
        setPushStatus({ ok: false, msg: 'El navegador no dio permiso para notificaciones. Podés activarlo en la configuración del navegador.' })
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setPushStatus({ ok: false, msg: 'Falta configurar la clave de notificaciones en el servidor (NEXT_PUBLIC_VAPID_PUBLIC_KEY).' })
        return
      }

      const registration = await navigator.serviceWorker.register('/opabiz-sw.js')
      await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const res = await fetch('/api/opabiz/me/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        await subscription.unsubscribe().catch(() => {})
        setPushStatus({ ok: false, msg: `No se pudo guardar la suscripción: ${data.error || res.status}` })
        return
      }
      setPushState('on')
    } catch (err) {
      console.error('[opabiz] activarNotificaciones error:', err)
      setPushStatus({ ok: false, msg: `No se pudieron activar las notificaciones: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSubscribingPush(false)
    }
  }

  // Apaga solo ESTE dispositivo: borra la suscripción del navegador y su fila
  // en la base. Si el empleado tiene la app en otro celular, ahí sigue llegando.
  async function desactivarNotificaciones() {
    setSubscribingPush(true)
    setPushStatus(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/opabiz-sw.js')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        await fetch('/api/opabiz/me/push-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setPushState('off')
    } catch (err) {
      console.error('[opabiz] desactivarNotificaciones error:', err)
      setPushStatus({ ok: false, msg: `No se pudieron desactivar las notificaciones: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSubscribingPush(false)
    }
  }

  async function toggleDisponibilidad() {
    if (!me) return
    const nuevo = me.estadoDisponibilidad === 'disponible' ? 'no_disponible' : 'disponible'
    setTogglingDisp(true)
    const res = await fetch('/api/opabiz/me/disponibilidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevo }),
    })
    if (res.ok) setMe(prev => prev && { ...prev, estadoDisponibilidad: nuevo })
    setTogglingDisp(false)
  }

  async function cambiarPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwdStatus(null)
    if (newPwd.length < 8) { setPwdStatus({ ok: false, msg: 'La contraseña nueva debe tener al menos 8 caracteres.' }); return }
    if (newPwd !== confirmPwd) { setPwdStatus({ ok: false, msg: 'Las contraseñas nuevas no coinciden.' }); return }
    setSavingPwd(true)
    try {
      const res = await fetch('/api/opabiz/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setPwdStatus({ ok: false, msg: data.error ?? 'No se pudo cambiar la contraseña.' }); return }
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setShowPwdForm(false)
      setPwdStatus({ ok: true, msg: 'Contraseña actualizada. Usala la próxima vez que ingreses.' })
    } catch {
      setPwdStatus({ ok: false, msg: 'Error de conexión. Intentá de nuevo.' })
    } finally {
      setSavingPwd(false)
    }
  }

  async function logout() {
    await fetch('/api/opabiz/auth/logout', { method: 'POST' })
    router.push('/opabiz/login')
  }

  const disponible = me?.estadoDisponibilidad === 'disponible'

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .op-header{background:#1C2E44;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
        .op-brand{color:#fff;font-weight:800;font-size:1.05rem}
        .op-brand span{color:#60A5FA}
        .op-logout{background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff;font-size:.72rem;padding:6px 10px;border-radius:6px;cursor:pointer}
        .op-wrap{max-width:640px;margin:0 auto;padding:16px}
        .op-me{background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #E2E8F0}
        .op-me-name{font-weight:700;color:#1C2E44;font-size:.95rem}
        .op-me-stats{display:flex;gap:16px;margin-top:6px;font-size:.78rem;color:#64748B}
        .op-disp-btn{width:100%;margin-top:12px;padding:12px;border-radius:8px;border:none;font-weight:700;font-size:.85rem;cursor:pointer;min-height:44px}
        .op-disp-on{background:#ECFDF5;color:#059669}
        .op-disp-off{background:#F1F5F9;color:#64748B}
        .op-section-title{font-size:.78rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:18px 0 10px}
        .op-card{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;border:1px solid #E2E8F0;text-decoration:none;display:block}
        .op-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
        .op-servicio{font-weight:700;color:#1C2E44;font-size:.9rem}
        .op-badge{padding:3px 9px;border-radius:20px;font-size:.68rem;font-weight:700;white-space:nowrap}
        .op-urgente{color:#dc2626;font-size:.7rem;font-weight:700;margin-bottom:4px}
        .op-cliente{color:#374151;font-size:.82rem}
        .op-fecha{color:#94A3B8;font-size:.74rem;margin-top:4px}
        .op-nota{color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:6px 8px;font-size:.78rem;margin-top:6px}
        .op-empty{text-align:center;color:#94A3B8;font-size:.85rem;padding:40px 20px}
        .op-intake-link{display:block;text-align:center;background:#EFF6FF;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:10px;padding:13px;font-weight:700;font-size:.85rem;text-decoration:none;margin-bottom:16px;min-height:44px}
        .op-intake-link-secondary{background:#F8FAFC;color:#475569;border-color:#E2E8F0}
        .op-notif-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;min-height:44px}
        .op-notif-label{font-size:.82rem;font-weight:600;color:#1C2E44}
        .op-notif-hint{font-size:.72rem;color:#94A3B8;margin-top:2px;line-height:1.35}
        .op-switch{position:relative;width:44px;height:26px;border-radius:13px;border:none;background:#CBD5E1;cursor:pointer;flex-shrink:0;transition:background .15s}
        .op-switch::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .15s}
        .op-switch.on{background:#059669}
        .op-switch.on::after{transform:translateX(18px)}
        .op-switch:disabled{opacity:.5;cursor:not-allowed}
        .op-push-ok,.op-push-err{font-size:.8rem;font-weight:600;line-height:1.4;border-radius:10px;padding:10px 14px;margin-bottom:16px}
        .op-push-ok{background:#ECFDF5;border:1.5px solid #a7f3d0;color:#065f46}
        .op-push-err{background:#FEF2F2;border:1.5px solid #fecaca;color:#991b1b}
        .op-pwd-toggle{width:100%;margin-top:8px;padding:10px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#475569;font-weight:600;font-size:.8rem;cursor:pointer;min-height:44px}
        .op-pwd-form{margin-top:12px;border-top:1px solid #E2E8F0;padding-top:12px}
        .op-pwd-field{margin-bottom:10px}
        .op-pwd-field label{display:block;font-size:.74rem;font-weight:600;color:#374151;margin-bottom:4px}
        .op-pwd-field input{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:16px;font-family:inherit;color:#1E293B;outline:none}
        .op-pwd-field input:focus{border-color:#2563EB}
        .op-pwd-save{width:100%;padding:11px;border-radius:8px;border:none;background:#2563EB;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;min-height:44px}
        .op-pwd-save:disabled{opacity:.6;cursor:not-allowed}
        .op-pwd-status{margin-top:10px}
      `}</style>

      <div className="op-header">
        <div className="op-brand">OpaBiz <span>Connect</span></div>
        <button className="op-logout" onClick={logout}>Salir</button>
      </div>

      <div className="op-wrap">
        {loading ? (
          <p className="op-empty">Cargando…</p>
        ) : (
          <>
            {/* Intake asistida usa el formulario público real (opabiz.com), no uno
                propio — ver LOGICA_DE_NEGOCIO/17. ?agent=1 activa el modo agente
                (oculta el pago; al Guardar le llega el link al cliente). */}
            <a href="/?agent=1" target="_blank" rel="noopener noreferrer" className="op-intake-link">Crear orden asistida</a>
            <Link href="/opabiz/dashboard/created-orders" className="op-intake-link op-intake-link-secondary">Mis solicitudes enviadas</Link>

            {me && (
              <div className="op-me">
                <div className="op-me-name">{me.nombre}</div>
                <div className="op-me-stats">
                  <span>Nivel: {me.nivel}</span>
                  <span>Puntaje: {me.puntajeActual}{me.tier ? ` (${me.tier})` : ''}</span>
                </div>
                <button
                  className={`op-disp-btn ${disponible ? 'op-disp-on' : 'op-disp-off'}`}
                  onClick={toggleDisponibilidad}
                  disabled={togglingDisp}
                >
                  {disponible ? '🟢 Disponible — tocá para pausar' : '⚪ No disponible — tocá para activarte'}
                </button>

                <div className="op-notif-row">
                  <div>
                    <div className="op-notif-label">Notificaciones en este dispositivo</div>
                    <div className="op-notif-hint">
                      {pushState === 'on' ? 'Te avisamos al instante cuando te asignen una orden.'
                        : pushState === 'denied' ? 'Bloqueadas en el navegador. Activalas desde la configuración del navegador.'
                        : pushState === 'unsupported' ? 'Este navegador no las soporta. En iPhone, agregá la app a la pantalla de inicio.'
                        : 'Activalas para enterarte al instante cuando te asignen una orden.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushState === 'on'}
                    aria-label="Notificaciones en este dispositivo"
                    className={`op-switch ${pushState === 'on' ? 'on' : ''}`}
                    onClick={pushState === 'on' ? desactivarNotificaciones : activarNotificaciones}
                    disabled={subscribingPush || pushState === 'checking' || pushState === 'unsupported' || pushState === 'denied'}
                  />
                </div>
                {pushStatus && (
                  <div className={`op-pwd-status ${pushStatus.ok ? 'op-push-ok' : 'op-push-err'}`}>{pushStatus.msg}</div>
                )}

                <button type="button" className="op-pwd-toggle" onClick={() => { setShowPwdForm(v => !v); setPwdStatus(null) }}>
                  {showPwdForm ? 'Cancelar' : 'Cambiar contraseña'}
                </button>
                {showPwdForm && (
                  <form className="op-pwd-form" onSubmit={cambiarPassword}>
                    <div className="op-pwd-field">
                      <label htmlFor="op-cur-pwd">Contraseña actual</label>
                      <input id="op-cur-pwd" type="password" autoComplete="current-password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required />
                    </div>
                    <div className="op-pwd-field">
                      <label htmlFor="op-new-pwd">Contraseña nueva (mínimo 8 caracteres)</label>
                      <input id="op-new-pwd" type="password" autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                    </div>
                    <div className="op-pwd-field">
                      <label htmlFor="op-confirm-pwd">Confirmar contraseña nueva</label>
                      <input id="op-confirm-pwd" type="password" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                    </div>
                    <button type="submit" className="op-pwd-save" disabled={savingPwd}>
                      {savingPwd ? 'Guardando…' : 'Guardar contraseña'}
                    </button>
                  </form>
                )}
                {pwdStatus && (
                  <div className={`op-pwd-status ${pwdStatus.ok ? 'op-push-ok' : 'op-push-err'}`}>{pwdStatus.msg}</div>
                )}
              </div>
            )}

            <div className="op-section-title">Mis órdenes ({ordenes.length})</div>
            {ordenes.length === 0 ? (
              <p className="op-empty">No tenés órdenes asignadas todavía.</p>
            ) : (
              ordenes.map(o => {
                const meta = ESTADO_META[o.estado] ?? ESTADO_META.pendiente
                const cliente = clienteDe(o)
                return (
                  <Link key={o.id} href={`/opabiz/dashboard/${o.id}`} className="op-card">
                    <div className="op-card-top">
                      <span className="op-servicio">{o.tipo_servicio}</span>
                      <span className="op-badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    </div>
                    {o.es_urgente && <div className="op-urgente">⚡ URGENTE</div>}
                    {cliente && <div className="op-cliente">{cliente.nombre}</div>}
                    <div className="op-fecha">Asignada: {o.fecha_asignacion ? new Date(o.fecha_asignacion).toLocaleString() : '—'}</div>
                    {o.notas && <div className="op-nota">📝 {o.notas}</div>}
                  </Link>
                )
              })
            )}
          </>
        )}
      </div>
    </>
  )
}
