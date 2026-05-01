'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Company = {
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  address: string | null
  city: string | null
  state: string
  zip: string | null
  email: string | null
  status: string
  id?: string
}

type ServiceId = 'labor_law_poster' | 'ein' | 'certificate_of_status' | 'bundle'

const SERVICES = {
  labor_law_poster:      { en: 'Labor Law Poster 2026',     es: 'Póster de Leyes Laborales 2026', price: 69.99,  desc_en: 'Required by federal law for all FL businesses', desc_es: 'Requerido por ley federal para todos los negocios en FL' },
  ein:                   { en: 'EIN / Tax ID Number',        es: 'EIN / Número de Identificación Fiscal', price: 99.99, desc_en: 'Required to open a business bank account',        desc_es: 'Necesario para abrir una cuenta bancaria empresarial' },
  certificate_of_status: { en: 'Certificate of Status (FL)', es: 'Certificado de Estado (FL)',     price: 49.99,  desc_en: 'Proves your business is active and compliant',  desc_es: 'Prueba que tu empresa está activa y al día' },
}

const T = {
  en: {
    hero_badge: 'Your company is registered in Florida',
    hero_title: 'Keep your business compliant and ready to operate',
    hero_sub: 'We found your company in the Florida state records. Select the services you need and get started today.',
    search_label: 'Enter your Florida Document ID',
    search_placeholder: 'e.g. L26000075446',
    search_btn: 'Look up my company',
    searching: 'Searching...',
    company_card: 'Your Company',
    doc_id: 'Document ID',
    type: 'Type',
    owner: 'Owner',
    address_lbl: 'Address',
    not_you: 'Not your company?',
    services_title: 'Select the services you need',
    bundle_title: 'Business Essentials Bundle',
    bundle_sub: 'All 3 services — save $30',
    bundle_price: '$189.99',
    bundle_includes: 'Includes: Labor Law Poster + EIN + Certificate of Status',
    pay_btn: 'Pay securely',
    processing: 'Processing...',
    guide_btn: '⬇ Download Free Business Guide (PDF)',
    guide_sub: 'Florida LLC & Corporation — Step by step guide',
    footer_note: 'Secure payment · 256-bit SSL · MyBusinessFormation.com',
    error_not_found: 'Document ID not found. Please verify the number and try again.',
    error_generic: 'Could not retrieve data. Please try again.',
    select_one: 'Please select at least one service.',
  },
  es: {
    hero_badge: 'Tu empresa está registrada en Florida',
    hero_title: 'Mantén tu negocio en cumplimiento y listo para operar',
    hero_sub: 'Encontramos tu empresa en los registros estatales de Florida. Selecciona los servicios que necesitas y empieza hoy.',
    search_label: 'Ingresa tu Document ID de Florida',
    search_placeholder: 'ej. L26000075446',
    search_btn: 'Buscar mi empresa',
    searching: 'Buscando...',
    company_card: 'Tu Empresa',
    doc_id: 'Número de Documento',
    type: 'Tipo',
    owner: 'Propietario',
    address_lbl: 'Dirección',
    not_you: '¿No es tu empresa?',
    services_title: 'Selecciona los servicios que necesitas',
    bundle_title: 'Bundle Esencial de Negocios',
    bundle_sub: 'Los 3 servicios — ahorra $30',
    bundle_price: '$189.99',
    bundle_includes: 'Incluye: Póster Laboral + EIN + Certificado de Estado',
    pay_btn: 'Pagar con seguridad',
    processing: 'Procesando...',
    guide_btn: '⬇ Descargar Guía Empresarial Gratis (PDF)',
    guide_sub: 'LLC y Corporación en Florida — Guía paso a paso',
    footer_note: 'Pago seguro · SSL 256 bits · MyBusinessFormation.com',
    error_not_found: 'Documento no encontrado. Verifica el número e intenta nuevamente.',
    error_generic: 'No se pudo obtener la información. Intenta nuevamente.',
    select_one: 'Selecciona al menos un servicio.',
  },
}

