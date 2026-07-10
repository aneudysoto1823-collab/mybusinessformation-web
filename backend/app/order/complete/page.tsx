'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'loading' | 'paid' | 'processing' | 'error'
type Line = { label: string; amount: number }
type OrderSummary = {
  fbfc: string
  companyName: string | null
  entityType: string | null
  package: string | null
  addons: string[]
  lines: Line[]
  total: number
}

// Inclusiones por paquete (mismo contenido que el portal del cliente).
const PACKAGE_SERVICES: Record<string, { en: string; es: string }[]> = {
  basic: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
  ],
  standard: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number', es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide', es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
  ],
  premium: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number', es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide', es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
    { en: 'Operating Agreement', es: 'Acuerdo Operativo' },
    { en: 'Expedited Filing (1–3 days)', es: 'Registro Prioritario (1–3 días)' },
    { en: 'ITIN Application', es: 'Solicitud de ITIN' },
    { en: 'DBA / Fictitious Name', es: 'DBA / Nombre Ficticio' },
    { en: 'Articles of Amendment', es: 'Artículos de Enmienda' },
  ],
}

// Distingue líneas "base" (paquete + tarifa estatal + acelerado) de líneas de
// addon dentro de order.lines (computeFormationTotal, lib/pricing.ts) — así
// derivamos qué es "adicional" directo del desglose de precios en vez de la
// lista `order.addons` de /api/checkout/status, que solo cubre 6 de los 12
// addons posibles (bug lateral, se resuelve solo al usar `lines` como fuente).
function isBaseLine(label: string): boolean {
  return label.endsWith('Formation Package') || label.startsWith('Florida State Filing Fee') || label === 'Expedited Processing'
}

// Las etiquetas de las líneas vienen en inglés desde lib/pricing (fuente de
// verdad del cobro). Se localizan aquí para el desglose en español.
function localizeLine(label: string, es: boolean): string {
  if (!es) return label
  if (label.startsWith('Florida State Filing Fee')) {
    return label.replace('Florida State Filing Fee', 'Cargo Estatal de Florida')
  }
  const map: Record<string, string> = {
    'Basic Formation Package': 'Paquete Básico de Formación',
    'Standard Formation Package': 'Paquete Standard de Formación',
    'Premium Formation Package': 'Paquete Premium de Formación',
    'Expedited Processing': 'Procesamiento Acelerado',
    'EIN / Tax ID Number': 'EIN / Número de Identificación Fiscal',
    'Operating Agreement': 'Acuerdo Operativo',
    'ITIN Application': 'Solicitud de ITIN',
    'Business Tax Receipt': 'Recibo de Impuesto Empresarial',
    'Local Business Tax Receipt': 'Licencia Comercial Local',
    'Sales Tax Registration': 'Registro de Impuesto sobre Ventas',
    'Certified Copy': 'Copia Certificada',
  }
  return map[label] || label
}

