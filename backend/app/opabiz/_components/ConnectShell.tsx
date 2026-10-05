'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Piezas compartidas del panel del empleado (dashboard + perfil): tipo de los
// datos de /api/opabiz/auth/me, avatar, encabezado con menú y estilos base.

export type Me = {
  nombre: string
  email: string
  telefono: string
  nivel: string
  puntajeActual: number
  estadoDisponibilidad: string
  tier: string | null
  tierProgreso: { desde: number; hasta: number } | null
  siguienteTier: { nombre: string; desde: number } | null
  perfil: {
    fotoUrl: string | null
    direccionCalle: string
    direccionCiudad: string
    direccionEstado: string
    direccionZip: string
    idiomas: string[]
  }
  perfilDisponible: boolean
  comisiones: { pendiente: number; pagado: number } | null
}

export type Lang = 'es' | 'en'

// Idioma del panel del agente: se guarda en el navegador y cualquier
// componente que lo use se actualiza al instante cuando cambia (evento propio,
// porque 'storage' solo dispara en OTRAS pestañas). Español por defecto.
const LANG_KEY = 'opabiz_connect_lang'
const LANG_EVENT = 'opabiz-connect-lang'

function readLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'es' } catch { return 'es' }
}
function subscribeLang(cb: () => void) {
  window.addEventListener(LANG_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(LANG_EVENT, cb); window.removeEventListener('storage', cb) }
}

export function useConnectLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => 'es' as Lang)
  const setLang = (l: Lang) => {
    try { localStorage.setItem(LANG_KEY, l) } catch {}
    window.dispatchEvent(new Event(LANG_EVENT))
  }
  return [lang, setLang]
}

