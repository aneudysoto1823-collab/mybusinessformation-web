'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'loading' | 'paid' | 'processing' | 'error'

function CompleteContent() {
  const sp = useSearchParams()
  const sessionId = sp.get('session_id')
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'es'>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flbc_lang')
      if (saved === 'es' || saved === 'en') setLang(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }
    fetch(`/api/checkout/status?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        setEmail(d.email ?? null)
        if (d.paymentStatus === 'paid') setStatus('paid')
        else if (d.status === 'complete') setStatus('processing')
        else setStatus('processing')
      })
      .catch(() => setStatus('error'))
  }, [sessionId])

  const t = {
    en: {
      loading: 'Confirming your payment...',
      paidTitle: 'Payment confirmed!',
      paidSub: (e: string | null) => `Thank you. A confirmation${e ? ` has been sent to ${e}` : ''}. Our team will review your order and contact you within 1 business day.`,
      processingTitle: 'Payment received',
      processingSub: 'We are finalizing your order. You will receive a confirmation email shortly.',
      errorTitle: 'Something went wrong',
      errorSub: 'We could not confirm your payment status. If you were charged, please contact us and we will help right away.',
      portal: 'Access Client Portal',
      home: 'Back to Home',
    },
    es: {
      loading: 'Confirmando tu pago...',
      paidTitle: '¡Pago confirmado!',
      paidSub: (e: string | null) => `Gracias. Te enviamos una confirmación${e ? ` a ${e}` : ''}. Nuestro equipo revisará tu orden y te contactará en un día hábil.`,
      processingTitle: 'Pago recibido',
      processingSub: 'Estamos finalizando tu orden. Recibirás un correo de confirmación en breve.',
      errorTitle: 'Algo salió mal',
      errorSub: 'No pudimos confirmar el estado de tu pago. Si se te cobró, contáctanos y te ayudamos enseguida.',
      portal: 'Acceder al Portal de Clientes',
      home: 'Volver al Inicio',
    },
  }[lang]

  const icon = status === 'paid' ? '✅' : status === 'error' ? '⚠️' : '⏳'
  const title = status === 'loading' ? t.loading
    : status === 'paid' ? t.paidTitle
    : status === 'error' ? t.errorTitle
    : t.processingTitle
  const sub = status === 'paid' ? t.paidSub(email)
    : status === 'error' ? t.errorSub
    : status === 'processing' ? t.processingSub
    : ''

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      background: 'linear-gradient(160deg, #0f1c2e 0%, #1C2E44 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%',
        padding: '44px 36px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Fraunces', serif", fontWeight: 700 }}>OB</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 700 }}>
            <span style={{ color: '#1C2E44' }}>Opa</span><span style={{ color: '#2563EB' }}>Biz</span>
          </div>
        </a>

        <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icon}</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: '#1C2E44', margin: '0 0 12px' }}>{title}</h1>
        {sub && <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 28px' }}>{sub}</p>}

        {status !== 'loading' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/client-portal" style={{ background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{t.portal}</a>
            <a href="/" style={{ background: '#f1f5f9', color: '#475569', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{t.home}</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderCompletePage() {
  return <Suspense><CompleteContent /></Suspense>
}
