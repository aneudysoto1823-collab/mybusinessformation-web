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
    detail_en: 'Both Federal and State Law require every business with at least one employee to post current labor law notices in a clearly visible workplace area. This is not optional — non-compliance can lead to fines and legal consequences.',
    detail_es: 'Tanto la ley federal como la estatal exigen que todo negocio con al menos un empleado publique los avisos laborales vigentes en un área visible del lugar de trabajo. Esto no es opcional — el incumplimiento puede acarrear multas y consecuencias legales.',
  },
  certificate_of_status: {
    en: 'Certificate of Status',
    es: 'Certificado de Estado',
    price: 79.00,
    detail_en: 'Official proof your business is active and authorized to conduct business in the state of Florida. Often required when applying for loans, renewing business licenses, or opening a business bank account.',
    detail_es: 'Prueba oficial de que tu empresa está activa y autorizada para operar en el estado de Florida. Frecuentemente requerido al solicitar préstamos, renovar licencias o abrir una cuenta bancaria empresarial.',
  },
  ein: {
    en: 'EIN / Tax ID Number',
    es: 'EIN / Número Fiscal',
    price: 161.00,
    detail_en: 'An EIN is a 9-digit number issued by the IRS to identify your business. Every business must obtain an EIN to open a bank account, hire employees, file federal tax returns, and conduct business with government agencies.',
    detail_es: 'Un EIN es un número de 9 dígitos emitido por el IRS para identificar tu negocio. Todo negocio debe obtener un EIN para abrir una cuenta bancaria, contratar empleados, presentar declaraciones federales y realizar trámites con agencias gubernamentales.',
  },
}

const SERVICE_ORDER: ServiceId[] = ['labor_law_poster', 'certificate_of_status', 'ein']

const REASON_OPTIONS = {
  en: [
    { value: 'new_business', label: 'Started a new business' },
    { value: 'hired_employees', label: 'Hired or will hire employees' },
    { value: 'banking', label: 'Banking purposes' },
    { value: 'changed_type', label: 'Changed type of organization' },
    { value: 'purchased_business', label: 'Purchased a going business' },
    { value: 'created_trust', label: 'Created a trust' },
    { value: 'created_pension', label: 'Created a pension plan' },
    { value: 'other', label: 'Other' },
  ],
  es: [
    { value: 'new_business', label: 'Apertura de nuevo negocio' },
    { value: 'hired_employees', label: 'Contrató o contratará empleados' },
    { value: 'banking', label: 'Propósitos bancarios' },
    { value: 'changed_type', label: 'Cambio de tipo de organización' },
    { value: 'purchased_business', label: 'Compró un negocio en operación' },
    { value: 'created_trust', label: 'Creación de un fideicomiso' },
    { value: 'created_pension', label: 'Creación de plan de pensión' },
    { value: 'other', label: 'Otro' },
  ],
}

