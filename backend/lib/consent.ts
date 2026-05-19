// Cookie consent state + Google Consent Mode v2 helpers.
//
// El estado del consent vive en 2 lugares:
//   - Cookie `mbf_consent` (1 año) — server-side y persistente entre sesiones
//   - localStorage `mbf_consent` — backup client-side rápido
//
// Cuando cambia, dispara `gtag('consent', 'update', ...)` mapeando las 2
// categorías opt-in (analytics, marketing) a las 4 dimensiones de Consent Mode v2:
//   - analytics_storage → analytics
//   - ad_storage / ad_user_data / ad_personalization → marketing

export interface ConsentState {
  necessary: true // siempre on — no se puede desactivar
  analytics: boolean
  marketing: boolean
  timestamp: number // ms desde epoch — cuando se guardó la decisión
}

export const CONSENT_COOKIE = 'mbf_consent'
export const CONSENT_LS_KEY = 'mbf_consent'

const DEFAULT_DENY: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
}

// Lee el consent guardado. Retorna null si nunca se decidió (banner debe aparecer).
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null

  // Prioriza localStorage (más rápido). Fallback a cookie.
  try {
    const ls = window.localStorage.getItem(CONSENT_LS_KEY)
    if (ls) {
      const parsed = JSON.parse(ls)
      if (typeof parsed === 'object' && parsed !== null) {
        return normalize(parsed)
      }
    }
  } catch {
    // localStorage puede fallar en modo privado de Safari — caemos al cookie.
  }

  const cookie = readCookie(CONSENT_COOKIE)
  if (cookie) {
    try {
      return normalize(JSON.parse(decodeURIComponent(cookie)))
    } catch {
      // Cookie corrupta — la tratamos como si nunca se hubiera decidido.
    }
  }

  return null
}

// Guarda la decisión y dispara el update de gtag (si gtag está cargado).
export function setConsent(opts: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: opts.analytics,
    marketing: opts.marketing,
    timestamp: Date.now(),
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_LS_KEY, JSON.stringify(state))
    } catch {
      // Modo privado — ignoramos, igual queda la cookie.
    }
    writeCookie(CONSENT_COOKIE, encodeURIComponent(JSON.stringify(state)), 365)
    updateGtagConsent(state)
    // Notificar a quien escucha cambios (otras pestañas / componentes).
    window.dispatchEvent(new CustomEvent('mbf:consent-change', { detail: state }))
  }

  return state
}

// Hook para componentes que necesiten reaccionar al cambio (otra pestaña, banner cierra).
export function onConsentChange(callback: (state: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as ConsentState
    callback(detail)
  }
  window.addEventListener('mbf:consent-change', handler)
  // También escuchar storage events (cambios desde otra pestaña).
  const storageHandler = (e: StorageEvent) => {
    if (e.key !== CONSENT_LS_KEY || !e.newValue) return
    try {
      callback(normalize(JSON.parse(e.newValue)))
    } catch {
      /* ignore */
    }
  }
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener('mbf:consent-change', handler)
    window.removeEventListener('storage', storageHandler)
  }
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function normalize(raw: unknown): ConsentState {
  const obj = (raw ?? {}) as Partial<ConsentState>
  return {
    necessary: true,
    analytics: Boolean(obj.analytics),
    marketing: Boolean(obj.marketing),
    timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : 0,
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((c) => c.startsWith(name + '='))
  return match ? match.substring(name.length + 1) : null
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  // SameSite=Lax para que el cookie se envíe en navegaciones top-level.
  // No httpOnly: necesitamos leerlo desde JS para el banner.
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// Mapea el state interno a las 4 dimensiones de Google Consent Mode v2.
function updateGtagConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return
  // gtag puede no estar cargado si NEXT_PUBLIC_GA_ID no está seteado. Es OK.
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  gtag('consent', 'update', {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
  })
}

// Helper para usar en componente: si nunca se decidió, retorna defaults (todo denied).
// Útil para inferir el estado inicial del banner sin disparar gtag.
export function getConsentOrDefault(): ConsentState {
  return getConsent() ?? DEFAULT_DENY
}
