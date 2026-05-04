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

type ServiceId = 'labor_law_poster' | 'ein' | 'certificate_of_status'

const SERVICES: Record<ServiceId, { en: string; es: string; price: number; detail_en: string; detail_es: string }> = {
  labor_law_poster: {
    en: 'Labor Law Poster 2026',
    es: 'Póster de Leyes Laborales 2026',
    price: 120.00,
    detail_en: 'Displaying the correct labor law posters is a legal requirement under both <strong>Federal & State Law — no exceptions. Avoid fines of up to $17,000 per location</strong> & other costly legal penalties. This poster must be in a visible location of the workplace for businesses with at least one employee.',
    detail_es: 'Mostrar los pósters de leyes laborales es un requisito legal bajo la ley federal y estatal — <strong>sin excepciones. Evita multas de hasta $17,000 por ubicación</strong> y otras penalidades costosas. Este póster debe estar en un lugar visible del negocio para empresas con al menos un empleado.',
  },
  certificate_of_status: {
    en: 'Certificate of Status',
    es: 'Certificado de Estado',
    price: 79.00,
    detail_en: 'Verifies your company legally exists & is <strong>authorized to conduct business</strong> in the state of Florida. Often required when applying for loans, renewing business licenses, opening a business bank account, or for other business purposes.',
    detail_es: 'Verifica que tu empresa existe legalmente y está <strong>autorizada para operar</strong> en el estado de Florida. Frecuentemente requerido al solicitar préstamos, renovar licencias, abrir cuentas bancarias o para otros propósitos empresariales.',
  },
  ein: {
    en: 'EIN / Tax ID Number',
    es: 'EIN / Número Fiscal',
    price: 161.00,
    detail_en: 'An EIN is a 9-digit number assigned to your business by the IRS. <strong>Every business must register with the federal government & obtain an EIN.</strong> It is required to identify your business for tax purposes, open a business bank account, hire employees, and file federal tax returns.',
    detail_es: 'Un EIN es un número de 9 dígitos asignado por el IRS. <strong>Todo negocio debe registrarse con el gobierno federal y obtener un EIN.</strong> Es necesario para abrir una cuenta bancaria, contratar empleados y presentar declaraciones de impuestos.',
  },
}

const SERVICE_ORDER: ServiceId[] = ['labor_law_poster', 'certificate_of_status', 'ein']

const T = {
  en: {
    topbar_name: 'MyBusinessFormation',
    svc_section: 'Our Services',
    form_title: 'Business Information',
    doc_id: 'Document ID#',
    doc_placeholder: 'e.g. L26000075446',
    looking_up: 'Looking up...',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    address1: 'Business Address Line 1',
    address2: 'Business Address Line 2',
    city: 'Business City',
    state_lbl: 'State',
    zip: 'Business Zip Code',
    biz_name: 'Business Name',
    cart_title: 'My Cart',
    select_all: 'Select All',
    price_lbl: 'Price',
    discount_lbl: '5% Combo Discount',
    subtotal: 'Cart Total',
    total: 'Total',
    checkout_btn: 'Proceed to Checkout',
    processing: 'Processing...',
    terms: 'I agree to',
    terms_link: 'Terms of Service',
    footer_note: 'Secure payment · 256-bit SSL · MyBusinessFormation.com',
    select_one: 'Please select at least one service.',
    autofill_success: 'Company found — fields auto-filled.',
    autofill_error: 'Document ID not found in our records.',
  },
  es: {
    topbar_name: 'MyBusinessFormation',
    svc_section: 'Nuestros Servicios',
    form_title: 'Información del Negocio',
    doc_id: 'Número de Documento (Document ID)',
    doc_placeholder: 'ej. L26000075446',
    looking_up: 'Buscando...',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address1: 'Dirección del Negocio',
    address2: 'Dirección Línea 2',
    city: 'Ciudad',
    state_lbl: 'Estado',
    zip: 'Código Postal',
    biz_name: 'Nombre del Negocio',
    cart_title: 'Mi Carrito',
    select_all: 'Seleccionar Todo',
    price_lbl: 'Precio',
    discount_lbl: 'Descuento 5% Combo',
    subtotal: 'Subtotal',
    total: 'Total',
    checkout_btn: 'Proceder al Pago',
    processing: 'Procesando...',
    terms: 'Acepto los',
    terms_link: 'Términos de Servicio',
    footer_note: 'Pago seguro · SSL 256 bits · MyBusinessFormation.com',
    select_one: 'Selecciona al menos un servicio.',
    autofill_success: 'Empresa encontrada — campos completados automáticamente.',
    autofill_error: 'Documento no encontrado en nuestros registros.',
  },
}

