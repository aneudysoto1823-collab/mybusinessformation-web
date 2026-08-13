'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'loading' | 'paid' | 'processing' | 'error'
type Line = { label: string; amount: number }
type StatusResponse = {
  status: string
  paymentStatus: string
  email: string | null
  companyName: string | null
  documentId: string | null
  lang: 'en' | 'es'
  lines: Line[]
  total: number
  orderNumber: string | null
}

export default function SuccessContent() {
  const sp = useSearchParams()
  const sessionId = sp.get('session_id')
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<StatusResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const pollCount = useRef(0)

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }

    let cancelled = false
    function fetchStatus() {
      fetch(`/api/sunbiz/checkout/status?session_id=${sessionId}`)
        .then(r => r.json())
        .then((d: StatusResponse) => {
          if (cancelled) return
          setData(d)
          if (d.paymentStatus === 'paid') {
            setStatus('paid')
            // El número de orden lo genera el webhook al confirmarse el pago
            // (async) — si todavía no está, reintenta un par de veces antes
            // de resignarse a mostrarlo vacío.
            if (!d.orderNumber && pollCount.current < 5) {
              pollCount.current += 1
              setTimeout(fetchStatus, 1500)
            }
          } else {
            setStatus('processing')
          }
        })
        .catch(() => { if (!cancelled) setStatus('error') })
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [sessionId])

  const lang = data?.lang ?? 'en'
  const es = lang === 'es'
  const t = {
    en: {
      loading: 'Confirming your payment...',
      title: 'Order received',
      errorTitle: 'Something went wrong',
      errorSub: 'We could not confirm your payment status. If you were charged, please contact us and we will help right away.',
      confLabel: 'Order number',
      generating: 'Generating your order number...',
      copy: 'Copy', copied: 'Copied!',
      company: 'Company', docId: 'Document ID',
      servicesTitle: 'Services purchased',
      total: 'Total paid',
      next: 'Our team will begin processing your services shortly. We will reach out with updates and any documents you need.',
      emailNote: (e: string | null) => e ? `A confirmation has been sent to ${e}.` : 'A confirmation has been sent to your email.',
      home: 'Back to Home',
    },
    es: {
      loading: 'Confirmando tu pago...',
      title: 'Orden recibida',
      errorTitle: 'Algo salió mal',
      errorSub: 'No pudimos confirmar el estado de tu pago. Si se te cobró, contáctanos y te ayudamos enseguida.',
      confLabel: 'Número de orden',
      generating: 'Generando tu número de orden...',
      copy: 'Copiar', copied: '¡Copiado!',
      company: 'Empresa', docId: 'Document ID',
      servicesTitle: 'Servicios adquiridos',
      total: 'Total pagado',
      next: 'Nuestro equipo comenzará a procesar tus servicios en breve. Te contactaremos con novedades y los documentos que necesites.',
      emailNote: (e: string | null) => e ? `Enviamos una confirmación a ${e}.` : 'Enviamos una confirmación a tu correo.',
      home: 'Volver al Inicio',
    },
  }[es ? 'es' : 'en']

  const icon = status === 'paid' ? '✅' : status === 'error' ? '⚠️' : '⏳'
  const title = status === 'loading' ? t.loading : status === 'error' ? t.errorTitle : t.title

  function copyNum() {
    if (!data?.orderNumber) return
    try {
      navigator.clipboard.writeText(data.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* noop */ }
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', minHeight: '100vh', background: '#ffffff' }}>
      {/* Header estilo home / order/complete */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', borderBottom: '1px solid #eef2f6' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/fbfc-seal.png" alt="Florida Business Formation Center" style={{ width: 38, height: 38 }} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: '#1C2E44' }}>
              Florida Business Formation Center
            </div>
          </div>
        </a>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '26px 20px 44px' }}>
        <div style={{
          background: '#fff', borderRadius: 18, maxWidth: 560, width: '100%',
          padding: '26px 36px 32px', textAlign: 'center',
          border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(15,28,46,0.08)',
        }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>{icon}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#1C2E44', margin: '0 0 6px' }}>{title}</h1>

          {status === 'error' && (
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: '8px 0 4px' }}>{t.errorSub}</p>
          )}

          {(status === 'paid' || status === 'processing') && data && (
            <>
              {/* Número de orden */}
              <div style={{ background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 18px', margin: '20px 0 16px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#2563EB', marginBottom: 6 }}>{t.confLabel}</div>
                {data.orderNumber ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2E44', letterSpacing: '0.5px' }}>{data.orderNumber}</span>
                    <button onClick={copyNum} style={{ border: '1px solid #bfdbfe', background: '#fff', color: '#2563EB', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 30 }}>
                      {copied ? t.copied : t.copy}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t.generating}</div>
                )}
              </div>

              {/* Empresa + Document ID */}
              {(data.companyName || data.documentId) && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', margin: '0 0 14px', textAlign: 'left', fontSize: '0.88rem' }}>
                  {data.companyName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0' }}>
                      <span style={{ color: '#64748b' }}>{t.company}</span><strong style={{ color: '#1C2E44', textAlign: 'right' }}>{data.companyName}</strong>
                    </div>
                  )}
                  {data.documentId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0' }}>
                      <span style={{ color: '#64748b' }}>{t.docId}</span><strong style={{ color: '#1C2E44' }}>{data.documentId}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Servicios + total */}
              {data.lines.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', margin: '0 0 18px', textAlign: 'left', fontSize: '0.88rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>{t.servicesTitle}</div>
                  {data.lines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', color: '#334155' }}>
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span><span>{l.label}</span></span>
                      <span style={{ whiteSpace: 'nowrap' }}>${l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0 8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 800, color: '#1C2E44', fontSize: '0.98rem' }}>
                    <span>{t.total}</span><span>${data.total.toFixed(2)} USD</span>
                  </div>
                </div>
              )}

              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 8px' }}>{t.next}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 26px' }}>{t.emailNote(data.email)}</p>
            </>
          )}

          {status !== 'loading' && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/" style={{ background: '#fff', color: '#2563EB', border: '1.5px solid #2563EB', textDecoration: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{t.home}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
