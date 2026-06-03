// GA4 event tracking — un único helper SSR-safe.
//
// Uso:
//   import { trackEvent } from '@/lib/tracking'
//   trackEvent('package_selected', { package: 'standard', step_number: 2 })
//
// Reglas:
//   - SSR-safe: chequea `typeof window === 'undefined'` y `window.gtag` antes de llamar.
//   - Si NEXT_PUBLIC_GA_ID no está seteado, los scripts en layout.tsx no cargan
//     gtag.js y la función queda en no-op silencioso. No rompe nada.
//   - Consent Mode v2: si el usuario rechazó analytics_storage en el banner,
//     gtag manda un "cookieless ping" anonimizado (no rompe). El consent vive en
//     lib/consent.ts y se actualiza desde el banner via setConsent().
//   - NUNCA pasar PII en params: ni email, ni nombre, ni teléfono, ni ITIN/SSN,
//     ni tarjeta. La PII vive solo en Supabase. Si necesitás identificar al
//     cliente usá un hash o el order id (que es opaco).
//
// Ver doc completo en LOGICA_DE_NEGOCIO/13_analytics_ga4.md
// Smoke test protocol: TROUBLESHOOTING/14_ga4_smoke_test.md

export type GAEventName =
  // Funnel de formación de empresa
  | 'formation_start'
  | 'step_completed'
  | 'package_selected'
  | 'payment_started'
  | 'payment_completed'
  // Chat Claudia
  | 'claudia_message_sent'
  | 'claudia_session_link_used'
  // Portal cliente
  | 'client_login_success'
  // UX
  | 'lang_toggle'

export type GAEventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackEvent(name: GAEventName, params: GAEventParams = {}): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  // Filtrar undefined antes de mandar (GA4 los ignora pero ensucia el dataLayer).
  const clean: GAEventParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) clean[k] = v
  }
  window.gtag('event', name, clean)
}