function NewBusinessContent() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const t = T[lang]

  const [docInput, setDocInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [autofillMsg, setAutofillMsg] = useState('')

  const [formFields, setFormFields] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address1: '', address2: '', city: '', state: 'FL', zip: '', businessName: '',
  })

  const [selected, setSelected] = useState<Set<ServiceId>>(new Set(SERVICE_ORDER))
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const allSelected = selected.size === SERVICE_ORDER.length
  const subtotal = [...selected].reduce((sum, id) => sum + SERVICES[id].price, 0)
  const discount = allSelected ? parseFloat((subtotal * 0.05).toFixed(2)) : 0
  const total = parseFloat((subtotal - discount).toFixed(2))

  const lookup = useCallback(async (id: string) => {
    if (!id.trim()) return
    setLookingUp(true)
    setAutofillMsg('')
    setCompany(null)
    try {
      const res = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.company) {
        setAutofillMsg(t.autofill_error)
        return
      }
      const c: Company = data.company
      setCompany(c)
      setFormFields(prev => ({
        ...prev,
        businessName: c.company_name || prev.businessName,
        address1: c.address || prev.address1,
        city: c.city || prev.city,
        state: c.state || 'FL',
        zip: c.zip || prev.zip,
        email: c.email || prev.email,
      }))
      setAutofillMsg(t.autofill_success)
    } catch {
      setAutofillMsg(t.autofill_error)
    } finally {
      setLookingUp(false)
    }
  }, [t])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) { setDocInput(id); lookup(id) }
    const l = searchParams.get('lang')
    if (l === 'es') setLang('es')
  }, [searchParams, lookup])

  function toggleService(id: ServiceId) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(SERVICE_ORDER))
  }

  async function handlePay() {
    if (selected.size === 0) { setPayError(t.select_one); return }
    if (!termsAccepted) { setPayError(lang === 'es' ? 'Debes aceptar los términos de servicio.' : 'Please accept the Terms of Service.'); return }
    setPaying(true)
    setPayError('')
    try {
      const services = [...selected]
      const res = await fetch('/api/sunbiz/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company?.id || null,
          document_id: docInput.trim() || company?.document_id || '',
          company_name: formFields.businessName || company?.company_name || '',
          selected_services: services,
          customer_email: formFields.email || null,
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error processing payment.')
      setPaying(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#1C2E44;--blue:#2563EB;--green:#059669;--gray200:#E2E8F0;--gray400:#94A3B8;--white:#fff}

        .nb-layout{display:flex;min-height:100vh}
        .nb-image{width:35%;flex-shrink:0;position:sticky;top:0;height:100vh;overflow:hidden;background:#e8edf2}
        .nb-image img{width:100%;height:100%;object-fit:contain;object-position:top left;display:block}
        .nb-content{flex:1;background:#f4f6f9;min-height:100vh}

        .svc-descriptions{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:#fff;border-bottom:1px solid #e2e8f0}
        .svc-desc-item{padding:22px 24px;border-right:1px solid #e2e8f0}
        .svc-desc-item:last-child{border-right:none}
        .svc-desc-name{font-size:.9rem;font-weight:700;color:var(--navy);margin-bottom:8px;font-family:'Fraunces',serif}
        .svc-desc-text{font-size:.75rem;color:#475569;line-height:1.65}
        .svc-desc-text strong{color:#b91c1c;font-weight:600}

        .nb-main{display:grid;grid-template-columns:1fr 380px;gap:20px;padding:24px 28px 48px;align-items:start}

        .form-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:24px;box-shadow:0 1px 4px rgba(28,46,68,.06)}
        .form-title{font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .form-grid-full{grid-column:1/-1}
        .form-input{width:100%;padding:10px 13px;border:1px solid #d1d5db;border-radius:7px;font-size:.83rem;font-family:inherit;color:#1e293b;outline:none;transition:border-color .2s;background:#fff}
        .form-input:focus{border-color:var(--blue)}
        .form-input.autofilled{background:#f0f9ff;border-color:#bae6fd}
        .doc-row{position:relative;margin-bottom:10px}
        .doc-row input{padding-right:110px}
        .doc-lookup-btn{position:absolute;right:4px;top:50%;transform:translateY(-50%);padding:6px 14px;background:var(--blue);color:#fff;border:none;border-radius:5px;font-size:.75rem;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
        .doc-lookup-btn:disabled{background:#94a3b8;cursor:default}
        .autofill-msg{font-size:.74rem;margin-top:6px;padding:6px 10px;border-radius:6px}
        .autofill-msg.success{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
        .autofill-msg.error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}

        .cart-card{background:var(--navy);border-radius:10px;padding:24px;position:sticky;top:20px;box-shadow:0 4px 20px rgba(28,46,68,.2)}
        .cart-title{font-family:'Fraunces',serif;font-size:1.6rem;font-weight:900;color:#fff;margin-bottom:20px}
        .cart-header-row{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.15);margin-bottom:4px}
        .cart-header-lbl{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px}
        .cart-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}
        .cart-item:last-of-type{border-bottom:none}
        .cart-checkbox{width:18px;height:18px;border-radius:4px;border:2px solid rgba(255,255,255,.4);background:transparent;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .cart-checkbox.checked{background:var(--blue);border-color:var(--blue)}
        .cart-item-name{flex:1;font-size:.82rem;color:#fff;font-weight:500}
        .cart-item-price{font-size:.88rem;font-weight:700;color:#fff;white-space:nowrap}
        .cart-totals{margin-top:14px;border-top:1px solid rgba(255,255,255,.15);padding-top:14px}
        .cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.83rem;color:rgba(255,255,255,.75)}
        .cart-discount-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.83rem;color:#4ade80}
        .cart-grand-total{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.2)}
        .cart-grand-lbl{font-size:1rem;font-weight:700;color:#fff}
        .cart-grand-val{font-size:1.3rem;font-weight:900;color:#fff}
        .btn-checkout{width:100%;padding:14px;border-radius:8px;background:#fff;color:var(--navy);font-size:.95rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;margin-top:16px}
        .btn-checkout:hover:not(:disabled){background:#f1f5f9;transform:translateY(-1px)}
        .btn-checkout:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .terms-row{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.74rem;color:rgba(255,255,255,.6)}
        .terms-row a{color:rgba(255,255,255,.8);text-decoration:underline}
        .terms-row input{cursor:pointer;width:15px;height:15px;flex-shrink:0}

        .discount-badge{display:inline-block;background:#4ade80;color:#14532d;font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;vertical-align:middle}

        @media(max-width:900px){
          .nb-main{grid-template-columns:1fr}
          .cart-card{position:static}
        }
        @media(max-width:768px){
          .nb-layout{flex-direction:column}
          .nb-image{width:100%!important;height:220px!important;position:relative!important;top:auto!important}
          .svc-descriptions{grid-template-columns:1fr}
          .svc-desc-item{border-right:none;border-bottom:1px solid #e2e8f0}
          .nb-main{padding:16px 14px 40px}
          .form-grid{grid-template-columns:1fr}
        }
        @media(max-width:480px){.form-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Topbar */}
      <div style={{ background: 'linear-gradient(135deg,#1C2E44,#1e40af)', padding: '13px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, background: '#2563EB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '.8rem', fontFamily: 'Fraunces,serif' }}>FL</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem', fontFamily: 'Fraunces,serif' }}>{t.topbar_name}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.12)', borderRadius: 20, padding: 3 }}>
          {(['en', 'es'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 13px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#1C2E44' : 'rgba(255,255,255,.7)', transition: 'all .2s' }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="nb-layout">
        {/* Image — left 35% */}
        <div className="nb-image">
          <img src="/photonewbusiness.jpg" alt="MyBusinessFormation" />
        </div>

        {/* Content — right */}
        <div className="nb-content">

          {/* Service descriptions */}
          <div className="svc-descriptions">
            {SERVICE_ORDER.map(id => {
              const svc = SERVICES[id]
              return (
                <div key={id} className="svc-desc-item">
                  <div className="svc-desc-name">{svc[lang]}</div>
                  <p className="svc-desc-text" dangerouslySetInnerHTML={{ __html: svc[`detail_${lang}` as 'detail_en' | 'detail_es'] }} />
                </div>
              )
            })}
          </div>

          {/* Main: form + cart */}
          <div className="nb-main">

            {/* Business Information Form */}
            <div className="form-card">
              <div className="form-title">{t.form_title}</div>

              {/* Document ID — first, triggers autofill */}
              <div className="doc-row">
                <input
                  className="form-input"
                  value={docInput}
                  onChange={e => { setDocInput(e.target.value.toUpperCase()); setAutofillMsg('') }}
                  onKeyDown={e => e.key === 'Enter' && lookup(docInput)}
                  placeholder={t.doc_placeholder}
                  style={{ marginBottom: 0 }}
                />
                <button
                  className="doc-lookup-btn"
                  onClick={() => lookup(docInput)}
                  disabled={lookingUp || !docInput.trim()}
                >
                  {lookingUp ? t.looking_up : t.doc_id}
                </button>
              </div>
              {autofillMsg && (
                <div className={`autofill-msg ${autofillMsg === t.autofill_success ? 'success' : 'error'}`}>
                  {autofillMsg}
                </div>
              )}

              <div className="form-grid" style={{ marginTop: 12 }}>
                <input className={`form-input${company ? ' autofilled' : ''}`} placeholder={t.biz_name} value={formFields.businessName} onChange={e => setFormFields(p => ({ ...p, businessName: e.target.value }))} style={{ gridColumn: '1/-1' }} />
                <input className="form-input" placeholder={t.first_name} value={formFields.firstName} onChange={e => setFormFields(p => ({ ...p, firstName: e.target.value }))} />
                <input className="form-input" placeholder={t.last_name} value={formFields.lastName} onChange={e => setFormFields(p => ({ ...p, lastName: e.target.value }))} />
                <input className="form-input" placeholder={t.email} value={formFields.email} onChange={e => setFormFields(p => ({ ...p, email: e.target.value }))} />
                <input className="form-input" placeholder={t.phone} value={formFields.phone} onChange={e => setFormFields(p => ({ ...p, phone: e.target.value }))} />
                <input className={`form-input${company ? ' autofilled' : ''}`} placeholder={t.address1} value={formFields.address1} onChange={e => setFormFields(p => ({ ...p, address1: e.target.value }))} style={{ gridColumn: '1/-1' }} />
                <input className="form-input" placeholder={t.address2} value={formFields.address2} onChange={e => setFormFields(p => ({ ...p, address2: e.target.value }))} style={{ gridColumn: '1/-1' }} />
                <input className={`form-input${company ? ' autofilled' : ''}`} placeholder={t.city} value={formFields.city} onChange={e => setFormFields(p => ({ ...p, city: e.target.value }))} />
                <input className="form-input" placeholder={t.zip} value={formFields.zip} onChange={e => setFormFields(p => ({ ...p, zip: e.target.value }))} />
              </div>
            </div>

            {/* Cart */}
            <div className="cart-card">
              <div className="cart-title">{t.cart_title}</div>

              <div className="cart-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`cart-checkbox${allSelected ? ' checked' : ''}`} onClick={toggleAll} style={{ cursor: 'pointer' }}>
                    {allSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: '.82rem', color: '#fff', fontWeight: 600 }}>{t.select_all}</span>
                  {allSelected && <span className="discount-badge">5% OFF</span>}
                </div>
                <span className="cart-header-lbl">{t.price_lbl}</span>
              </div>

              {SERVICE_ORDER.map(id => {
                const svc = SERVICES[id]
                const isChecked = selected.has(id)
                return (
                  <div key={id} className="cart-item" onClick={() => toggleService(id)} style={{ cursor: 'pointer' }}>
                    <div className={`cart-checkbox${isChecked ? ' checked' : ''}`}>
                      {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span className="cart-item-name">{svc[lang]}</span>
                    <span className="cart-item-price">${svc.price.toFixed(2)}</span>
                  </div>
                )
              })}

              <div className="cart-totals">
                {selected.size > 0 && (
                  <div className="cart-total-row">
                    <span>{t.subtotal}</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="cart-discount-row">
                    <span>{t.discount_lbl}</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-grand-total">
                  <span className="cart-grand-lbl">{t.total}</span>
                  <span className="cart-grand-val">${total.toFixed(2)}</span>
                </div>
              </div>

              {payError && <p style={{ color: '#fca5a5', fontSize: '.76rem', marginTop: 10, textAlign: 'center' }}>{payError}</p>}

              <button className="btn-checkout" onClick={handlePay} disabled={paying || selected.size === 0}>
                {paying ? t.processing : t.checkout_btn}
              </button>

              <div className="terms-row">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>{t.terms} <a href="/legal" target="_blank">{t.terms_link}</a></span>
              </div>
            </div>

          </div>

          <p style={{ textAlign: 'center', fontSize: '.71rem', color: '#94A3B8', padding: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {t.footer_note}
          </p>
        </div>
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
