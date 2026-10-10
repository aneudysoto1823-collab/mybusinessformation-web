'use client'

// Ventana "Reactivar servicio" del portal (2026-10-09). Cobra el servicio al
// precio actual con la tarjeta guardada o una nueva, sin salir del portal.
// Backend: /api/subscriptions/reactivate-service (lib/subscription-reactivate.ts).
// Textos aprobados por el founder el 2026-10-09.

import { useEffect, useRef, useState } from 'react'
import { ensureStripeJsLoaded, type StripeJsInstance, type StripeElementsInstance } from './stripe-js'

type Quote = {
  lines: { label_es: string; label_en: string; amount: number }[]
  total: number
  card: { brand: string; last4: string } | null
}

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`
const cardBrand = (b: string) => b.charAt(0).toUpperCase() + b.slice(1)

export default function ReactivateServiceModal({ orderId, service, serviceName, es, onClose, onDone }: {
  orderId: string
  service: string
  serviceName: string
  es: boolean
  onClose: () => void
  onDone: (service: string) => void
}) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadError, setLoadError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [useNewCard, setUseNewCard] = useState(false)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<StripeJsInstance | null>(null)
  const elementsRef = useRef<StripeElementsInstance | null>(null)
  const termsRef = useRef<HTMLSpanElement>(null)

  const isRa = service === 'registered-agent'
  const perYear = es ? 'al año' : 'per year'

  useEffect(() => {
    let cancelled = false
    fetch(`/api/subscriptions/reactivate-service?orderId=${encodeURIComponent(orderId)}&service=${encodeURIComponent(service)}`)
      .then(async r => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (cancelled) return
        if (!ok) { setLoadError(data.error || (es ? 'No se pudo cargar la información.' : 'Could not load the details.')); return }
        setQuote(data)
        if (!data.card) startNewCard()
      })
      .catch(() => { if (!cancelled) setLoadError(es ? 'No se pudo cargar la información.' : 'Could not load the details.') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startNewCard() {
    setUseNewCard(true)
    setSetupSecret(null)
    elementsRef.current = null
    fetch('/api/subscriptions/setup-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then(async r => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (ok && data.clientSecret) setSetupSecret(data.clientSecret)
        else setError(data.error || (es ? 'No se pudo cargar el formulario de tarjeta.' : 'Could not load the card form.'))
      })
      .catch(() => setError(es ? 'No se pudo cargar el formulario de tarjeta.' : 'Could not load the card form.'))
  }

  // Monta el formulario de tarjeta cuando hay clientSecret y el contenedor existe.
  useEffect(() => {
    if (!setupSecret || !containerRef.current) return
    let cancelled = false
    ensureStripeJsLoaded()
      .then(stripe => {
        if (cancelled || !containerRef.current) return
        const elements = stripe.elements({ clientSecret: setupSecret })
        elements.create('payment').mount(containerRef.current)
        stripeRef.current = stripe
        elementsRef.current = elements
      })
      .catch(() => { if (!cancelled) setError(es ? 'No se pudo cargar el formulario de tarjeta.' : 'Could not load the card form.') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupSecret])

  async function callReactivate(body: Record<string, unknown>) {
    const res = await fetch('/api/subscriptions/reactivate-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, service, ...body }),
    })
    return { ok: res.ok, data: await res.json() }
  }

  async function handlePay() {
    if (!accepted || paying) return
    setPaying(true)
    setError('')
    try {
      let paymentMethodId: string | undefined
      if (useNewCard) {
        const stripe = stripeRef.current
        const elements = elementsRef.current
        if (!stripe || !elements) { setPaying(false); return }
        const { error: setupErr, setupIntent } = await stripe.confirmSetup({ elements, redirect: 'if_required' })
        if (setupErr || setupIntent?.status !== 'succeeded') {
          setError(setupErr?.message || (es ? 'No se pudo confirmar la tarjeta.' : 'Could not confirm the card.'))
          setPaying(false)
          return
        }
        const pm = setupIntent.payment_method
        paymentMethodId = typeof pm === 'string' ? pm : pm?.id
      }

      const termsText = termsRef.current?.innerText ?? ''
      let { ok, data } = await callReactivate({ termsText, paymentMethodId })

      if (ok && data.status === 'requires_action' && data.clientSecret) {
        const stripe = stripeRef.current ?? await ensureStripeJsLoaded()
        stripeRef.current = stripe
        const { error: actionErr } = await stripe.handleNextAction({ clientSecret: data.clientSecret })
        if (actionErr) {
          setError(es ? 'No se completó la verificación de su banco. Intente de nuevo.' : "Your bank's verification was not completed. Please try again.")
          setPaying(false)
          return
        }
        ;({ ok, data } = await callReactivate({ confirm: true }))
      }

      if (ok && data.status === 'active') {
        setDone(true)
        onDone(service)
      } else if (ok && data.status === 'declined') {
        setError(data.message === 'not_completed'
          ? (es ? 'No se completó la verificación de su banco. Intente de nuevo.' : "Your bank's verification was not completed. Please try again.")
          : (es ? 'Su tarjeta fue rechazada. Intente con otra tarjeta.' : 'Your card was declined. Please try another card.'))
        if (data.message !== 'not_completed') startNewCard()
      } else {
        setError(data.error || (es ? 'No se pudo reactivar el servicio.' : 'Could not reactivate the service.'))
      }
    } catch {
      setError(es ? 'No se pudo reactivar el servicio.' : 'Could not reactivate the service.')
    }
    setPaying(false)
  }

  const btnPrimary = { width: '100%', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' } as const
  const canPay = accepted && !paying && !!quote && (!useNewCard || !!setupSecret)

  return (
    <div onClick={() => { if (!paying) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '14px' }}>
          {es ? 'Reactivar' : 'Reactivate'} {serviceName}
        </h3>

        {done ? (
          <>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '20px' }}>
              {es
                ? `Su servicio de ${serviceName} está activo de nuevo. Le enviamos un email de confirmación.`
                : `Your ${serviceName} service is active again. We sent you a confirmation email.`}
            </p>
            <button onClick={onClose} style={btnPrimary}>{es ? 'Cerrar' : 'Close'}</button>
          </>
        ) : loadError ? (
          <>
            <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '16px' }}>{loadError}</p>
            <button onClick={onClose} style={btnPrimary}>{es ? 'Cerrar' : 'Close'}</button>
          </>
        ) : !quote ? (
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{es ? 'Cargando...' : 'Loading...'}</p>
        ) : (
          <>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '14px', color: '#374151' }}>
              {quote.lines.map(l => (
                <div key={l.label_en} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '3px 0' }}>
                  <span>{es ? l.label_es : l.label_en}</span>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{money(l.amount)} {perYear}</span>
                </div>
              ))}
              {quote.lines.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', marginTop: '6px', paddingTop: '8px', fontWeight: 700, color: '#1a1a2e' }}>
                  <span>Total</span><span>{money(quote.total)}</span>
                </div>
              )}
            </div>

            {!useNewCard && quote.card ? (
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, marginBottom: '14px' }}>
                {es
                  ? `Se cobrará a su tarjeta ${cardBrand(quote.card.brand)} terminada en ${quote.card.last4}.`
                  : `Your ${cardBrand(quote.card.brand)} card ending in ${quote.card.last4} will be charged.`}
                {' '}
                <button type="button" onClick={startNewCard}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                  {es ? 'Usar otra tarjeta' : 'Use another card'}
                </button>
              </p>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                {!setupSecret && <p style={{ fontSize: '13px', color: '#6b7280' }}>{es ? 'Cargando el formulario de tarjeta...' : 'Loading the card form...'}</p>}
                <div ref={containerRef} />
              </div>
            )}

            {isRa && (
              <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.6, background: '#F7FAFF', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                {es
                  ? 'La dirección de su Agente Registrado puede ser distinta a la anterior. Se la enviaremos por email apenas esté activa.'
                  : 'Your Registered Agent address may be different from the previous one. We will email it to you as soon as it is active.'}
              </p>
            )}

            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px', color: '#374151', lineHeight: 1.55, marginBottom: '16px', cursor: 'pointer' }}>
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                style={{ marginTop: '3px', width: '17px', height: '17px', accentColor: '#2563EB', flexShrink: 0 }} />
              <span ref={termsRef}>
                {es
                  ? 'Acepto que este servicio se renueve automáticamente cada año al precio vigente, hasta que lo cancele. '
                  : 'I agree that this service renews automatically every year at the then-current rate, until I cancel it. '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>{es ? 'Ver Términos' : 'See Terms'}</a>.
              </span>
            </label>

            {error && <p style={{ fontSize: '13.5px', color: '#dc2626', marginBottom: '12px', lineHeight: 1.5 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} disabled={paying}
                style={{ flex: 1, background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: paying ? 'default' : 'pointer' }}>
                {es ? 'Volver' : 'Back'}
              </button>
              <button onClick={handlePay} disabled={!canPay}
                style={{ ...btnPrimary, flex: 2, width: 'auto', opacity: canPay ? 1 : 0.5, cursor: canPay ? 'pointer' : 'default' }}>
                {paying ? (es ? 'Procesando...' : 'Processing...') : `${es ? 'Pagar y reactivar' : 'Pay and reactivate'} (${money(quote.total)})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
