'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/tracking'

// Dispara `payment_completed` una vez al montar. Stripe redirige a esta página
// después de un pago exitoso. Los params que pasa Stripe (session_id) van como
// query string; los leemos sin PII.
//
// El servidor también recibe el webhook checkout.session.completed, pero ese
// no puede llamar gtag (server-side). Este tracker es el espejo client-side.
export default function PaymentCompletedTracker() {
  const params = useSearchParams()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    // session_id viene de Stripe ({CHECKOUT_SESSION_ID} en success_url). Es opaco,
    // no es PII — útil solo para dedupe si el usuario refresca.
    const stripeSession = params.get('session_id') ?? undefined
    trackEvent('payment_completed', {
      stripe_session: stripeSession,
      source: 'new-business-success',
    })
  }, [params])

  return null
}
