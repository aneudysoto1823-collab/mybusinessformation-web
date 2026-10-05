'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, Avatar, NIVEL_LABEL, CONNECT_BASE_CSS, type Me } from '../_components/ConnectShell'

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

const ESTADO_META: Record<string, { label: string; color: string; bg: string }> = {
  asignada:    { label: 'Por aceptar',  color: '#B45309', bg: '#FFFBEB' },
  en_progreso: { label: 'En progreso',  color: '#1D4ED8', bg: '#EFF6FF' },
  completada:  { label: 'Completada',   color: '#047857', bg: '#ECFDF5' },
  pendiente:   { label: 'Sin asignar',  color: '#64748B', bg: '#F1F5F9' },
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

function fmtFecha(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
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
const IconNote = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
)

export default function OpabizDashboardPage() {
  const router = useRouter()
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
        setPushError('El navegador no dio permiso para notificaciones. Podés activarlo en la configuración del navegador.')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setPushError('Falta configurar la clave de notificaciones en el servidor (NEXT_PUBLIC_VAPID_PUBLIC_KEY).')
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
        setPushError(`No se pudo guardar la suscripción: ${data.error || res.status}`)
        return
      }
      setPushState('on')
    } catch (err) {
      console.error('[opabiz] activarNotificaciones error:', err)
      setPushError(`No se pudieron activar las notificaciones: ${err instanceof Error ? err.message : String(err)}`)
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
      setPushError(`No se pudieron desactivar las notificaciones: ${err instanceof Error ? err.message : String(err)}`)
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
    const completadasMes = porTab.completadas.filter(o => o.fecha_completada && new Date(o.fecha_completada) >= inicioMes).length
    const proximaCita = ordenes
      .filter(o => o.estado !== 'completada' && o.fecha_hora_cita && Date.parse(o.fecha_hora_cita) >= ahora.getTime())
      .sort((a, b) => Date.parse(a.fecha_hora_cita!) - Date.parse(b.fecha_hora_cita!))[0] ?? null
    return { porTab, completadasMes, proximaCita }
  }, [ordenes])

  const disponible = me?.estadoDisponibilidad === 'disponible'
  const pushHint =
    pushState === 'on' ? 'Te avisamos al instante cuando te asignen una orden.'
    : pushState === 'denied' ? 'Bloqueadas en el navegador. Activalas desde su configuración.'
    : pushState === 'unsupported' ? 'No disponibles en este navegador. En iPhone, agregá la app a la pantalla de inicio.'
    : 'Activalas para enterarte al instante de una orden nueva.'

  let progresoPct: number | null = null
  if (me?.siguienteTier) {
    const desde = me.tierProgreso?.desde ?? 0
    const rango = me.siguienteTier.desde - desde
    progresoPct = rango > 0 ? Math.max(0, Math.min(100, ((me.puntajeActual - desde) / rango) * 100)) : 0
  }

  const lista = stats.porTab[tab]
  const TABS: { key: Tab; label: string }[] = [
    { key: 'nuevas', label: 'Por aceptar' },
    { key: 'progreso', label: 'En progreso' },
    { key: 'completadas', label: 'Completadas' },
  ]
  const VACIO: Record<Tab, string> = {
    nuevas: 'No tenés órdenes por aceptar. Cuando te asignen una, aparece acá.',
    progreso: 'No tenés órdenes en curso.',
    completadas: 'Todavía no completaste ninguna orden.',
  }

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
        .db-order-note{display:flex;align-items:flex-start;gap:6px;font-size:.76rem;color:#92400E;background:#FFFBEB;border-radius:6px;padding:5px 8px;margin-top:6px}
        .db-order-note svg{margin-top:2px;flex-shrink:0}
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
        }
      `}</style>

      <ConnectHeader me={me} />

      <div className="oc-wrap">
        {loading ? (
          <p className="oc-empty">Cargando…</p>
        ) : (
          <div className="db-grid">
            <aside className="db-side">
              {me && (
                <div className="oc-card db-profile">
                  <Avatar nombre={me.nombre} fotoUrl={me.perfil.fotoUrl} size={84} />
                  <div className="db-name">{me.nombre}</div>
                  <div className="db-email">{me.email}</div>
                  <div className="db-badges">
                    <span className="db-badge">Nivel {NIVEL_LABEL[me.nivel] ?? me.nivel}</span>
                    {me.tier && <span className="db-badge db-badge-tier">{me.tier}</span>}
                  </div>
                  <div className="db-progress">
                    <div className="db-progress-top">
                      <span>Puntaje <strong>{me.puntajeActual}</strong></span>
                      {me.siguienteTier && <span>{me.siguienteTier.desde - me.puntajeActual} para {me.siguienteTier.nombre}</span>}
                    </div>
                    {progresoPct !== null && (
                      <div className="db-bar"><div className="db-bar-fill" style={{ width: `${progresoPct}%` }} /></div>
                    )}
                  </div>
                  <Link href="/opabiz/dashboard/perfil" className="db-edit">Editar mi perfil</Link>
                </div>
              )}

              {me && (
                <div className="oc-card">
                  <div className="db-setting">
                    <div>
                      <div className="db-setting-label">{disponible ? 'Disponible' : 'No disponible'}</div>
                      <div className="db-setting-hint">{disponible ? 'Podés recibir órdenes nuevas.' : 'No se te asignan órdenes nuevas.'}</div>
                    </div>
                    <button
                      type="button" role="switch" aria-checked={disponible} aria-label="Disponibilidad"
                      className={`oc-switch ${disponible ? 'on' : ''}`}
                      onClick={toggleDisponibilidad} disabled={togglingDisp}
                    />
                  </div>
                  <div className="db-setting">
                    <div>
                      <div className="db-setting-label">Notificaciones</div>
                      <div className="db-setting-hint">{pushHint}</div>
                    </div>
                    <button
                      type="button" role="switch" aria-checked={pushState === 'on'} aria-label="Notificaciones en este dispositivo"
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
                <a href="/?agent=1" target="_blank" rel="noopener noreferrer" className="oc-btn oc-btn-primary"><IconPlus /> Crear orden asistida</a>
                <Link href="/opabiz/dashboard/created-orders" className="oc-btn oc-btn-secondary"><IconList /> Mis solicitudes enviadas</Link>
              </div>

              <div className="db-kpis">
                <div className="db-kpi"><div className="db-kpi-val">{stats.porTab.nuevas.length}</div><div className="db-kpi-label">Por aceptar</div></div>
                <div className="db-kpi"><div className="db-kpi-val">{stats.porTab.progreso.length}</div><div className="db-kpi-label">En progreso</div></div>
                <div className="db-kpi"><div className="db-kpi-val">{stats.completadasMes}</div><div className="db-kpi-label">Completadas este mes</div></div>
                {me?.comisiones ? (
                  <div className="db-kpi"><div className="db-kpi-val">{fmtDinero(me.comisiones.pendiente)}</div><div className="db-kpi-label">Comisión por cobrar</div></div>
                ) : (
                  <div className="db-kpi"><div className="db-kpi-val">{ordenes.length}</div><div className="db-kpi-label">Órdenes en total</div></div>
                )}
              </div>

              {stats.proximaCita && (
                <Link href={`/opabiz/dashboard/${stats.proximaCita.id}`} className="db-next">
                  <div className="db-next-icon"><IconCalendar /></div>
                  <div>
                    <div className="db-next-eyebrow">Próxima cita</div>
                    <div className="db-next-title">{fmtFecha(stats.proximaCita.fecha_hora_cita)}</div>
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
                    const meta = ESTADO_META[o.estado] ?? ESTADO_META.pendiente
                    const cliente = clienteDe(o)
                    const fecha = o.estado === 'completada'
                      ? `Completada ${fmtFecha(o.fecha_completada)}`
                      : o.fecha_hora_cita ? `Cita ${fmtFecha(o.fecha_hora_cita)}` : `Asignada ${fmtFecha(o.fecha_asignacion)}`
                    return (
                      <Link key={o.id} href={`/opabiz/dashboard/${o.id}`} className="db-order">
                        <div className="db-order-main">
                          <div className="db-order-top">
                            <span className="db-order-title">{o.tipo_servicio}</span>
                            {o.es_urgente && <span className="db-urgent">URGENTE</span>}
                          </div>
                          <div className="db-order-meta">{cliente ? `${cliente.nombre} · ` : ''}{fecha}</div>
                          {o.notas && <div className="db-order-note"><IconNote />{o.notas}</div>}
                        </div>
                        <span className="db-pill" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
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
