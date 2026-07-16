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
  const [showPushBanner, setShowPushBanner] = useState(false)
  const [subscribingPush, setSubscribingPush] = useState(false)

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

  // Banner "Activar notificaciones" — solo si el navegador soporta push Y el
  // empleado todavía no concedió (ni negó) el permiso. iOS Safari solo
  // soporta esto si la PWA fue instalada a pantalla de inicio (iOS 16.4+).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
    if (Notification.permission === 'default') setShowPushBanner(true)
  }, [])

  async function activarNotificaciones() {
    setSubscribingPush(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') { setShowPushBanner(false); return }

      const registration = await navigator.serviceWorker.register('/opabiz-sw.js')
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { setShowPushBanner(false); return }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      await fetch('/api/opabiz/me/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      setShowPushBanner(false)
    } catch (err) {
      console.error('[opabiz] activarNotificaciones error:', err)
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
        .op-push-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#ECFDF5;border:1.5px solid #a7f3d0;border-radius:10px;padding:12px 14px;margin-bottom:16px}
        .op-push-text{font-size:.8rem;color:#065f46;font-weight:600;line-height:1.4}
        .op-push-btn{background:#059669;color:#fff;border:none;border-radius:8px;padding:9px 14px;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;min-height:36px}
        .op-push-btn:disabled{opacity:.6;cursor:not-allowed}
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

            {showPushBanner && (
              <div className="op-push-banner">
                <span className="op-push-text">🔔 Activá las notificaciones para enterarte al instante cuando te asignen una orden.</span>
                <button className="op-push-btn" onClick={activarNotificaciones} disabled={subscribingPush}>
                  {subscribingPush ? '...' : 'Activar'}
                </button>
              </div>
            )}

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
