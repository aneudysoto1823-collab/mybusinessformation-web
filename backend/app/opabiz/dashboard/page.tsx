'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, Avatar, NIVEL_LABELS, CONNECT_BASE_CSS, useConnectLang, locale, parseUtc, notaVisible, type Me, type Lang } from '../_components/ConnectShell'

type Orden = {
  id: string
  tipo_servicio: string
  estado: string
  es_urgente: boolean
  notas: string | null
  fecha_hora_cita: string | null
  fecha_creacion: string
  fecha_asignacion: string | null
  fecha_completada: string | null
  usuarios: { nombre: string; email: string; telefono: string } | { nombre: string; email: string; telefono: string }[] | null
}

type Tab = 'nuevas' | 'progreso' | 'completadas'

const ESTADO_COLOR: Record<string, { color: string; bg: string }> = {
  asignada:    { color: '#B45309', bg: '#FFFBEB' },
  en_progreso: { color: '#1D4ED8', bg: '#EFF6FF' },
  completada:  { color: '#047857', bg: '#ECFDF5' },
  pendiente:   { color: '#64748B', bg: '#F1F5F9' },
}

const T = {
  es: {
    estado: { asignada: 'Por aceptar', en_progreso: 'En progreso', completada: 'Completada', pendiente: 'Sin asignar' } as Record<string, string>,
    urgente: 'URGENTE', cliente: 'Cliente', telefono: 'Teléfono', email: 'Email', cita: 'Cita', asignada: 'Asignada',
    aceptar: 'Aceptar', aceptando: 'Aceptando…', rechazar: 'Rechazar', rechazando: 'Rechazando…', confirmarRechazo: 'Confirmar rechazo', cancelar: 'Cancelar',
    motivoLabel: '¿Por qué rechazás esta orden?', motivoPh: 'Ej.: no tengo disponibilidad ese día, queda fuera de mi zona…',
    errAceptar: 'No se pudo aceptar la orden.', errRechazar: 'No se pudo rechazar la orden.',
    pushNoPermiso: 'El navegador no dio permiso para notificaciones. Podés activarlo en la configuración del navegador.',
    pushSinClave: 'Falta configurar la clave de notificaciones en el servidor (NEXT_PUBLIC_VAPID_PUBLIC_KEY).',
    pushNoGuardo: 'No se pudo guardar la suscripción:', pushNoActivo: 'No se pudieron activar las notificaciones:', pushNoDesactivo: 'No se pudieron desactivar las notificaciones:',
    pushOn: 'Te avisamos al instante cuando te asignen una orden.', pushDenied: 'Bloqueadas en el navegador. Activalas desde su configuración.',
    pushUnsupported: 'No disponibles en este navegador. En iPhone, agregá la app a la pantalla de inicio.', pushOff: 'Activalas para enterarte al instante de una orden nueva.',
    tabs: { nuevas: 'Por aceptar', progreso: 'En progreso', completadas: 'Completadas' },
    vacio: { nuevas: 'No tenés órdenes por aceptar. Cuando te asignen una, aparece acá.', progreso: 'No tenés órdenes en curso.', completadas: 'Todavía no completaste ninguna orden.' },
    cargando: 'Cargando…', nivel: 'Nivel', puntaje: 'Puntaje', para: 'para', editarPerfil: 'Editar mi perfil',
    disponible: 'Disponible', noDisponible: 'No disponible', dispHint: 'Podés recibir órdenes nuevas.', noDispHint: 'No se te asignan órdenes nuevas.',
    disponibilidad: 'Disponibilidad', notificaciones: 'Notificaciones', notifAria: 'Notificaciones en este dispositivo',
    crearOrden: 'Crear orden asistida', misSolicitudes: 'Mis solicitudes enviadas',
    kpiPorAceptar: 'Por aceptar', kpiProgreso: 'En progreso', kpiMes: 'Completadas este mes', kpiComision: 'Comisión por cobrar', kpiTotal: 'Órdenes en total',
    notaCliente: 'Nota del cliente', proximaCita: 'Próxima cita', completadaEl: 'Completada', citaEl: 'Cita', asignadaEl: 'Asignada',
  },
  en: {
    estado: { asignada: 'To accept', en_progreso: 'In progress', completada: 'Completed', pendiente: 'Unassigned' } as Record<string, string>,
    urgente: 'URGENT', cliente: 'Client', telefono: 'Phone', email: 'Email', cita: 'Appointment', asignada: 'Assigned',
    aceptar: 'Accept', aceptando: 'Accepting…', rechazar: 'Decline', rechazando: 'Declining…', confirmarRechazo: 'Confirm decline', cancelar: 'Cancel',
    motivoLabel: 'Why are you declining this order?', motivoPh: 'E.g.: I am not available that day, it is outside my area…',
    errAceptar: 'Could not accept the order.', errRechazar: 'Could not decline the order.',
    pushNoPermiso: 'The browser did not allow notifications. You can turn them on in your browser settings.',
    pushSinClave: 'The notification key is not configured on the server (NEXT_PUBLIC_VAPID_PUBLIC_KEY).',
    pushNoGuardo: 'Could not save the subscription:', pushNoActivo: 'Could not turn on notifications:', pushNoDesactivo: 'Could not turn off notifications:',
    pushOn: 'We notify you right away when you get a new order.', pushDenied: 'Blocked in the browser. Turn them on in its settings.',
    pushUnsupported: 'Not available in this browser. On iPhone, add the app to your home screen.', pushOff: 'Turn them on to hear about new orders right away.',
    tabs: { nuevas: 'To accept', progreso: 'In progress', completadas: 'Completed' },
    vacio: { nuevas: 'No orders waiting for you. When one is assigned, it shows up here.', progreso: 'No orders in progress.', completadas: 'You have not completed any orders yet.' },
    cargando: 'Loading…', nivel: 'Level', puntaje: 'Score', para: 'to', editarPerfil: 'Edit my profile',
    disponible: 'Available', noDisponible: 'Unavailable', dispHint: 'You can receive new orders.', noDispHint: 'No new orders are assigned to you.',
    disponibilidad: 'Availability', notificaciones: 'Notifications', notifAria: 'Notifications on this device',
    crearOrden: 'Create assisted order', misSolicitudes: 'My submitted requests',
    kpiPorAceptar: 'To accept', kpiProgreso: 'In progress', kpiMes: 'Completed this month', kpiComision: 'Commission owed', kpiTotal: 'Total orders',
    notaCliente: 'Client note', proximaCita: 'Next appointment', completadaEl: 'Completed', citaEl: 'Appointment', asignadaEl: 'Assigned',
  },
}

