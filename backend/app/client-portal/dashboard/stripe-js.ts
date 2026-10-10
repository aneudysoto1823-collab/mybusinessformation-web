// Stripe.js bajo demanda para el portal del cliente: lo usan "Cambiar Método
// de Pago" (DashboardContent) y "Reactivar servicio" (ReactivateServiceModal).
// Stripe.js se carga bajo demanda (recién al abrir el modal de "Cambiar
// Método de Pago"), no en cada visita al dashboard — es una acción ocasional,
// no vale la pena el peso del script en toda carga del portal. NEXT_PUBLIC_*
// se inlinea en el bundle del cliente en build time igual en un componente
// 'use client' (mismo patrón que app/opabiz/dashboard/page.tsx).
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

export type StripeJsInstance = {
  elements: (opts: { clientSecret: string }) => StripeElementsInstance
  confirmSetup: (opts: { elements: StripeElementsInstance; redirect: 'if_required' }) => Promise<{ error?: { message?: string }; setupIntent?: { id: string; status: string; payment_method?: string | { id: string } | null } }>
  // 3D Secure: el banco pide que el cliente confirme el cobro.
  handleNextAction: (opts: { clientSecret: string }) => Promise<{ error?: { message?: string } }>
}
export type StripeElementsInstance = {
  create: (type: 'payment') => { mount: (el: HTMLElement) => void }
}

export function ensureStripeJsLoaded(): Promise<StripeJsInstance> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return }
    const w = window as unknown as { Stripe?: (pk: string) => StripeJsInstance }
    if (w.Stripe) { resolve(w.Stripe(STRIPE_PK)); return }
    const existing = document.getElementById('stripe-js-portal') as HTMLScriptElement | null
    const onReady = () => {
      const w2 = window as unknown as { Stripe?: (pk: string) => StripeJsInstance }
      if (w2.Stripe) resolve(w2.Stripe(STRIPE_PK))
      else reject(new Error('Stripe.js failed to load'))
    }
    if (existing) {
      existing.addEventListener('load', onReady)
      existing.addEventListener('error', () => reject(new Error('Stripe.js failed to load')))
      return
    }
    const script = document.createElement('script')
    script.id = 'stripe-js-portal'
    script.src = 'https://js.stripe.com/v3/'
    script.onload = onReady
    script.onerror = () => reject(new Error('Stripe.js failed to load'))
    document.body.appendChild(script)
  })
}