function NewBusinessContent() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const t = T[lang]

  const [docInput, setDocInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [searchError, setSearchError] = useState('')

  const [selected, setSelected] = useState<Set<ServiceId>>(new Set())
  const [bundleSelected, setBundleSelected] = useState(false)

  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const lookup = useCallback(async (id: string) => {
    setSearching(true)
    setSearchError('')
    setCompany(null)
    try {
      const res = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (!res.ok) { setSearchError(data.error || t.error_generic); return }
      setCompany(data.company)
    } catch {
      setSearchError(t.error_generic)
    } finally {
      setSearching(false)
    }
  }, [t])

  // Auto-lookup if ?id= param present
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) { setDocInput(id); lookup(id) }
    const l = searchParams.get('lang')
    if (l === 'es') setLang('es')
  }, [searchParams, lookup])

  function toggleService(id: ServiceId) {
    setBundleSelected(false)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleBundle() {
    setBundleSelected(v => !v)
    setSelected(new Set())
  }

  function totalPrice() {
    if (bundleSelected) return 189.99
    return [...selected].reduce((sum, id) => sum + SERVICES[id].price, 0)
  }

  async function handlePay() {
    if (!bundleSelected && selected.size === 0) { setPayError(t.select_one); return }
    if (!company) return
    setPaying(true)
    setPayError('')
    try {
      const services = bundleSelected ? ['bundle'] : [...selected]
      const res = await fetch('/api/sunbiz/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id || null,
          document_id: company.document_id,
          company_name: company.company_name,
          selected_services: services,
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setPayError(err instanceof Error ? err.message : t.error_generic)
      setPaying(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#1C2E44;--blue:#2563EB;--green:#059669;--green-light:#ECFDF5;--green-dark:#047857;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--white:#fff}
        .svc-card{border:2px solid var(--gray200);border-radius:12px;padding:18px 20px;cursor:pointer;transition:all .2s;background:var(--white);display:flex;align-items:flex-start;gap:14px;user-select:none}
        .svc-card:hover{border-color:var(--blue);transform:translateY(-1px);box-shadow:0 4px 16px rgba(37,99,235,0.1)}
        .svc-card.active{border-color:var(--blue);background:#EFF6FF;box-shadow:0 0 0 3px rgba(37,99,235,0.08)}
        .bundle-card{border:2px solid var(--green);border-radius:12px;padding:20px 24px;cursor:pointer;transition:all .2s;background:var(--green-light);display:flex;align-items:center;justify-content:space-between;gap:16px;user-select:none}
        .bundle-card:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(5,150,105,0.15)}
        .bundle-card.active{background:#d1fae5;box-shadow:0 0 0 3px rgba(5,150,105,0.12)}
        .checkmark{width:22px;height:22px;border-radius:6px;border:2px solid var(--gray200);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .svc-card.active .checkmark{background:var(--blue);border-color:var(--blue)}
        .bundle-card.active .checkmark{background:var(--green);border-color:var(--green)}
        .btn-pay{width:100%;padding:15px;border-radius:10px;background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;font-size:1rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn-pay:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,0.35)}
        .btn-pay:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .btn-guide{width:100%;padding:12px;border-radius:10px;background:var(--white);color:var(--navy);font-size:.9rem;font-weight:600;border:2px solid var(--gray200);cursor:pointer;font-family:inherit;transition:all .2s;text-decoration:none;display:block;text-align:center;margin-top:10px}
        .btn-guide:hover{border-color:var(--blue);color:var(--blue)}
        .field-row{display:flex;gap:8px}
        @media(max-width:640px){.field-row{flex-direction:column}.two-col{flex-direction:column!important}}
      `}</style>

      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg,#1C2E44,#1e40af)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 34, height: 34, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '.85rem', fontFamily: 'Fraunces,serif' }}>FL</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem', fontFamily: 'Fraunces,serif' }}>MyBusinessFormation</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.12)', borderRadius: 20, padding: 3 }}>
          {(['en', 'es'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#1C2E44' : 'rgba(255,255,255,.7)', transition: 'all .2s' }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#ECFDF5', border: '1px solid #6ee7b7', borderRadius: 20, padding: '5px 14px', fontSize: '.78rem', fontWeight: 600, color: '#047857', marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            {t.hero_badge}
          </div>
          <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.7rem', fontWeight: 900, color: '#1C2E44', lineHeight: 1.25, marginBottom: 12 }}>{t.hero_title}</h1>
          <p style={{ color: '#475569', fontSize: '.9rem', lineHeight: 1.6 }}>{t.hero_sub}</p>
        </div>

        {/* Search */}
        {!company && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(28,46,68,.06)' }}>
            <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t.search_label}</label>
            <div className="field-row">
              <input
                value={docInput}
                onChange={e => setDocInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && docInput.trim() && lookup(docInput.trim())}
                placeholder={t.search_placeholder}
                style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: '.9rem', fontFamily: 'inherit', color: '#1E293B', outline: 'none', letterSpacing: '.5px' }}
              />
              <button onClick={() => docInput.trim() && lookup(docInput.trim())} disabled={searching || !docInput.trim()} style={{ padding: '11px 22px', background: searching ? '#E2E8F0' : 'linear-gradient(135deg,#2563EB,#1C2E44)', color: searching ? '#94A3B8' : '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.88rem', cursor: searching ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .2s' }}>
                {searching ? t.searching : t.search_btn}
              </button>
            </div>
            {searchError && <p style={{ color: '#ef4444', fontSize: '.78rem', marginTop: 8 }}>{searchError}</p>}
          </div>
        )}

        {/* Company card */}
        {company && (
          <div style={{ background: '#fff', border: '1.5px solid #2563EB', borderRadius: 14, padding: 22, marginBottom: 24, boxShadow: '0 0 0 3px rgba(37,99,235,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>{t.company_card}</div>
                <div style={{ fontFamily: 'Fraunces,serif', fontSize: '1.15rem', fontWeight: 700, color: '#1C2E44' }}>{company.company_name}</div>
              </div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{company.company_type}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '.82rem' }} className="two-col">
              <div><span style={{ color: '#94A3B8', fontWeight: 500 }}>{t.doc_id}: </span><span style={{ color: '#1E293B', fontWeight: 600, letterSpacing: '.3px' }}>{company.document_id}</span></div>
              {company.owner_name && <div><span style={{ color: '#94A3B8', fontWeight: 500 }}>{t.owner}: </span><span style={{ color: '#1E293B', fontWeight: 600 }}>{company.owner_name}</span></div>}
              {company.city && <div><span style={{ color: '#94A3B8', fontWeight: 500 }}>{t.address_lbl}: </span><span style={{ color: '#1E293B', fontWeight: 600 }}>{[company.address, company.city, company.state, company.zip].filter(Boolean).join(', ')}</span></div>}
            </div>
            <button onClick={() => { setCompany(null); setDocInput(''); setSelected(new Set()); setBundleSelected(false) }} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '.75rem', cursor: 'pointer', marginTop: 12, fontFamily: 'inherit', padding: 0 }}>✕ {t.not_you}</button>
          </div>
        )}

        {/* Services */}
        {company && (
          <>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2E44', marginBottom: 14 }}>{t.services_title}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {(Object.entries(SERVICES) as [ServiceId, typeof SERVICES[keyof typeof SERVICES]][]).map(([id, svc]) => {
                const isActive = selected.has(id)
                return (
                  <div key={id} className={`svc-card${isActive ? ' active' : ''}`} onClick={() => toggleService(id)}>
                    <div className="checkmark">{isActive && <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="2,7 5,10 11,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.92rem' }}>{svc[lang]}</span>
                        <span style={{ fontWeight: 800, color: '#2563EB', fontSize: '.95rem', whiteSpace: 'nowrap' }}>${svc.price.toFixed(2)}</span>
                      </div>
                      <span style={{ color: '#64748B', fontSize: '.78rem' }}>{svc[`desc_${lang}` as 'desc_en' | 'desc_es']}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bundle */}
            <div className={`bundle-card${bundleSelected ? ' active' : ''}`} onClick={toggleBundle} style={{ marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: '.95rem', marginBottom: 2 }}>🎁 {t.bundle_title}</div>
                <div style={{ fontSize: '.78rem', color: '#065f46', marginBottom: 4 }}>{t.bundle_includes}</div>
                <div style={{ fontSize: '.75rem', color: '#047857', fontWeight: 600 }}>{t.bundle_sub}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, color: '#047857', fontSize: '1.1rem' }}>{t.bundle_price}</div>
                <div style={{ fontSize: '.7rem', color: '#6ee7b7', textDecoration: 'line-through' }}>$219.97</div>
              </div>
              <div className="checkmark" style={{ border: bundleSelected ? '2px solid #059669' : '2px solid #a7f3d0' }}>
                {bundleSelected && <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="2,7 5,10 11,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
            </div>

            {/* Total + Pay */}
            {(selected.size > 0 || bundleSelected) && (
              <div style={{ background: '#1C2E44', borderRadius: 12, padding: '14px 20px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem', fontWeight: 500 }}>Total</span>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>${totalPrice().toFixed(2)}</span>
              </div>
            )}

            {payError && <p style={{ color: '#ef4444', fontSize: '.78rem', marginBottom: 10, textAlign: 'center' }}>{payError}</p>}

            <button className="btn-pay" onClick={handlePay} disabled={paying || (selected.size === 0 && !bundleSelected)}>
              {paying ? (
                <>{t.processing}</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>{t.pay_btn} — ${totalPrice().toFixed(2)}</>
              )}
            </button>

            <a href="/guia-empresarial-florida.pdf" download className="btn-guide">{t.guide_btn}</a>
            <p style={{ textAlign: 'center', fontSize: '.72rem', color: '#94A3B8', marginTop: 8 }}>{t.guide_sub}</p>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: '.72rem', color: '#94A3B8', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          {t.footer_note}
        </p>
      </div>
    </div>
  )
}

export default function NewBusinessPage() {
  return (
    <Suspense>
      <NewBusinessContent />
    </Suspense>
  )
}