function tabDe(estado: string): Tab {
  if (estado === 'en_progreso') return 'progreso'
  if (estado === 'completada') return 'completadas'
  return 'nuevas'
}

function clienteDe(o: Orden) {
  if (!o.usuarios) return null
  return Array.isArray(o.usuarios) ? o.usuarios[0] ?? null : o.usuarios
}

// `utc`: columnas guardadas en UTC sin zona (asignación, completado). Sin
// `utc`: fecha_hora_cita, que ya está en hora de Florida.
function fmtFecha(iso: string | null, lang: Lang, utc = false): string {
  if (!iso) return ''
  const d = utc ? parseUtc(iso)! : new Date(iso)
  return d.toLocaleString(locale(lang), { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function fmtDinero(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
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

const IconPlus = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const IconList = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
)

// Orden "Por aceptar" desplegada dentro del panel: datos completos del
// cliente y Aceptar/Rechazar ahí mismo, sin ir a la página de detalle.
function PendingOrderCard({ o, onDone, lang }: { o: Orden; onDone: () => void; lang: Lang }) {
  const t = T[lang]
  const cliente = clienteDe(o)
  const [acting, setActing] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  async function aceptar() {
    setActing(true); setError('')
    const res = await fetch(`/api/opabiz/me/orders/${o.id}/accept`, { method: 'POST' })
    setActing(false)
    if (res.ok) { onDone(); return }
    const d = await res.json().catch(() => ({}))
    setError(d.error ?? t.errAceptar)
  }

  async function rechazar() {
    setActing(true); setError('')
    const res = await fetch(`/api/opabiz/me/orders/${o.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    })
    setActing(false)
    if (res.ok) { onDone(); return }
    const d = await res.json().catch(() => ({}))
    setError(d.error ?? t.errRechazar)
  }

  return (
    <div className="db-pending">
      <div className="db-pending-body">
        <div className="db-pending-info">
          <div className="db-order-top">
            <span className="db-order-title">{o.tipo_servicio}</span>
            {o.es_urgente && <span className="db-urgent">{t.urgente}</span>}
          </div>
          <dl className="db-pending-grid">
            {cliente && <><dt>{t.cliente}</dt><dd>{cliente.nombre}</dd></>}
            {cliente?.telefono && <><dt>{t.telefono}</dt><dd><a href={`tel:${cliente.telefono}`}>{cliente.telefono}</a></dd></>}
            {cliente?.email && <><dt>{t.email}</dt><dd><a href={`mailto:${cliente.email}`}>{cliente.email}</a></dd></>}
            {o.fecha_hora_cita && <><dt>{t.cita}</dt><dd>{fmtFecha(o.fecha_hora_cita, lang)}</dd></>}
            <dt>{t.asignada}</dt><dd>{fmtFecha(o.fecha_asignacion, lang, true) || '—'}</dd>
            {notaVisible(o.notas) && <><dt>{t.notaCliente}</dt><dd><div className="db-note-box">{notaVisible(o.notas)}</div></dd></>}
          </dl>
        </div>
        {!rejecting && (
          <div className="db-pending-actions">
            <button type="button" className="db-act db-act-accept" onClick={aceptar} disabled={acting}>
              {acting ? t.aceptando : t.aceptar}
            </button>
            <button type="button" className="db-act db-act-reject" onClick={() => { setRejecting(true); setError('') }} disabled={acting}>
              {t.rechazar}
            </button>
          </div>
        )}
      </div>
      {rejecting && (
        <div className="db-reject">
          <label htmlFor={`motivo-${o.id}`}>{t.motivoLabel}</label>
          <textarea id={`motivo-${o.id}`} value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={500}
            placeholder={t.motivoPh} />
          <div className="db-reject-actions">
            <button type="button" className="db-act db-act-cancel" onClick={() => { setRejecting(false); setMotivo('') }} disabled={acting}>{t.cancelar}</button>
            <button type="button" className="db-act db-act-reject" onClick={rechazar} disabled={acting || motivo.trim().length < 3}>
              {acting ? t.rechazando : t.confirmarRechazo}
            </button>
          </div>
        </div>
      )}
      {error && <div className="oc-msg-err db-pending-err">{error}</div>}
    </div>
  )
}

export default function OpabizDashboardPage() {
  const router = useRouter()
  const [lang] = useConnectLang()
  const t = T[lang]
  const [me, setMe] = useState<Me | null>(null)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('nuevas')
  const [togglingDisp, setTogglingDisp] = useState(false)
  // 'checking' mientras se lee el estado real del navegador; 'unsupported' =
  // sin Web Push (ej. iPhone sin la app instalada en pantalla de inicio).
  const [pushState, setPushState] = useState<'checking' | 'unsupported' | 'denied' | 'on' | 'off'>('checking')
  const [subscribingPush, setSubscribingPush] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

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

  // Una orden asignada mientras el panel está abierto tiene que aparecer sola:
  // se recarga cada 20s (mismo ritmo que /admin), al volver a la pestaña, y en
  // el momento en que llega un push (el service worker avisa con postMessage).
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState === 'visible') cargar() }, 20000)
    const onVisible = () => { if (document.visibilityState === 'visible') cargar() }
    const onSwMessage = (e: MessageEvent) => { if (e.data?.type === 'opabiz-refresh') cargar() }
    document.addEventListener('visibilitychange', onVisible)
    navigator.serviceWorker?.addEventListener('message', onSwMessage)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      navigator.serviceWorker?.removeEventListener('message', onSwMessage)
    }
  }, [cargar])

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
    setPushError(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setPushState(permiso === 'denied' ? 'denied' : 'off')
        setPushError(t.pushNoPermiso)
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setPushError(t.pushSinClave)
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
        setPushError(`${t.pushNoGuardo} ${data.error || res.status}`)
        return
      }
      setPushState('on')
    } catch (err) {
      console.error('[opabiz] activarNotificaciones error:', err)
      setPushError(`${t.pushNoActivo} ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubscribingPush(false)
    }
  }

  // Apaga solo ESTE dispositivo: borra la suscripción del navegador y su fila
  // en la base. Si el empleado tiene la app en otro celular, ahí sigue llegando.
  async function desactivarNotificaciones() {
    setSubscribingPush(true)
    setPushError(null)
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
      setPushError(`${t.pushNoDesactivo} ${err instanceof Error ? err.message : String(err)}`)
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

  const stats = useMemo(() => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const porTab: Record<Tab, Orden[]> = { nuevas: [], progreso: [], completadas: [] }
    for (const o of ordenes) porTab[tabDe(o.estado)].push(o)
    // Urgentes primero, después la cita más próxima, después la más nueva.
    const orden = (a: Orden, b: Orden) => {
      if (a.es_urgente !== b.es_urgente) return a.es_urgente ? -1 : 1
      const ca = a.fecha_hora_cita ? Date.parse(a.fecha_hora_cita) : Infinity
      const cb = b.fecha_hora_cita ? Date.parse(b.fecha_hora_cita) : Infinity
      if (ca !== cb) return ca - cb
      return Date.parse(b.fecha_asignacion ?? b.fecha_creacion) - Date.parse(a.fecha_asignacion ?? a.fecha_creacion)
    }
    porTab.nuevas.sort(orden)
    porTab.progreso.sort(orden)
    porTab.completadas.sort((a, b) => Date.parse(b.fecha_completada ?? b.fecha_creacion) - Date.parse(a.fecha_completada ?? a.fecha_creacion))
    const completadasMes = porTab.completadas.filter(o => o.fecha_completada && parseUtc(o.fecha_completada)! >= inicioMes).length
    const proximaCita = ordenes
      .filter(o => o.estado !== 'completada' && o.fecha_hora_cita && Date.parse(o.fecha_hora_cita) >= ahora.getTime())
      .sort((a, b) => Date.parse(a.fecha_hora_cita!) - Date.parse(b.fecha_hora_cita!))[0] ?? null
    return { porTab, completadasMes, proximaCita }
  }, [ordenes])

  const disponible = me?.estadoDisponibilidad === 'disponible'
  const pushHint =
    pushState === 'on' ? t.pushOn
    : pushState === 'denied' ? t.pushDenied
    : pushState === 'unsupported' ? t.pushUnsupported
    : t.pushOff

  let progresoPct: number | null = null
  if (me?.siguienteTier) {
    const desde = me.tierProgreso?.desde ?? 0
    const rango = me.siguienteTier.desde - desde
    progresoPct = rango > 0 ? Math.max(0, Math.min(100, ((me.puntajeActual - desde) / rango) * 100)) : 0
  }

  const lista = stats.porTab[tab]
  const TABS: { key: Tab; label: string }[] = [
    { key: 'nuevas', label: t.tabs.nuevas },
    { key: 'progreso', label: t.tabs.progreso },
    { key: 'completadas', label: t.tabs.completadas },
  ]
  const VACIO: Record<Tab, string> = t.vacio

  return (
    <>
      <style>{CONNECT_BASE_CSS + `
        .db-grid{display:grid;grid-template-columns:320px minmax(0,1fr);gap:20px;align-items:start}
        .db-side{position:sticky;top:88px;display:flex;flex-direction:column;gap:16px}
        .db-profile{text-align:center}
        .db-profile .oc-avatar{margin:0 auto 12px}
        .db-name{font-size:1.05rem;font-weight:700;color:#1C2E44}
        .db-email{font-size:.78rem;color:#64748B;margin-top:2px;word-break:break-all}
        .db-badges{display:flex;justify-content:center;gap:6px;margin-top:10px;flex-wrap:wrap}
        .db-badge{font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;background:#EFF6FF;color:#1D4ED8}
        .db-badge-tier{background:#F1F5F9;color:#475569}
        .db-progress{margin-top:16px;text-align:left}
        .db-progress-top{display:flex;justify-content:space-between;font-size:.74rem;color:#64748B;margin-bottom:6px}
        .db-progress-top strong{color:#1C2E44}
        .db-bar{height:7px;background:#F1F5F9;border-radius:4px;overflow:hidden}
        .db-bar-fill{height:100%;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:4px}
        .db-edit{display:block;margin-top:16px;font-size:.82rem;font-weight:600;color:#2563EB;text-decoration:none}
        .db-edit:hover{text-decoration:underline}
        .db-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}
        .db-setting + .db-setting{border-top:1px solid #F1F5F9}
        .db-setting-label{font-size:.85rem;font-weight:600;color:#1C2E44}
        .db-setting-hint{font-size:.74rem;color:#94A3B8;margin-top:2px;line-height:1.4}
        .db-settings-err{margin-top:10px}
        .db-main{display:flex;flex-direction:column;gap:16px;min-width:0}
        .db-actions{display:flex;gap:10px;flex-wrap:wrap}
        .db-actions .oc-btn{flex:1;min-width:200px}
        .db-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .db-kpi{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px}
        .db-kpi-val{font-size:1.45rem;font-weight:700;color:#1C2E44;font-family:var(--font-serif);line-height:1.1}
        .db-kpi-label{font-size:.74rem;color:#64748B;margin-top:4px}
        .db-next{display:flex;align-items:center;gap:14px;background:#1C2E44;color:#fff;border-radius:12px;padding:14px 18px;text-decoration:none}
        .db-next-icon{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .db-next-eyebrow{font-size:.68rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#93C5FD}
        .db-next-title{font-size:.9rem;font-weight:700;margin-top:2px}
        .db-next-sub{font-size:.78rem;color:rgba(255,255,255,.7);margin-top:1px}
        .db-tabs{display:flex;gap:4px;border-bottom:1px solid #E2E8F0;margin-bottom:4px;overflow-x:auto}
        .db-tab{background:none;border:none;border-bottom:2px solid transparent;padding:10px 14px;font-size:.85rem;font-weight:600;color:#64748B;cursor:pointer;font-family:inherit;white-space:nowrap;display:flex;align-items:center;gap:6px;margin-bottom:-1px}
        .db-tab.active{color:#1C2E44;border-bottom-color:#2563EB}
        .db-tab-count{font-size:.7rem;background:#F1F5F9;color:#475569;border-radius:10px;padding:1px 7px}
        .db-tab.active .db-tab-count{background:#EFF6FF;color:#1D4ED8}
        .db-order{display:flex;align-items:center;gap:14px;padding:14px 4px;text-decoration:none;color:inherit;border-bottom:1px solid #F1F5F9}
        .db-order:last-child{border-bottom:none}
        .db-order:hover{background:#F8FAFC}
        .db-order-main{flex:1;min-width:0}
        .db-order-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .db-order-title{font-weight:700;color:#1C2E44;font-size:.9rem}
        .db-urgent{font-size:.66rem;font-weight:800;letter-spacing:.4px;color:#B91C1C;background:#FEF2F2;border-radius:4px;padding:2px 6px}
        .db-order-meta{font-size:.78rem;color:#64748B;margin-top:3px}
        .db-note-box{border:1px solid #E2E8F0;border-radius:8px;padding:7px 10px;font-size:.8rem;font-weight:500;color:#334155;background:#fff;white-space:pre-line;line-height:1.45}
        .db-note-row{display:flex;align-items:flex-start;gap:12px;margin-top:8px}
        .db-note-label{font-size:.78rem;color:#94A3B8;padding-top:8px;white-space:nowrap}
        .db-pending-grid dt{align-self:start;padding-top:1px}
        .db-pending{padding:16px 4px;border-bottom:1px solid #F1F5F9}
        .db-pending:last-child{border-bottom:none}
        .db-pending-body{display:flex;gap:16px;align-items:flex-start}
        .db-pending-info{flex:1;min-width:0}
        .db-pending-grid{display:grid;grid-template-columns:auto minmax(0,1fr);gap:5px 14px;margin-top:10px;font-size:.82rem}
        .db-pending-grid dt{color:#94A3B8}
        .db-pending-grid dd{color:#1E293B;font-weight:600;word-break:break-word}
        .db-pending-grid a{color:#1D4ED8;text-decoration:none}
        .db-pending-actions{display:flex;flex-direction:column;gap:8px;flex-shrink:0}
        .db-act{padding:8px 16px;border-radius:8px;font-weight:700;font-size:.8rem;cursor:pointer;font-family:inherit;background:#fff;min-height:38px;min-width:110px;white-space:nowrap}
        .db-act:disabled{opacity:.55;cursor:not-allowed}
        .db-act-accept{color:#2563EB;border:1.5px solid #2563EB}
        .db-act-accept:hover:not(:disabled){background:#F7FAFF}
        .db-act-reject{color:#B91C1C;border:1.5px solid #FCA5A5}
        .db-act-reject:hover:not(:disabled){background:#FEF2F2}
        .db-act-cancel{color:#475569;border:1.5px solid #E2E8F0}
        .db-reject{margin-top:12px;background:#FFFBFB;border:1px solid #FECACA;border-radius:10px;padding:12px}
        .db-reject label{display:block;font-size:.8rem;font-weight:700;color:#374151;margin-bottom:6px}
        .db-reject textarea{width:100%;min-height:72px;padding:9px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:16px;font-family:inherit;color:#1E293B;outline:none;resize:vertical}
        .db-reject textarea:focus{border-color:#2563EB}
        .db-reject-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
        .db-pending-err{margin-top:10px}
        .db-pill{font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap}
        .db-chevron{color:#CBD5E1;flex-shrink:0}
        @media(max-width:900px){
          .db-grid{grid-template-columns:1fr}
          .db-side{position:static}
          .db-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media(max-width:480px){
          .db-actions .oc-btn{min-width:100%}
          .db-tab{padding:10px 9px;font-size:.8rem}
          /* La pestaña activa ya dice el estado: en pantalla chica la etiqueta
             solo le quita ancho al nombre del cliente. */
          .db-pill{display:none}
          .db-pending-body{flex-direction:column}
          .db-pending-actions{flex-direction:row;width:100%}
          .db-pending-actions .db-act{flex:1}
        }
      `}</style>

      <ConnectHeader me={me} />

      <div className="oc-wrap">
        {loading ? (
          <p className="oc-empty">{t.cargando}</p>
        ) : (
          <div className="db-grid">
            <aside className="db-side">
              {me && (
                <div className="oc-card db-profile">
                  <Avatar nombre={me.nombre} fotoUrl={me.perfil.fotoUrl} size={84} />
                  <div className="db-name">{me.nombre}</div>
                  <div className="db-email">{me.email}</div>
                  <div className="db-badges">
                    <span className="db-badge">{t.nivel} {NIVEL_LABELS[lang][me.nivel] ?? me.nivel}</span>
                    {me.tier && <span className="db-badge db-badge-tier">{me.tier}</span>}
                  </div>
                  <div className="db-progress">
                    <div className="db-progress-top">
                      <span>{t.puntaje} <strong>{me.puntajeActual}</strong></span>
                      {me.siguienteTier && <span>{me.siguienteTier.desde - me.puntajeActual} {t.para} {me.siguienteTier.nombre}</span>}
                    </div>
                    {progresoPct !== null && (
                      <div className="db-bar"><div className="db-bar-fill" style={{ width: `${progresoPct}%` }} /></div>
                    )}
                  </div>
                  <Link href="/opabiz/dashboard/perfil" className="db-edit">{t.editarPerfil}</Link>
                </div>
              )}

              {me && (
                <div className="oc-card">
                  <div className="db-setting">
                    <div>
                      <div className="db-setting-label">{disponible ? t.disponible : t.noDisponible}</div>
                      <div className="db-setting-hint">{disponible ? t.dispHint : t.noDispHint}</div>
                    </div>
                    <button
                      type="button" role="switch" aria-checked={disponible} aria-label={t.disponibilidad}
                      className={`oc-switch ${disponible ? 'on' : ''}`}
                      onClick={toggleDisponibilidad} disabled={togglingDisp}
                    />
                  </div>
                  <div className="db-setting">
                    <div>
                      <div className="db-setting-label">{t.notificaciones}</div>
                      <div className="db-setting-hint">{pushHint}</div>
                    </div>
                    <button
                      type="button" role="switch" aria-checked={pushState === 'on'} aria-label={t.notifAria}
                      className={`oc-switch ${pushState === 'on' ? 'on' : ''}`}
                      onClick={pushState === 'on' ? desactivarNotificaciones : activarNotificaciones}
                      disabled={subscribingPush || pushState === 'checking' || pushState === 'unsupported' || pushState === 'denied'}
                    />
                  </div>
                  {pushError && <div className="oc-msg-err db-settings-err">{pushError}</div>}
                </div>
              )}
            </aside>

            <main className="db-main">
              <div className="db-actions">
                {/* Intake asistida usa el formulario público real (opabiz.com), no uno
                    propio — ver LOGICA_DE_NEGOCIO/17. ?agent=1 activa el modo agente
                    (oculta el pago; al Guardar le llega el link al cliente). */}
                <a href="/?agent=1" target="_blank" rel="noopener noreferrer" className="oc-btn oc-btn-primary"><IconPlus /> {t.crearOrden}</a>
                <Link href="/opabiz/dashboard/created-orders" className="oc-btn oc-btn-secondary"><IconList /> {t.misSolicitudes}</Link>
              </div>

              <div className="db-kpis">
                <div className="db-kpi"><div className="db-kpi-val">{stats.porTab.nuevas.length}</div><div className="db-kpi-label">{t.kpiPorAceptar}</div></div>
                <div className="db-kpi"><div className="db-kpi-val">{stats.porTab.progreso.length}</div><div className="db-kpi-label">{t.kpiProgreso}</div></div>
                <div className="db-kpi"><div className="db-kpi-val">{stats.completadasMes}</div><div className="db-kpi-label">{t.kpiMes}</div></div>
                {me?.comisiones ? (
                  <div className="db-kpi"><div className="db-kpi-val">{fmtDinero(me.comisiones.pendiente)}</div><div className="db-kpi-label">{t.kpiComision}</div></div>
                ) : (
                  <div className="db-kpi"><div className="db-kpi-val">{ordenes.length}</div><div className="db-kpi-label">{t.kpiTotal}</div></div>
                )}
              </div>

              {stats.proximaCita && (
                <Link href={`/opabiz/dashboard/${stats.proximaCita.id}`} className="db-next">
                  <div className="db-next-icon"><IconCalendar /></div>
                  <div>
                    <div className="db-next-eyebrow">{t.proximaCita}</div>
                    <div className="db-next-title">{fmtFecha(stats.proximaCita.fecha_hora_cita, lang)}</div>
                    <div className="db-next-sub">{stats.proximaCita.tipo_servicio}{clienteDe(stats.proximaCita) ? ` · ${clienteDe(stats.proximaCita)!.nombre}` : ''}</div>
                  </div>
                </Link>
              )}

              <div className="oc-card">
                <div className="db-tabs" role="tablist">
                  {TABS.map(t => (
                    <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                      className={`db-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                      {t.label} <span className="db-tab-count">{stats.porTab[t.key].length}</span>
                    </button>
                  ))}
                </div>
                {lista.length === 0 ? (
                  <p className="oc-empty">{VACIO[tab]}</p>
                ) : (
                  lista.map(o => {
                    if (o.estado === 'asignada') return <PendingOrderCard key={o.id} o={o} onDone={cargar} lang={lang} />
                    const color = ESTADO_COLOR[o.estado] ?? ESTADO_COLOR.pendiente
                    const label = t.estado[o.estado] ?? t.estado.pendiente
                    const cliente = clienteDe(o)
                    const fecha = o.estado === 'completada'
                      ? `${t.completadaEl} ${fmtFecha(o.fecha_completada, lang, true)}`
                      : o.fecha_hora_cita ? `${t.citaEl} ${fmtFecha(o.fecha_hora_cita, lang)}` : `${t.asignadaEl} ${fmtFecha(o.fecha_asignacion, lang, true)}`
                    return (
                      <Link key={o.id} href={`/opabiz/dashboard/${o.id}`} className="db-order">
                        <div className="db-order-main">
                          <div className="db-order-top">
                            <span className="db-order-title">{o.tipo_servicio}</span>
                            {o.es_urgente && <span className="db-urgent">{t.urgente}</span>}
                          </div>
                          <div className="db-order-meta">{cliente ? `${cliente.nombre} · ` : ''}{fecha}</div>
                          {notaVisible(o.notas) && (
                            <div className="db-note-row"><span className="db-note-label">{t.notaCliente}</span><div className="db-note-box">{notaVisible(o.notas)}</div></div>
                          )}
                        </div>
                        <span className="db-pill" style={{ color: color.color, background: color.bg }}>{label}</span>
                        <svg className="db-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                      </Link>
                    )
                  })
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </>
  )
}