// Las columnas de fecha de ordenes_opabiz (fecha_asignacion, fecha_creacion,
// fecha_completada, fecha_inicio) y Order.createdAt se guardan en UTC pero
// SIN zona horaria. Si se pasan tal cual a new Date(), el navegador las toma
// como hora local y salían 4 horas adelantadas. Ojo: fecha_hora_cita NO pasa
// por acá; esa se guarda ya en hora de Florida y se lee tal cual.
export function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`)
}

export function locale(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'es-US'
}

export const NIVEL_LABELS: Record<Lang, Record<string, string>> = {
  es: { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', administrador: 'Administrador' },
  en: { basico: 'Basic', intermedio: 'Intermediate', avanzado: 'Advanced', administrador: 'Administrator' },
}

const HEADER_T = {
  es: { panel: 'Panel', perfil: 'Mi perfil', password: 'Cambiar contraseña', salir: 'Salir', idioma: 'Idioma' },
  en: { panel: 'Dashboard', perfil: 'My profile', password: 'Change password', salir: 'Sign out', idioma: 'Language' },
}

export function LangToggle() {
  const [lang, setLang] = useConnectLang()
  return (
    <div className="oc-lang" role="group" aria-label={HEADER_T[lang].idioma}>
      <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button type="button" className={lang === 'es' ? 'on' : ''} aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
    </div>
  )
}

export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || 'OC'
}

export function Avatar({ nombre, fotoUrl, size }: { nombre: string; fotoUrl: string | null; size: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fotoUrl} alt={nombre} className="oc-avatar" style={style} />
  }
  return <div className="oc-avatar oc-avatar-initials" style={style}>{iniciales(nombre)}</div>
}

// Para páginas que solo necesitan el encabezado (detalle de orden, mis
// solicitudes): trae los datos del empleado para el menú con su foto.
export function useConnectMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null)
  useEffect(() => {
    fetch('/api/opabiz/auth/me').then(r => (r.ok ? r.json() : null)).then(setMe).catch(() => {})
  }, [])
  return me
}

export function ConnectHeader({ me }: { me: Me | null }) {
  const router = useRouter()
  const [lang] = useConnectLang()
  const t = HEADER_T[lang]
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function logout() {
    await fetch('/api/opabiz/auth/logout', { method: 'POST' })
    router.push('/opabiz/login')
  }

  return (
    <header className="oc-header">
      <Link href="/opabiz/dashboard" className="oc-brand">
        <span className="oc-brand-mark">OB</span>
        <span className="oc-brand-name">OpaBiz <span>Connect</span></span>
      </Link>
      <div className="oc-header-right">
      <LangToggle />
      {me && (
        <div className="oc-menu" ref={menuRef}>
          <button type="button" className="oc-menu-btn" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>
            <Avatar nombre={me.nombre} fotoUrl={me.perfil.fotoUrl} size={34} />
            <span className="oc-menu-name">{me.nombre.split(' ')[0]}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {open && (
            <div className="oc-menu-list" role="menu">
              <div className="oc-menu-head">
                <div className="oc-menu-head-name">{me.nombre}</div>
                <div className="oc-menu-head-email">{me.email}</div>
              </div>
              <Link href="/opabiz/dashboard" className="oc-menu-item" role="menuitem" onClick={() => setOpen(false)}>{t.panel}</Link>
              <Link href="/opabiz/dashboard/perfil" className="oc-menu-item" role="menuitem" onClick={() => setOpen(false)}>{t.perfil}</Link>
              <Link href="/opabiz/dashboard/perfil#seguridad" className="oc-menu-item" role="menuitem" onClick={() => setOpen(false)}>{t.password}</Link>
              <button type="button" className="oc-menu-item oc-menu-logout" role="menuitem" onClick={logout}>{t.salir}</button>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  )
}

export const CONNECT_BASE_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#F4F6F9;font-family:var(--font-sans);color:#1E293B}
  .oc-header{background:#1C2E44;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
  .oc-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
  .oc-brand-mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#2563EB,#60A5FA);display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-weight:700;color:#fff;font-size:13px}
  .oc-brand-name{color:#fff;font-weight:700;font-size:1.02rem;font-family:var(--font-serif)}
  .oc-brand-name span{color:#60A5FA}
  .oc-header-right{display:flex;align-items:center;gap:12px}
  .oc-lang{display:flex;border:1px solid rgba(255,255,255,.22);border-radius:20px;overflow:hidden}
  .oc-lang button{background:transparent;border:none;color:rgba(255,255,255,.65);font-size:.72rem;font-weight:700;padding:6px 10px;cursor:pointer;font-family:inherit;letter-spacing:.3px}
  .oc-lang button.on{background:rgba(255,255,255,.14);color:#fff}
  .oc-menu{position:relative}
  .oc-menu-btn{display:flex;align-items:center;gap:8px;background:transparent;border:1px solid rgba(255,255,255,.18);border-radius:24px;padding:3px 10px 3px 3px;color:#fff;cursor:pointer;font-family:inherit;font-size:.85rem;font-weight:600}
  .oc-menu-btn:hover{background:rgba(255,255,255,.06)}
  .oc-menu-list{position:absolute;right:0;top:calc(100% + 8px);background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 16px 40px rgba(15,28,46,.18);min-width:230px;padding:6px;z-index:30}
  .oc-menu-head{padding:10px 12px;border-bottom:1px solid #F1F5F9;margin-bottom:4px}
  .oc-menu-head-name{font-weight:700;font-size:.88rem;color:#1C2E44}
  .oc-menu-head-email{font-size:.76rem;color:#64748B;word-break:break-all;margin-top:2px}
  .oc-menu-item{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:.86rem;color:#334155;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit}
  .oc-menu-item:hover{background:#F1F5F9}
  .oc-menu-logout{color:#B91C1C}
  .oc-avatar{border-radius:50%;object-fit:cover;display:block;flex-shrink:0}
  .oc-avatar-initials{background:linear-gradient(135deg,#1C2E44,#2563EB);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:var(--font-serif)}
  .oc-wrap{max-width:1120px;margin:0 auto;padding:24px}
  .oc-card{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:20px}
  .oc-card-title{font-size:.95rem;font-weight:700;color:#1C2E44;margin-bottom:4px}
  .oc-card-sub{font-size:.8rem;color:#64748B;margin-bottom:16px;line-height:1.45}
  .oc-switch{position:relative;width:44px;height:26px;border-radius:13px;border:none;background:#CBD5E1;cursor:pointer;flex-shrink:0;transition:background .15s}
  .oc-switch::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .15s}
  .oc-switch.on{background:#059669}
  .oc-switch.on::after{transform:translateX(18px)}
  .oc-switch:disabled{opacity:.5;cursor:not-allowed}
  .oc-msg-ok,.oc-msg-err{font-size:.8rem;font-weight:600;line-height:1.45;border-radius:10px;padding:10px 14px}
  .oc-msg-ok{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46}
  .oc-msg-err{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B}
  .oc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:9px;font-weight:700;font-size:.86rem;cursor:pointer;border:1px solid transparent;text-decoration:none;font-family:inherit;min-height:44px}
  .oc-btn-primary{background:#fff;color:#2563EB;border:1.5px solid #2563EB}
  .oc-btn-primary:hover{background:#F7FAFF}
  .oc-btn-secondary{background:#fff;color:#334155;border-color:#E2E8F0}
  .oc-btn-secondary:hover{background:#F8FAFC}
  .oc-btn:disabled{opacity:.6;cursor:not-allowed}
  .oc-back{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;font-weight:600;color:#64748B;text-decoration:none;margin-bottom:12px}
  .oc-back:hover{color:#1C2E44}
  .oc-empty{text-align:center;color:#94A3B8;font-size:.85rem;padding:36px 16px}
  @media(max-width:768px){
    .oc-header{padding:0 16px}
    .oc-wrap{padding:16px}
    .oc-menu-name{display:none}
  }
`
