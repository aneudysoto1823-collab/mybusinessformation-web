'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'

type Line = { label: string; amount: number }
type Summary = {
  orderId: string
  fbfc: string
  firstName: string
  companyName: string
  entityType: string | null
  package: string | null
  paymentStatus: string
  lines: Line[]
  total: number
}

type Status = 'loading' | 'ready' | 'not-found' | 'error'

declare global {
  interface Window {
    Stripe?: (pk: string) => unknown
  }
}

function isBaseLine(label: string): boolean {
  return label.endsWith('Formation Package') || label.startsWith('Florida State Filing Fee') || label === 'Expedited Processing'
}

export default function ConfirmPage() {
  const params = useParams<{ fbfc: string }>()
  const fbfc = decodeURIComponent(params.fbfc)

  const [status, setStatus] = useState<Status>('loading')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [stripeReady, setStripeReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    fetch(`/api/orders/summary-by-fbfc?fbfc=${encodeURIComponent(fbfc)}`)
      .then(async r => {
        if (r.status === 404) { setStatus('not-found'); return }
        if (!r.ok) { setStatus('error'); return }
        const d = await r.json()
        setSummary(d)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [fbfc])

  async function startPayment() {
    if (!summary) return
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/checkout/embedded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: summary.orderId }),
      })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) throw new Error(data.error || 'No se pudo iniciar el pago')

      if (typeof window.Stripe === 'undefined' || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe no disponible')
      }
      const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) as {
        initEmbeddedCheckout: (opts: { clientSecret: string }) => Promise<{ mount: (sel: string) => void }>
      }
      const checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret })
      const el = document.getElementById('confirm-payment')
      if (el) el.innerHTML = ''
      checkout.mount('#confirm-payment')
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'No se pudo iniciar el pago')
    } finally {
      setPaying(false)
    }
  }

  const pkgName = summary?.package
    ? ({ basic: 'Basic', standard: 'Standard', premium: 'Premium' } as Record<string, string>)[summary.package] ?? summary.package
    : null

  return (
    <div style={{ fontFamily: 'var(--font-sans)', minHeight: '100vh', background: '#ffffff' }}>
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onLoad={() => setStripeReady(true)} />

      <header style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', borderBottom: '1px solid #eef2f6' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, background: '#2563EB', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '0.95rem' }}>OB</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700 }}>
            <span style={{ color: '#1C2E44' }}>Opa</span><span style={{ color: '#2563EB' }}>Biz</span>
          </div>
        </a>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '26px 20px 60px' }}>
        <div style={{ background: '#fff', borderRadius: 18, maxWidth: 560, width: '100%', padding: '26px 32px 32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(15,28,46,0.08)' }}>

          {status === 'loading' && <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando tu solicitud...</p>}
          {status === 'not-found' && <p style={{ textAlign: 'center', color: '#64748b' }}>No encontramos esta solicitud. Si el link no funciona, contactanos.</p>}
          {status === 'error' && <p style={{ textAlign: 'center', color: '#dc2626' }}>Algo salió mal. Intentá de nuevo en unos minutos.</p>}

          {status === 'ready' && summary && (
            <>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#1C2E44', margin: '0 0 6px', textAlign: 'center' }}>
                Hola {summary.firstName}, revisá tu solicitud
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', margin: '0 0 20px' }}>
                Un agente preparó esto con vos. Confirmá y pagá cuando quieras.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', margin: '0 0 14px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ color: '#64748b' }}>Empresa</span><strong style={{ color: '#1C2E44' }}>{summary.companyName}</strong>
                </div>
                {summary.entityType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ color: '#64748b' }}>Tipo de entidad</span><strong style={{ color: '#1C2E44' }}>{summary.entityType.toUpperCase()}</strong>
                  </div>
                )}
              </div>

              {pkgName && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', margin: '0 0 18px', fontSize: '0.88rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>Paquete {pkgName}</div>
                  {summary.lines.filter(l => !isBaseLine(l.label)).map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#334155' }}>
                      <span>{l.label}</span><span>${l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0 8px' }} />
                  {summary.lines.filter(l => isBaseLine(l.label)).map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                      <span>{l.label}</span><span>${l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0 8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#1C2E44', fontSize: '0.98rem' }}>
                    <span>Total</span><span>${summary.total.toFixed(2)} USD</span>
                  </div>
                </div>
              )}

              <div id="confirm-payment" />

              {!paying && (
                <button
                  onClick={startPayment}
                  disabled={!stripeReady}
                  style={{ width: '100%', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', minHeight: 48 }}
                >
                  Confirmar y pagar
                </button>
              )}
              {payError && <p style={{ color: '#dc2626', fontSize: '0.82rem', textAlign: 'center', marginTop: 10 }}>{payError}</p>}

              <p style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center', marginTop: 20 }}>
                ¿Algo no es correcto? <a href="mailto:info@opabiz.com" style={{ color: '#2563EB' }}>Contactanos</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