const ACTIVITY_OPTIONS = {
  en: [
    { value: 'construction', label: 'Construction' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'rental_leasing', label: 'Rental & Leasing' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'transportation', label: 'Transportation & Warehousing' },
    { value: 'finance', label: 'Finance & Insurance' },
    { value: 'healthcare', label: 'Health Care & Social Assistance' },
    { value: 'food_service', label: 'Accommodation & Food Service' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'retail', label: 'Retail' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
  ],
  es: [
    { value: 'construction', label: 'Construcción' },
    { value: 'real_estate', label: 'Bienes Raíces' },
    { value: 'rental_leasing', label: 'Alquiler y Arrendamiento' },
    { value: 'manufacturing', label: 'Manufactura' },
    { value: 'transportation', label: 'Transporte y Almacenamiento' },
    { value: 'finance', label: 'Finanzas y Seguros' },
    { value: 'healthcare', label: 'Salud y Asistencia Social' },
    { value: 'food_service', label: 'Alojamiento y Servicios de Comida' },
    { value: 'wholesale', label: 'Mayorista' },
    { value: 'retail', label: 'Minorista' },
    { value: 'professional', label: 'Servicios Profesionales' },
    { value: 'other', label: 'Otro' },
  ],
}

const T = {
  en: {
    topbar_name: 'Florida Business Formation Center',
    svc_section: 'Our Services',
    personal_title: 'Owner Information',
    form_title: 'Business Information',
    doc_id: 'Document ID',
    doc_placeholder: 'e.g. L26000075446',
    looking_up: 'Looking up...',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    address1: 'Address Line 1',
    address2: 'Address Line 2',
    city: 'City',
    state_lbl: 'State',
    zip: 'Zip Code',
    biz_name: 'Business Name',
    continue_btn: 'Continue',
    back_btn: 'Back',
    ein_title: 'EIN Application Information',
    responsible_party: 'Responsible Party',
    responsible_party_hint: 'Full legal name of the individual who controls the entity',
    ssn_itin: 'SSN or ITIN',
    ssn_hint: 'Protected under federal privacy law (IRS Form SS-4)',
    reason_ein: 'Reason for Applying',
    business_activity: 'Principal Business Activity',
    exp_employees: 'Expected Employees (next 12 months)',
    start_date: 'Date Business Started',
    select_opt: 'Select an option...',
    step_label: 'Step',
    step_of: 'of',
    err_step1: 'Please complete all required fields (First Name, Last Name, Email, Business Name) before continuing.',
    err_step2: 'Please complete all EIN fields before proceeding to checkout.',
    err_terms: 'Please accept the Terms of Service.',
    cart_title: 'My Cart',
    select_all: 'Select All',
    price_lbl: 'Price',
    discount_lbl: '10% Combo Discount',
    subtotal: 'Cart Total',
    total: 'Total',
    checkout_btn: 'Proceed to Checkout',
    processing: 'Processing...',
    terms: 'I agree to',
    terms_link: 'Terms of Service',
    footer_note: 'Secure payment · 256-bit SSL · FloridaBusinessFormationCenter.com',
    select_one: 'Please select at least one service.',
    autofill_success: 'Company found — fields auto-filled.',
    autofill_error: 'Document ID not found in our records.',
  },
  es: {
    topbar_name: 'Florida Business Formation Center',
    svc_section: 'Nuestros Servicios',
    personal_title: 'Información del Propietario',
    form_title: 'Información del Negocio',
    doc_id: 'Document ID',
    doc_placeholder: 'ej. L26000075446',
    looking_up: 'Buscando...',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address1: 'Dirección Línea 1',
    address2: 'Dirección Línea 2',
    city: 'Ciudad',
    state_lbl: 'Estado',
    zip: 'Código Postal',
    biz_name: 'Nombre del Negocio',
    continue_btn: 'Continuar',
    back_btn: 'Regresar',
    ein_title: 'Información para el EIN',
    responsible_party: 'Responsable del Negocio',
    responsible_party_hint: 'Nombre legal completo del propietario que controla la entidad',
    ssn_itin: 'SSN o ITIN',
    ssn_hint: 'Protegido por la ley federal de privacidad (Formulario IRS SS-4)',
    reason_ein: 'Razón de la Solicitud',
    business_activity: 'Actividad Principal del Negocio',
    exp_employees: 'Empleados Esperados (próximos 12 meses)',
    start_date: 'Fecha de Inicio de Operaciones',
    select_opt: 'Seleccione una opción...',
    step_label: 'Paso',
    step_of: 'de',
    err_step1: 'Por favor complete todos los campos requeridos (Nombre, Apellido, Correo, Nombre del Negocio) antes de continuar.',
    err_step2: 'Por favor complete toda la información del EIN antes de proceder al pago.',
    err_terms: 'Debe aceptar los Términos de Servicio.',
    cart_title: 'Mi Carrito',
    select_all: 'Seleccionar Todo',
    price_lbl: 'Precio',
    discount_lbl: 'Descuento 10% Combo',
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

  const [step, setStep] = useState(1)
  const [stepError, setStepError] = useState('')

  const [docInput, setDocInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [autofillMsg, setAutofillMsg] = useState('')

  const [formFields, setFormFields] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address1: '', address2: '', city: '', state: 'FL', zip: '', businessName: '',
  })

  const [einFields, setEinFields] = useState({
    responsibleParty: '',
    ssn: '',
    reasonForEin: '',
    businessActivity: '',
    expectedEmployees: '',
    startDate: '',
  })

  const [selected, setSelected] = useState<Set<ServiceId>>(new Set(SERVICE_ORDER))
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [shipDifferent, setShipDifferent] = useState(false)
  const [shipFields, setShipFields] = useState({ address1: '', address2: '', city: '', state: 'FL', zip: '' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const allSelected = selected.size === SERVICE_ORDER.length
  const subtotal = [...selected].reduce((sum, id) => sum + SERVICES[id].price, 0)
  const discount = allSelected ? parseFloat((subtotal * 0.10).toFixed(2)) : 0
  const total = parseFloat((subtotal - discount).toFixed(2))

  function validateStep1() {
    const { firstName, lastName, email, businessName } = formFields
    return firstName.trim() && lastName.trim() && email.trim() && businessName.trim()
  }

  function validateStep2() {
    const { responsibleParty, ssn, reasonForEin, businessActivity, expectedEmployees, startDate } = einFields
    return responsibleParty.trim() && ssn.trim() && reasonForEin && businessActivity && expectedEmployees && startDate
  }

  function handleContinue() {
    if (!validateStep1()) { setStepError(t.err_step1); return }
    setStepError('')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    if (step < 2) {
      setPayError(lang === 'es' ? 'Por favor completa el paso 1 antes de proceder al pago.' : 'Please complete Step 1 before proceeding to checkout.')
      return
    }
    if (!validateStep2()) { setPayError(t.err_step2); return }
    if (!termsAccepted) { setPayError(t.err_terms); return }
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
          ein_info: einFields,
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
        .nb-image{width:33%;flex-shrink:0;position:sticky;top:0;height:100vh;overflow:hidden;background:#f4f6f9}
        .nb-image img{width:100%;height:100%;object-fit:contain;object-position:top left;display:block}
        .nb-image::after{content:'';position:absolute;inset:0;background:linear-gradient(to right,transparent 82%,#f4f6f9 100%),linear-gradient(to bottom,transparent 86%,#f4f6f9 100%);pointer-events:none;z-index:1}
        .nb-content{flex:1;background:#f4f6f9;min-height:100vh}

        .svc-descriptions{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:transparent}
        .svc-desc-item{padding:22px 24px}
        .svc-desc-name{font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:10px;font-family:'Fraunces',serif}
        .svc-desc-text{font-size:.88rem;color:#475569;line-height:1.7}

        .nb-main{display:grid;grid-template-columns:1fr 360px;gap:32px;padding:32px 36px 56px;align-items:start}

        .form-section{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 20px;box-shadow:0 4px 24px rgba(28,46,68,.08)}

        .step-indicator{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1.5px solid #f1f5f9}
        .step-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800}
        .step-dot.active{background:var(--navy);color:#fff}
        .step-dot.done{background:#dcfce7;color:#166534}
        .step-dot.pending{background:#f1f5f9;color:#94a3b8}
        .step-label-txt{font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
        .step-anim{animation:stepIn .18s ease-out}
        @keyframes stepIn{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

        .form-title{font-size:.92rem;font-weight:700;color:var(--navy);margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
        .form-field{margin-bottom:7px}
        .s2-fields .form-field{margin-bottom:14px}
        .form-label{display:block;font-size:.66rem;font-weight:700;color:#374151;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
        .req{color:#ef4444;margin-left:2px}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .form-input{width:100%;padding:7px 10px;border:1.5px solid #d1d5db;border-radius:7px;font-size:.81rem;font-family:inherit;color:#1e293b;outline:none;transition:border-color .2s;background:#fff}
        .form-input:focus{border-color:var(--blue)}
        .form-input.autofilled{background:#f0f9ff;border-color:#bae6fd}
        select.form-input{cursor:pointer}
        .form-hint{font-size:.67rem;color:#94a3b8;margin-top:3px;line-height:1.4}
        .autofill-msg{font-size:.72rem;margin-top:4px;padding:5px 9px;border-radius:6px}
        .autofill-msg.success{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
        .autofill-msg.error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
        .ship-toggle{display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer;font-size:.8rem;color:#374151;font-weight:600;user-select:none}
        .ship-toggle input{width:15px;height:15px;cursor:pointer;accent-color:var(--blue)}
        .ship-section{margin-top:12px;padding-top:12px;border-top:1px dashed #d1d5db}
        .ship-section-title{font-size:.75rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}

        .step-error{font-size:.74rem;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:7px 11px;margin-top:10px}
        .btn-continue{width:100%;padding:10px;border-radius:8px;background:#fff;color:var(--blue);font-size:.88rem;font-weight:700;border:2px solid var(--blue);cursor:pointer;font-family:inherit;margin-top:12px;transition:all .2s}
        .btn-continue:hover{background:#eff6ff}
        .step-actions{display:flex;gap:10px;margin-top:16px;padding-top:14px;border-top:1.5px solid #f1f5f9}
        .btn-back{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:7px;color:#374151;font-size:.82rem;font-weight:600;cursor:pointer;font-family:inherit;padding:9px 14px;transition:all .15s}
        .btn-back:hover{background:#f1f5f9;border-color:#cbd5e1;color:var(--navy)}
        .btn-review{flex:2;padding:9px;border-radius:8px;background:linear-gradient(135deg,#1C2E44,#2563EB);color:#fff;font-size:.86rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 3px 10px rgba(37,99,235,.25)}
        .btn-review:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(37,99,235,.35)}
        .btn-review:disabled{opacity:.6;cursor:not-allowed;transform:none}

        .cart-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:26px;position:sticky;top:20px;box-shadow:0 4px 24px rgba(28,46,68,.10)}
        .cart-title{font-family:'Fraunces',serif;font-size:1.5rem;font-weight:900;color:var(--navy);margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #e2e8f0}
        .cart-header-row{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #e2e8f0;margin-bottom:4px}
        .cart-header-lbl{font-size:.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
        .cart-item{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #f1f5f9}
        .cart-item:last-of-type{border-bottom:none}
        .cart-checkbox{width:18px;height:18px;border-radius:4px;border:2px solid #d1d5db;background:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .cart-checkbox.checked{background:var(--blue);border-color:var(--blue)}
        .cart-item-name{flex:1;font-size:.84rem;color:#1e293b;font-weight:500}
        .cart-item-price{font-size:.9rem;font-weight:700;color:var(--navy);white-space:nowrap}
        .cart-totals{margin-top:16px;border-top:1.5px solid #e2e8f0;padding-top:14px}
        .cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.84rem;color:#475569}
        .cart-discount-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.84rem;color:#059669;font-weight:600}
        .cart-grand-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:2px solid #1C2E44;background:#f8fafc;margin-left:-26px;margin-right:-26px;padding-left:26px;padding-right:26px;border-bottom-left-radius:14px;border-bottom-right-radius:14px;margin-bottom:-26px;padding-bottom:16px}
        .cart-grand-lbl{font-size:1rem;font-weight:700;color:var(--navy)}
        .cart-grand-val{font-size:1.35rem;font-weight:900;color:var(--navy)}
        .btn-checkout{width:100%;padding:14px;border-radius:8px;background:linear-gradient(135deg,#1C2E44,#2563EB);color:#fff;font-size:.95rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;margin-top:20px;box-shadow:0 4px 14px rgba(37,99,235,.3)}
        .btn-checkout:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.4)}
        .btn-checkout:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .terms-row{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.74rem;color:#64748b}
        .terms-row a{color:var(--blue);text-decoration:underline}
        .terms-row input{cursor:pointer;width:15px;height:15px;flex-shrink:0;accent-color:var(--blue)}
        .discount-badge{display:inline-block;background:#dcfce7;color:#166534;font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;border:1px solid #bbf7d0}

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
        {/* Image — left */}
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

            {/* Form column */}
            <div style={{ maxWidth: 520, margin: '0 auto', marginTop: 40 }}>
            <div className="form-section">

              {/* Step indicator */}
              <div className="step-indicator">
                <div className={`step-dot ${step === 1 ? 'active' : 'done'}`}>
                  {step === 1 ? '1' : '✓'}
                </div>
                <div className={`step-dot ${step === 2 ? 'active' : 'pending'}`} style={{ marginLeft: 2 }}>2</div>
                <span className="step-label-txt" style={{ marginLeft: 4 }}>
                  {t.step_label} {step} {t.step_of} 2
                </span>
              </div>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="step-anim">

                  {/* Document ID */}
                  <div className="form-field">
                    <label className="form-label">{t.doc_id}</label>
                    <input
                      className="form-input"
                      value={docInput}
                      onChange={e => { setDocInput(e.target.value.toUpperCase()); setAutofillMsg('') }}
                      onBlur={() => docInput.trim().length >= 5 && lookup(docInput)}
                      onKeyDown={e => e.key === 'Enter' && lookup(docInput)}
                      placeholder={t.doc_placeholder}
                    />
                    {lookingUp && <p style={{ fontSize: '.73rem', color: '#2563EB', marginTop: 4 }}>{t.looking_up}</p>}
                    {autofillMsg && (
                      <div className={`autofill-msg ${autofillMsg === t.autofill_success ? 'success' : 'error'}`}>{autofillMsg}</div>
                    )}
                  </div>

                  {/* Owner Information */}
                  <div className="form-title" style={{ marginTop: 16 }}>{t.personal_title}</div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">{t.first_name}<span className="req">*</span></label>
                      <input className="form-input" value={formFields.firstName} onChange={e => setFormFields(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{t.last_name}<span className="req">*</span></label>
                      <input className="form-input" value={formFields.lastName} onChange={e => setFormFields(p => ({ ...p, lastName: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{t.email}<span className="req">*</span></label>
                      <input className="form-input" value={formFields.email} onChange={e => setFormFields(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{t.phone}</label>
                      <input className="form-input" value={formFields.phone} onChange={e => setFormFields(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="form-title" style={{ marginTop: 16 }}>{t.form_title}</div>
                  <div className="form-field">
                    <label className="form-label">{t.biz_name}<span className="req">*</span></label>
                    <input className={`form-input${company ? ' autofilled' : ''}`} value={formFields.businessName} onChange={e => setFormFields(p => ({ ...p, businessName: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.address1}</label>
                    <input className={`form-input${company ? ' autofilled' : ''}`} value={formFields.address1} onChange={e => setFormFields(p => ({ ...p, address1: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.address2}</label>
                    <input className="form-input" value={formFields.address2} onChange={e => setFormFields(p => ({ ...p, address2: e.target.value }))} />
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">{t.city}</label>
                      <input className={`form-input${company ? ' autofilled' : ''}`} value={formFields.city} onChange={e => setFormFields(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{t.zip}</label>
                      <input className={`form-input${company ? ' autofilled' : ''}`} value={formFields.zip} onChange={e => setFormFields(p => ({ ...p, zip: e.target.value }))} />
                    </div>
                  </div>

                  {/* Ship to different address */}
                  <label className="ship-toggle">
                    <input type="checkbox" checked={shipDifferent} onChange={e => setShipDifferent(e.target.checked)} />
                    {lang === 'es' ? '¿Enviar a una dirección diferente?' : 'Shipping to a different address?'}
                  </label>
                  {shipDifferent && (
                    <div className="ship-section">
                      <div className="ship-section-title">{lang === 'es' ? 'Dirección de Envío' : 'Shipping Address'}</div>
                      <div className="form-field">
                        <label className="form-label">{t.address1}</label>
                        <input className="form-input" value={shipFields.address1} onChange={e => setShipFields(p => ({ ...p, address1: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.address2}</label>
                        <input className="form-input" value={shipFields.address2} onChange={e => setShipFields(p => ({ ...p, address2: e.target.value }))} />
                      </div>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">{t.city}</label>
                          <input className="form-input" value={shipFields.city} onChange={e => setShipFields(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">{t.zip}</label>
                          <input className="form-input" value={shipFields.zip} onChange={e => setShipFields(p => ({ ...p, zip: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {stepError && <div className="step-error">{stepError}</div>}
                  <button className="btn-continue" onClick={handleContinue}>{t.continue_btn} →</button>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="step-anim">
                  <div className="form-title">{t.ein_title}</div>

                  <div className="s2-fields">
                    <div className="form-field">
                      <label className="form-label">{t.responsible_party}<span className="req">*</span></label>
                      <input className="form-input" value={einFields.responsibleParty} onChange={e => setEinFields(p => ({ ...p, responsibleParty: e.target.value }))} />
                      <p className="form-hint">{t.responsible_party_hint}</p>
                    </div>

                    <div className="form-field">
                      <label className="form-label">{t.ssn_itin}<span className="req">*</span></label>
                      <input className="form-input" value={einFields.ssn} onChange={e => setEinFields(p => ({ ...p, ssn: e.target.value }))} placeholder="XXX-XX-XXXX" />
                      <p className="form-hint">🔒 {t.ssn_hint}</p>
                    </div>

                    <div className="form-field">
                      <label className="form-label">{t.reason_ein}<span className="req">*</span></label>
                      <select className="form-input" value={einFields.reasonForEin} onChange={e => setEinFields(p => ({ ...p, reasonForEin: e.target.value }))}>
                        <option value="">{t.select_opt}</option>
                        {REASON_OPTIONS[lang].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">{t.business_activity}<span className="req">*</span></label>
                      <select className="form-input" value={einFields.businessActivity} onChange={e => setEinFields(p => ({ ...p, businessActivity: e.target.value }))}>
                        <option value="">{t.select_opt}</option>
                        {ACTIVITY_OPTIONS[lang].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div className="form-grid">
                      <div className="form-field">
                        <label className="form-label">{t.exp_employees}<span className="req">*</span></label>
                        <select className="form-input" value={einFields.expectedEmployees} onChange={e => setEinFields(p => ({ ...p, expectedEmployees: e.target.value }))}>
                          <option value="">{t.select_opt}</option>
                          <option value="0">0</option>
                          <option value="1-4">1 – 4</option>
                          <option value="5-19">5 – 19</option>
                          <option value="20-99">20 – 99</option>
                          <option value="100+">100+</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.start_date}<span className="req">*</span></label>
                        <input type="month" className="form-input" value={einFields.startDate} onChange={e => setEinFields(p => ({ ...p, startDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="step-actions">
                    <button className="btn-back" onClick={() => { setStep(1); setStepError('') }}>← {t.back_btn}</button>
                    <button className="btn-review" onClick={handlePay} disabled={paying}>
                      {paying ? t.processing : (lang === 'es' ? 'Revisar mi Orden →' : 'Review My Order →')}
                    </button>
                  </div>
                </div>
              )}

            </div>{/* end form-section */}
            </div>{/* end form column wrapper */}

            {/* Cart */}
            <div className="cart-card" style={{ marginTop: 40 }}>
              <div className="cart-title">{t.cart_title}</div>

              <div className="cart-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`cart-checkbox${allSelected ? ' checked' : ''}`} onClick={toggleAll} style={{ cursor: 'pointer' }}>
                    {allSelected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: '.82rem', color: '#1e293b', fontWeight: 600 }}>{t.select_all}</span>
                  {allSelected && <span className="discount-badge">10% OFF</span>}
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

              {payError && <p style={{ color: '#ef4444', fontSize: '.76rem', marginTop: 10, textAlign: 'center' }}>{payError}</p>}

              <button className="btn-checkout" onClick={handlePay} disabled={paying || selected.size === 0}>
                {paying ? t.processing : t.checkout_btn}
              </button>

              <div className="terms-row">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>{t.terms} <a href="/legal" target="_blank">{t.terms_link}</a></span>
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 36px 16px', padding: '16px 0 0' }}>
            <p style={{ fontSize: '.7rem', color: '#94a3b8', lineHeight: 1.6, textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
              {lang === 'es'
                ? 'Florida Business Formation Center es un servicio de preparación y presentación de documentos. No somos una firma de abogados y no brindamos asesoría legal, fiscal ni financiera. La información en este sitio web es solo para fines informativos generales. El uso de nuestros servicios no crea una relación abogado-cliente. Para asesoría legal específica, consulte a un abogado licenciado en Florida.'
                : 'Florida Business Formation Center is a document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. The information on this website is for general informational purposes only. Use of our services does not create an attorney-client relationship. For legal advice specific to your situation, please consult a licensed Florida attorney.'}
            </p>
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
