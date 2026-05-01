'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const T = {
  en: {
    badge:      'Payment Confirmed',
    title:      'You\'re all set!',
    subtitle:   'Your order has been received and our team will start processing it within 1 business day.',
    conf_label: 'Your Confirmation Number',
    conf_note:  'Save this number — you\'ll need it to access your Client Portal.',
    portal_btn: 'Access Client Portal',
    portal_sub: 'Track your order, download documents, and more.',
    doc_label:  'Company',
    next_title: 'What happens next?',
    steps: [
      { icon: '📋', title: 'Order Review',      body: 'Our team reviews your order within 1 business day.' },
      { icon: '⚙️', title: 'Processing',        body: 'We prepare and submit the required documents.' },
      { icon: '📧', title: 'Delivery',           body: 'You\'ll receive your completed documents by email.' },
    ],
    home:       '← Back to Home',
  },
  es: {
    badge:      'Pago Confirmado',
    title:      '¡Todo listo!',
    subtitle:   'Recibimos tu orden y nuestro equipo comenzará a procesarla dentro de 1 día hábil.',
    conf_label: 'Tu Número de Confirmación',
    conf_note:  'Guarda este número — lo necesitarás para acceder al Portal de Clientes.',
    portal_btn: 'Acceder al Portal de Clientes',
    portal_sub: 'Rastrea tu orden, descarga documentos y más.',
    doc_label:  'Empresa',
    next_title: '¿Qué pasa ahora?',
    steps: [
      { icon: '📋', title: 'Revisión',      body: 'Nuestro equipo revisa tu orden dentro de 1 día hábil.' },
      { icon: '⚙️', title: 'Procesamiento', body: 'Preparamos y enviamos los documentos necesarios.' },
      { icon: '📧', title: 'Entrega',        body: 'Recibirás tus documentos completados por correo.' },
    ],
    home:       '← Volver al inicio',
  },
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const doc  = searchParams.get('doc')  || ''
  const langParam = searchParams.get('lang')
  const lang = langParam === 'es' ? 'es' : 'en'
  const t    = T[lang]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      `}</style>

      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg,#1C2E44,#1e40af)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '.85rem', fontFamily: 'Fraunces,serif' }}>FL</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem', fontFamily: 'Fraunces,serif' }}>MyBusinessFormation</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 20px 60px' }}>

        {/* Success icon */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, background: '#ECFDF5', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '3px solid #6ee7b7' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#ECFDF5', border: '1px solid #6ee7b7', borderRadius: 20, padding: '5px 14px', fontSize: '.78rem', fontWeight: 600, color: '#047857', marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            {t.badge}
          </div>

          <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: '2rem', fontWeight: 900, color: '#1C2E44', lineHeight: 1.2, marginBottom: 12 }}>
            {t.title}
          </h1>
          <p style={{ color: '#475569', fontSize: '.92rem', lineHeight: 1.65, maxWidth: 460, margin: '0 auto' }}>
            {t.subtitle}
          </p>
        </div>

        {/* Confirmation number card */}
        <div style={{ background: '#fff', border: '2px solid #2563EB', borderRadius: 14, padding: 28, marginBottom: 24, boxShadow: '0 0 0 4px rgba(37,99,235,0.07)', textAlign: 'center' }}>
          <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 12 }}>{t.conf_label}</p>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', letterSpacing: '2px', marginBottom: 8 }}>
            Check your email
          </div>
          <p style={{ color: '#94A3B8', fontSize: '.8rem', lineHeight: 1.6 }}>{t.conf_note}</p>
          {doc && (
            <p style={{ marginTop: 12, fontSize: '.8rem', color: '#64748B' }}>
              <strong>{t.doc_label}:</strong> {decodeURIComponent(doc)}
            </p>
          )}
        </div>

        {/* Portal CTA */}
        <div style={{ background: '#1C2E44', borderRadius: 14, padding: 28, marginBottom: 32, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem', marginBottom: 16 }}>{t.portal_sub}</p>
          <Link
            href="/login"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg,#2563EB,#3b82f6)', color: '#fff', textDecoration: 'none', padding: '13px 36px', borderRadius: 9, fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', letterSpacing: '.2px' }}
          >
            {t.portal_btn}
          </Link>
        </div>

        {/* Next steps */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2E44', marginBottom: 16 }}>{t.next_title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {t.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>{step.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.9rem', marginBottom: 3 }}>{step.title}</div>
                <div style={{ color: '#64748B', fontSize: '.82rem', lineHeight: 1.55 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#64748B', fontSize: '.85rem', textDecoration: 'none', fontWeight: 500 }}>
            {t.home}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