function CompleteContent() {
  const sp = useSearchParams()
  const sessionId = sp.get('session_id')
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [copied, setCopied] = useState(false)
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
        setOrder(d.order ?? null)
        if (d.paymentStatus === 'paid') setStatus('paid')
        else setStatus('processing')
      })
      .catch(() => setStatus('error'))
  }, [sessionId])

  const es = lang === 'es'
  const t = {
    en: {
      loading: 'Confirming your payment...',
      paidTitle: 'Order received',
      processingTitle: 'Order received',
      errorTitle: 'Something went wrong',
      errorSub: 'We could not confirm your payment status. If you were charged, please contact us and we will help right away.',
      confLabel: 'Order number',
      copy: 'Copy', copied: 'Copied!',
      company: 'Company', entity: 'Entity type', pkg: 'Package',
      includesTitle: (p: string) => `Your ${p} package includes`,
      addonsTitle: 'Additional services you added',
      total: 'Total paid',
      next: 'Our team is reviewing your order and will verify your company name with the Florida Division of Corporations. We will be in touch with the next steps.',
      emailNote: (e: string | null) => e ? `A confirmation has been sent to ${e}.` : 'A confirmation has been sent to your email.',
      portal: 'Access Client Portal',
      home: 'Back to Home',
    },
    es: {
      loading: 'Confirmando tu pago...',
      paidTitle: 'Orden recibida',
      processingTitle: 'Orden recibida',
      errorTitle: 'Algo salió mal',
      errorSub: 'No pudimos confirmar el estado de tu pago. Si se te cobró, contáctanos y te ayudamos enseguida.',
      confLabel: 'Número de orden',
      copy: 'Copiar', copied: '¡Copiado!',
      company: 'Empresa', entity: 'Tipo de entidad', pkg: 'Paquete',
      includesTitle: (p: string) => `Tu Paquete ${p} incluye`,
      addonsTitle: 'Servicios adicionales que agregaste',
      total: 'Total pagado',
      next: 'Nuestro equipo está revisando tu orden y verificará el nombre de tu empresa ante la División de Corporaciones de Florida. Te contactaremos con los próximos pasos.',
      emailNote: (e: string | null) => e ? `Enviamos una confirmación a ${e}.` : 'Enviamos una confirmación a tu correo.',
      portal: 'Acceder al Portal de Clientes',
      home: 'Volver al Inicio',
    },
  }[lang]

  const icon = status === 'paid' ? '✅' : status === 'error' ? '⚠️' : '⏳'
  const title = status === 'loading' ? t.loading
    : status === 'paid' ? t.paidTitle
    : status === 'error' ? t.errorTitle
    : t.processingTitle

  const pkgName = order?.package
    ? ({ basic: es ? 'Básico' : 'Basic', standard: 'Standard', premium: 'Premium' } as Record<string, string>)[order.package] ?? order.package
    : null
  const entityName = order?.entityType ? order.entityType.toUpperCase() : null

  function copyNum() {
    if (!order) return
    try {
      navigator.clipboard.writeText(order.fbfc)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', minHeight: '100vh', background: '#ffffff' }}>
      {/* Header estilo home */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', borderBottom: '1px solid #eef2f6' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, background: '#2563EB', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '0.95rem' }}>OB</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700 }}>
              <span style={{ color: '#1C2E44' }}>Opa</span><span style={{ color: '#2563EB' }}>Biz</span>
            </div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>Florida Business Formation Center</div>
          </div>
        </a>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '26px 20px 44px' }}>
      <div style={{
        background: '#fff', borderRadius: 18, maxWidth: 620, width: '100%',
        padding: '26px 36px 32px', textAlign: 'center',
        border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(15,28,46,0.08)',
      }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>{icon}</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#1C2E44', margin: '0 0 6px' }}>{title}</h1>

        {status === 'error' && (
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: '8px 0 24px' }}>{t.errorSub}</p>
        )}

        {/* Resumen de la orden */}
        {status !== 'loading' && status !== 'error' && order && (
          <>
            {/* Número de orden */}
            <div style={{ background: '#EFF6FF', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 18px', margin: '20px 0 16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#2563EB', marginBottom: 6 }}>{t.confLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2E44', letterSpacing: '0.5px' }}>{order.fbfc}</span>
                <button onClick={copyNum} style={{ border: '1px solid #bfdbfe', background: '#fff', color: '#2563EB', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 30 }}>
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>

            {/* Empresa + entidad */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', margin: '0 0 14px', textAlign: 'left', fontSize: '0.88rem' }}>
              {order.companyName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0' }}>
                  <span style={{ color: '#64748b' }}>{t.company}</span><strong style={{ color: '#1C2E44', textAlign: 'right' }}>{order.companyName}</strong>
                </div>
              )}
              {entityName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0' }}>
                  <span style={{ color: '#64748b' }}>{t.entity}</span><strong style={{ color: '#1C2E44' }}>{entityName}</strong>
                </div>
              )}
            </div>

            {/* Lo que incluye tu paquete + servicios adicionales (con precio) +
                desglose de cargos base + total — un solo box (antes el addon
                aparecía duplicado: un check sin precio acá y la misma línea
                con precio en un box de "Payment summary" aparte). */}
            {pkgName && (() => {
              const addonLines = order.lines.filter(l => !isBaseLine(l.label))
              const baseLines = order.lines.filter(l => isBaseLine(l.label))
              return (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', margin: '0 0 18px', textAlign: 'left', fontSize: '0.88rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>{t.includesTitle(pkgName)}</div>
                  {(PACKAGE_SERVICES[order.package ?? ''] ?? []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', color: '#334155' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span><span>{es ? s.es : s.en}</span>
                    </div>
                  ))}
                  {addonLines.length > 0 && (
                    <>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#94a3b8', margin: '14px 0 10px' }}>{t.addonsTitle}</div>
                      {addonLines.map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', color: '#334155' }}>
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span><span>{localizeLine(l.label, es)}</span></span>
                          <span style={{ whiteSpace: 'nowrap' }}>${l.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '14px 0 8px' }} />
                  {baseLines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', color: '#475569' }}>
                      <span>{localizeLine(l.label, es)}</span><span>${l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0 8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 800, color: '#1C2E44', fontSize: '0.98rem' }}>
                    <span>{t.total}</span><span>${order.total.toFixed(2)} USD</span>
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {status !== 'loading' && status !== 'error' && (
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 8px' }}>{t.next}</p>
        )}
        {status !== 'loading' && status !== 'error' && (
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 26px' }}>{t.emailNote(email)}</p>
        )}

        {status !== 'loading' && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{ background: '#1C2E44', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{t.home}</a>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default function OrderCompletePage() {
  return <Suspense><CompleteContent /></Suspense>
}
