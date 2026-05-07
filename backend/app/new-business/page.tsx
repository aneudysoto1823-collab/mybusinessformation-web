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

type PageView = 'id-entry' | 'landing'

const SERVICES = [
  {
    id: 'labor_law',
    titleEn: 'Labor Law Poster 2026',
    titleEs: 'Póster de Leyes Laborales 2026',
    descEn: 'Mandatory federal & state poster for all Florida businesses. Avoid fines up to $17,650.',
    descEs: 'Póster obligatorio federal y estatal para todos los negocios en Florida. Evita multas de hasta $17,650.',
    price: 69.99,
  },
  {
    id: 'ein',
    titleEn: 'EIN / Tax ID Number',
    titleEs: 'EIN / Número de Identificación Fiscal',
    descEn: 'Required to open a business bank account, hire employees, and file taxes.',
    descEs: 'Necesario para abrir cuenta bancaria, contratar empleados y declarar impuestos.',
    price: 99.99,
  },
  {
    id: 'certificate',
    titleEn: 'Certificate of Status (FL)',
    titleEs: 'Certificado de Estado (FL)',
    descEn: 'Official document proving your business is active and in good standing with Florida.',
    descEs: 'Documento oficial que acredita que tu negocio está activo y al corriente con Florida.',
    price: 49.99,
  },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── HEADER ── */
  .nb-header {
    background: #1B3A6B;
    height: 64px;
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,.25);
  }
  .nb-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .nb-logo-mark {
    width: 38px;
    height: 38px;
    background: #2563EB;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -.5px;
    flex-shrink: 0;
  }
  .nb-logo-text { line-height: 1.25; }
  .nb-logo-text .l1 {
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: .95rem;
    font-weight: 700;
  }
  .nb-logo-text .l2 {
    color: #93c5fd;
    font-size: .68rem;
    font-weight: 500;
    letter-spacing: .3px;
  }
  .nb-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .nb-phone {
    color: rgba(255,255,255,.85);
    font-size: .82rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color .15s;
  }
  .nb-phone:hover { color: #fff; }
  .nb-lang {
    display: flex;
    background: rgba(255,255,255,.12);
    border-radius: 20px;
    padding: 3px;
    gap: 2px;
  }
  .nb-lang button {
    padding: 4px 13px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-size: .72rem;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s;
  }
  .nb-lang button.active  { background: #fff; color: #1B3A6B; }
  .nb-lang button:not(.active) { background: transparent; color: rgba(255,255,255,.65); }

  /* ── WELCOME ── */
  .nb-welcome {
    background: #fff;
    padding: 36px 40px 38px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }
  .nb-welcome-inner { max-width: 680px; margin: 0 auto; }
  .nb-welcome h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.2rem, 2.2vw, 1.55rem);
    font-weight: 700;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .nb-welcome h1 span { color: #2563EB; }
  .nb-welcome p {
    color: #475569;
    font-size: .86rem;
    line-height: 1.75;
    max-width: 560px;
    margin: 0 auto;
  }

  /* ── ID ENTRY ── */
  .entry-wrap {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    padding: 40px 24px;
  }
  .entry-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 44px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 8px 40px rgba(27,58,107,.14);
    border: 1px solid #e2e8f0;
  }
  .entry-tag {
    display: inline-block;
    background: #EFF6FF;
    color: #2563EB;
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
    padding: 4px 11px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
  .entry-title {
    font-family: 'Fraunces', serif;
    font-size: 1.55rem;
    font-weight: 900;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .entry-sub {
    color: #64748b;
    font-size: .86rem;
    line-height: 1.65;
    margin-bottom: 24px;
  }
  .entry-label {
    display: block;
    font-size: .67rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 5px;
  }
  .entry-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .92rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    transition: all .2s;
    background: #f8fafc;
    letter-spacing: .5px;
  }
  .entry-input:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }
  .entry-input.err { border-color: #ef4444; background: #fef2f2; }
  .entry-err {
    font-size: .74rem;
    color: #dc2626;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .entry-btn {
    width: 100%;
    padding: 13px;
    border-radius: 8px;
    background: #1B3A6B;
    color: #fff;
    font-size: .92rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 14px;
    transition: all .2s;
    box-shadow: 0 4px 14px rgba(27,58,107,.3);
  }
  .entry-btn:hover:not(:disabled) {
    background: #15306090;
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(27,58,107,.38);
  }
  .entry-btn:disabled { opacity: .55; cursor: not-allowed; }
  .entry-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0;
    color: #cbd5e1;
    font-size: .72rem;
  }
  .entry-divider::before, .entry-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }

  /* ── SERVICES ── */
  .svc-section {
    padding: 44px 40px 36px;
    background: #F1F5F9;
  }
  .svc-inner { max-width: 1100px; margin: 0 auto; }
  .svc-heading {
    text-align: center;
    margin-bottom: 26px;
  }
  .svc-heading h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 6px;
  }
  .svc-heading p {
    color: #64748b;
    font-size: .84rem;
    line-height: 1.65;
    max-width: 520px;
    margin: 0 auto;
  }
  .svc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .svc-card {
    background: #fff;
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 16px;
    padding: 22px 20px 20px;
    cursor: pointer;
    transition: all .22s;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 18px rgba(27,58,107,.07);
  }
  .svc-card:hover {
    box-shadow: 0 8px 32px rgba(27,58,107,.13);
    transform: translateY(-2px);
  }
  .svc-card.selected {
    border-color: #2563EB;
    box-shadow: 0 6px 28px rgba(37,99,235,.16);
    transform: translateY(-2px);
  }
  .svc-check {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .2s;
    align-self: flex-end;
  }
  .svc-card.selected .svc-check {
    background: #2563EB;
    border-color: #2563EB;
  }
  .svc-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1B3A6B;
    line-height: 1.3;
  }
  .svc-desc {
    font-size: .79rem;
    color: #64748b;
    line-height: 1.75;
    flex: 1;
  }
  .svc-hl {
    color: #2563EB;
    font-weight: 600;
  }

  /* ── FORM + CHECKOUT ── */
  .form-section {
    background: #fff;
    border-top: 1px solid #e2e8f0;
    padding: 40px 40px 60px;
  }
  .form-inner { max-width: 1100px; margin: 0 auto; }
  .form-heading { margin-bottom: 28px; }
  .form-heading h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.15rem, 2.2vw, 1.5rem);
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 6px;
  }
  .form-heading p {
    color: #64748b;
    font-size: .86rem;
    line-height: 1.7;
  }
  .form-body {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }
  .form-left { flex: 1; min-width: 0; }
  .form-block { margin-bottom: 32px; }
  .form-block-title {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #94a3b8;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px;
  }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field.span2 { grid-column: span 2; }
  .form-label {
    font-size: .66rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .form-label .req { color: #ef4444; margin-left: 2px; }
  .form-input {
    padding: 10px 13px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .88rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    background: #f8fafc;
    transition: all .2s;
    width: 100%;
  }
  .form-input:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }
  .form-input[readOnly] {
    background: #f1f5f9;
    color: #64748b;
    cursor: default;
  }
  .form-input[readOnly]:focus { border-color: #e2e8f0; box-shadow: none; }
  .form-hint { font-size: .7rem; color: #94a3b8; margin-top: 2px; }
  .form-ein-section {
    background: #EFF6FF;
    border: 1.5px solid #BFDBFE;
    border-radius: 12px;
    padding: 20px 20px 22px;
    margin-top: 4px;
  }
  .form-ein-tag {
    display: inline-block;
    background: #2563EB;
    color: #fff;
    font-size: .62rem;
    font-weight: 700;
    letter-spacing: .7px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  /* ── CHECKOUT BOX ── */
  .co-box {
    width: 340px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(27,58,107,.1);
    position: sticky;
    top: 84px;
  }
  .co-title {
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 700;
    color: #1B3A6B;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f1f5f9;
  }
  .co-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
    font-size: .83rem;
  }
  .co-line-name { color: #374151; flex: 1; margin-right: 8px; }
  .co-line-price { color: #1B3A6B; font-weight: 600; white-space: nowrap; }
  .co-divider { height: 1px; background: #f1f5f9; margin: 14px 0; }
  .co-savings {
    display: flex;
    justify-content: space-between;
    font-size: .8rem;
    color: #16a34a;
    font-weight: 600;
    margin-bottom: 10px;
  }
  .co-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
  }
  .co-total-label {
    font-size: .82rem;
    font-weight: 700;
    color: #1B3A6B;
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  .co-total-amount {
    font-size: 1.45rem;
    font-weight: 700;
    color: #1B3A6B;
  }
  .co-total-amount span {
    font-size: .75rem;
    font-weight: 500;
    color: #94a3b8;
    margin-left: 3px;
  }
  .co-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    background: #1B3A6B;
    color: #fff;
    font-size: .92rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .2s;
    box-shadow: 0 4px 16px rgba(27,58,107,.28);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .co-btn:hover { background: #153060; transform: translateY(-1px); box-shadow: 0 7px 22px rgba(27,58,107,.36); }
  .co-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
  .co-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 14px;
    color: #94a3b8;
    font-size: .71rem;
  }
  .co-empty {
    text-align: center;
    color: #94a3b8;
    font-size: .8rem;
    padding: 20px 0;
  }

  @media (max-width: 960px) {
    .form-body { flex-direction: column; }
    .co-box { width: 100%; position: static; }
    .svc-section { padding: 36px 20px 28px; }
    .form-section { padding: 36px 20px 52px; }
  }
  @media (max-width: 700px) {
    .svc-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .form-field.span2 { grid-column: span 1; }
  }
  @media (max-width: 600px) {
    .nb-header { padding: 0 16px; }
    .nb-welcome { padding: 28px 20px 30px; }
    .entry-card { padding: 28px 22px; }
    .svc-section { padding: 32px 16px 24px; }
    .form-section { padding: 32px 16px 48px; }
  }
`

function NewBusinessContent() {
  const sp = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')

  const [view, setView]           = useState<PageView>('id-entry')
  const [docInput, setDocInput]   = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany]     = useState<Company | null>(null)
  const [lookupErr, setLookupErr] = useState('')

  const [selected, setSelected]   = useState<Set<string>>(new Set(SERVICES.map(s => s.id)))

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    companyName: '', address: '', city: '', zip: '',
    einFirstName: '', einLastName: '', einSsn: '', einTitle: '',
  })

  const lookup = useCallback(async (id: string): Promise<boolean> => {
    if (!id.trim()) return false
    setLookingUp(true); setLookupErr('')
    try {
      const res  = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.company) {
        setLookupErr(lang === 'es' ? 'Document ID no encontrado. Verifica e intenta de nuevo.' : 'Document ID not found. Please verify and try again.')
        return false
      }
      setCompany(data.company)
      return true
    } catch {
      setLookupErr(lang === 'es' ? 'Error de conexión. Intenta de nuevo.' : 'Connection error. Please try again.')
      return false
    } finally {
      setLookingUp(false)
    }
  }, [lang])

  useEffect(() => {
    const id = sp.get('id')
    const l  = sp.get('lang')
    if (l === 'es') setLang('es')
    if (id) { setDocInput(id); setView('landing'); lookup(id) }
  }, [sp, lookup])

  useEffect(() => {
    if (company) {
      setForm(f => ({
        ...f,
        companyName: company.company_name ?? '',
        address:     company.address ?? '',
        city:        company.city ?? '',
        zip:         company.zip ?? '',
        email:       company.email ?? '',
      }))
    }
  }, [company])

  async function handleIdEntry() {
    const empty = lang === 'es' ? 'Por favor ingresa tu Document ID.' : 'Please enter your Document ID.'
    if (!docInput.trim()) { setLookupErr(empty); return }
    const found = await lookup(docInput)
    if (found) { setView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  function toggleService(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function setField(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function getDesc(id: string) {
    if (id === 'labor_law') return lang === 'es'
      ? <>Florida requiere que todo negocio con <span className="svc-hl">al menos un empleado</span> muestre los avisos laborales vigentes. La tarifa mínima de Florida se actualiza cada año, por lo que tu póster debe mantenerse al día. Te entregamos un <span className="svc-hl">póster 2026 completamente actualizado y laminado profesionalmente — listo para colgar desde el primer día.</span></>
      : <>Florida requires <span className="svc-hl">every business with at least one employee</span> to display current state and federal labor law notices in a visible location. Florida's minimum wage updates every year, so your poster must stay current to remain compliant. We provide a <span className="svc-hl">fully updated, professionally laminated 2026 poster — ready to hang from day one.</span></>
    if (id === 'ein') return lang === 'es'
      ? <>Tu EIN es el número de identificación federal de tu negocio — emitido por el IRS y requerido para <span className="svc-hl">abrir una cuenta bancaria, contratar empleados, declarar impuestos y solicitar préstamos.</span> Sin él, <span className="svc-hl">la mayoría de los bancos no procesarán tu solicitud.</span> Nosotros gestionamos todo el proceso para que lo recibas rápido y sin trámites.</>
      : <>Your EIN is your business's federal identification number — issued by the IRS and required to <span className="svc-hl">open a business bank account, hire employees, file taxes, and apply for loans.</span> Without it, <span className="svc-hl">most banks won't process your application.</span> We handle the entire process so you receive it quickly and without the paperwork hassle.</>
    if (id === 'certificate') return lang === 'es'
      ? <>Este documento oficial del Departamento de Estado de Florida confirma que tu negocio está <span className="svc-hl">activo, autorizado para operar y al corriente con el estado.</span> Bancos, prestamistas y agencias gubernamentales lo solicitan al aplicar para financiamiento o abrir una cuenta comercial. Tenerlo listo significa <span className="svc-hl">sin demoras cuando llegue la oportunidad.</span></>
      : <>This official document from the Florida Department of State confirms that your business is <span className="svc-hl">active, authorized to operate, and in good standing with the state.</span> Banks, lenders, and government agencies commonly request it when you apply for financing or open a business account. Having it ready means <span className="svc-hl">no delays when opportunity comes knocking.</span></>
    return null
  }

  const einSelected   = selected.has('ein')
  const allSelected   = selected.size === SERVICES.length
  const subtotal      = SERVICES.filter(s => selected.has(s.id)).reduce((acc, s) => acc + s.price, 0)
  const discountAmt   = allSelected ? +(subtotal * 0.10).toFixed(2) : 0
  const total         = +(subtotal - discountAmt).toFixed(2)

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(SERVICES.map(s => s.id)))
  }

  const displayName = company?.company_name ?? 'SUNSHINE GLAZING LLC'

  const welcomeTitle = lang === 'es'
    ? <>¡Felicidades, <span>{displayName}!</span></>
    : <>Congratulations, <span>{displayName}!</span></>

  const welcomeSub = lang === 'es'
    ? 'Tu registro en el Estado de Florida ha sido exitoso. Estamos aquí para ayudarte a completar los pasos finales para que tu negocio sea plenamente operativo y cumpla con todas las normativas.'
    : 'Your registration with the State of Florida was successful. We are here to help you complete the final steps so your business is fully operational and compliant with all regulations.'

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: '#F1F5F9' }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header className="nb-header">
        <div className="nb-logo">
          <div className="nb-logo-mark">FL</div>
          <div className="nb-logo-text">
            <div className="l1">Florida Business Formation Center</div>
            <div className="l2">mybusinessformation.com</div>
          </div>
        </div>
        <div className="nb-header-right">
          <div className="nb-lang">
            {(['en', 'es'] as const).map(l => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href="tel:8001234567" className="nb-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            (800) 123-4567
          </a>
        </div>
      </header>

      {/* ── ID ENTRY ── */}
      {view === 'id-entry' && (
        <div className="entry-wrap">
          <div className="entry-card">
            <span className="entry-tag">
              {lang === 'es' ? 'Cumplimiento Empresarial' : 'Business Compliance'}
            </span>
            <h1 className="entry-title">
              {lang === 'es' ? 'Completa tu solicitud' : 'Complete your request'}
            </h1>
            <p className="entry-sub">
              {lang === 'es'
                ? 'Ingresa el Document ID del aviso que recibiste para localizar la información de tu empresa.'
                : 'Enter the Document ID from the notice you received to locate your business information.'}
            </p>
            <label className="entry-label" htmlFor="nb-doc">Document ID</label>
            <input
              id="nb-doc"
              className={`entry-input${lookupErr ? ' err' : ''}`}
              value={docInput}
              onChange={e => { setDocInput(e.target.value.toUpperCase()); setLookupErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleIdEntry()}
              placeholder={lang === 'es' ? 'ej. L26000098321' : 'e.g. L26000098321'}
            />
            {lookupErr && <p className="entry-err">⚠ {lookupErr}</p>}
            <button className="entry-btn" onClick={handleIdEntry} disabled={lookingUp}>
              {lookingUp
                ? (lang === 'es' ? 'Buscando...' : 'Looking up...')
                : (lang === 'es' ? 'Buscar mi empresa' : 'Find my business')}
            </button>

            {/* TEMP — remove before launch */}
            <div className="entry-divider">o</div>
            <button
              onClick={() => { setView('landing') }}
              style={{ width:'100%', background:'none', border:'1px dashed #cbd5e1', borderRadius:8, padding:'9px', fontSize:'.74rem', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit' }}
            >
              [TEMP] Ver landing sin Document ID →
            </button>
          </div>
        </div>
      )}

      {/* ── LANDING ── */}
      {view === 'landing' && (
        <>
          {/* WELCOME */}
          <section className="nb-welcome">
            <div className="nb-welcome-inner">
              <h1>{welcomeTitle}</h1>
              <p>{welcomeSub}</p>
            </div>
          </section>

          {/* ── SERVICES ── */}
          <section className="svc-section">
            <div className="svc-inner">
              <div className="svc-heading">
                <h2>{lang === 'es' ? 'Construye una Base Sólida' : 'Build a Strong Foundation'}</h2>
                <p>{lang === 'es'
                  ? 'Estos son los servicios principales incluidos en tu aviso para iniciar tu negocio protegido y sobre terreno sólido.'
                  : 'These are the core services included in your notice to start your business protected and on solid ground.'}</p>
              </div>

              <div className="svc-grid">
                {SERVICES.map(svc => {
                  const isSelected = selected.has(svc.id)
                  return (
                    <div
                      key={svc.id}
                      className={`svc-card${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleService(svc.id)}
                    >
                      <div className="svc-title">{lang === 'es' ? svc.titleEs : svc.titleEn}</div>
                      <div className="svc-desc">{getDesc(svc.id)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── FORM + CHECKOUT ── */}
          <section className="form-section">
            <div className="form-inner">
              <div className="form-heading">
                <h2>{lang === 'es' ? 'Completa tu información' : 'Complete your information'}</h2>
                <p>{lang === 'es'
                  ? 'Los datos de tu empresa han sido pre-llenados. Completa la información de contacto para procesar tu orden.'
                  : 'Complete your contact details to process your order.'}</p>
              </div>

              <div className="form-body">
                {/* ── LEFT: FORM ── */}
                <div className="form-left">
                  {/* Business info */}
                  <div className="form-block">
                    <div className="form-block-title">
                      {lang === 'es' ? 'Información del negocio' : 'Business information'}
                    </div>
                    <div className="form-grid">
                      <div className="form-field span2">
                        <label className="form-label">{lang === 'es' ? 'Nombre del negocio' : 'Business name'}</label>
                        <input className="form-input" value={form.companyName} readOnly />
                      </div>
                      <div className="form-field span2">
                        <label className="form-label">{lang === 'es' ? 'Dirección' : 'Address'}</label>
                        <input
                          className="form-input"
                          value={form.address}
                          onChange={e => setField('address', e.target.value)}
                          placeholder={lang === 'es' ? 'Calle y número' : 'Street address'}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{lang === 'es' ? 'Ciudad' : 'City'}</label>
                        <input
                          className="form-input"
                          value={form.city}
                          onChange={e => setField('city', e.target.value)}
                          placeholder="Miami"
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">ZIP Code</label>
                        <input
                          className="form-input"
                          value={form.zip}
                          onChange={e => setField('zip', e.target.value)}
                          placeholder="33101"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="form-block">
                    <div className="form-block-title">
                      {lang === 'es' ? 'Información de contacto' : 'Contact information'}
                    </div>
                    <div className="form-grid">
                      <div className="form-field">
                        <label className="form-label">{lang === 'es' ? 'Nombre' : 'First name'}<span className="req">*</span></label>
                        <input
                          className="form-input"
                          value={form.firstName}
                          onChange={e => setField('firstName', e.target.value)}
                          placeholder={lang === 'es' ? 'Juan' : 'John'}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{lang === 'es' ? 'Apellido' : 'Last name'}<span className="req">*</span></label>
                        <input
                          className="form-input"
                          value={form.lastName}
                          onChange={e => setField('lastName', e.target.value)}
                          placeholder={lang === 'es' ? 'García' : 'Smith'}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Email<span className="req">*</span></label>
                        <input
                          className="form-input"
                          type="email"
                          value={form.email}
                          onChange={e => setField('email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{lang === 'es' ? 'Teléfono' : 'Phone'}</label>
                        <input
                          className="form-input"
                          type="tel"
                          value={form.phone}
                          onChange={e => setField('phone', e.target.value)}
                          placeholder="(305) 000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EIN section */}
                  {einSelected && (
                    <div className="form-block">
                      <div className="form-ein-section">
                        <span className="form-ein-tag">EIN / Tax ID — {lang === 'es' ? 'Información adicional requerida' : 'Additional information required'}</span>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="form-label">{lang === 'es' ? 'Nombre del responsable' : 'Responsible party first name'}<span className="req">*</span></label>
                            <input
                              className="form-input"
                              value={form.einFirstName}
                              onChange={e => setField('einFirstName', e.target.value)}
                              placeholder={lang === 'es' ? 'Juan' : 'John'}
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">{lang === 'es' ? 'Apellido del responsable' : 'Responsible party last name'}<span className="req">*</span></label>
                            <input
                              className="form-input"
                              value={form.einLastName}
                              onChange={e => setField('einLastName', e.target.value)}
                              placeholder={lang === 'es' ? 'García' : 'Smith'}
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">SSN / ITIN<span className="req">*</span></label>
                            <input
                              className="form-input"
                              value={form.einSsn}
                              onChange={e => setField('einSsn', e.target.value)}
                              placeholder="XXX-XX-XXXX"
                            />
                            <span className="form-hint">{lang === 'es' ? 'Requerido por el IRS para asignar el EIN.' : 'Required by the IRS to issue your EIN.'}</span>
                          </div>
                          <div className="form-field">
                            <label className="form-label">{lang === 'es' ? 'Cargo / Título' : 'Title / Position'}<span className="req">*</span></label>
                            <input
                              className="form-input"
                              value={form.einTitle}
                              onChange={e => setField('einTitle', e.target.value)}
                              placeholder={lang === 'es' ? 'ej. Owner, Member' : 'e.g. Owner, Member'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT: CHECKOUT BOX ── */}
                <div className="co-box">
                  <div className="co-title">{lang === 'es' ? 'Resumen de Orden' : 'Order Summary'}</div>

                  {/* Select All row */}
                  <div
                    style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer' }}
                    onClick={toggleAll}
                  >
                    <div style={{
                      width:20, height:20, borderRadius:5,
                      border: allSelected ? 'none' : '2px solid #cbd5e1',
                      background: allSelected ? '#2563EB' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      transition:'all .2s'
                    }}>
                      {allSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize:'.82rem', fontWeight:700, color:'#1B3A6B', flex:1 }}>
                      {lang === 'es' ? 'Seleccionar todo' : 'Select all'}
                    </span>
                    <span style={{ fontSize:'.75rem', fontWeight:600, color:'#64748b' }}>
                      {lang === 'es' ? 'Precio' : 'Price'}
                    </span>
                  </div>

                  <div className="co-divider" style={{ marginTop:0 }} />

                  {/* Service lines — always show all, toggle checked state */}
                  {SERVICES.map(svc => {
                    const isOn = selected.has(svc.id)
                    return (
                      <div key={svc.id} className="co-line" style={{ alignItems:'center', gap:8 }}>
                        <div
                          style={{
                            width:18, height:18, borderRadius:4,
                            background: isOn ? '#2563EB' : 'transparent',
                            border: isOn ? 'none' : '2px solid #cbd5e1',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer',
                            transition:'all .2s'
                          }}
                          onClick={() => toggleService(svc.id)}
                        >
                          {isOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="co-line-name">{lang === 'es' ? svc.titleEs : svc.titleEn}</span>
                        <span className="co-line-price" style={{ color: isOn ? '#1B3A6B' : '#e2e8f0' }}>${svc.price.toFixed(2)}</span>
                      </div>
                    )
                  })}

                  <div className="co-divider" />

                  {/* 10% bundle discount */}
                  {allSelected && (
                    <div className="co-savings">
                      <span>🎉 10% {lang === 'es' ? 'Descuento Bundle' : 'Bundle Discount'}</span>
                      <span>−${discountAmt.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="co-total">
                    <span className="co-total-label">Total</span>
                    <span className="co-total-amount">
                      ${total.toFixed(2)}<span>USD</span>
                    </span>
                  </div>

                  <button className="co-btn" disabled={selected.size === 0}>
                    {lang === 'es' ? 'Proceder al Pago' : 'Proceed to Checkout'}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>

                  <div className="co-trust">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {lang === 'es' ? 'Pago 100% seguro con Stripe' : '100% secure payment with Stripe'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
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
