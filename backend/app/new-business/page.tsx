'use client'

import { useState, useEffect, useCallback, Suspense, Fragment } from 'react'
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
type PageView = 'id-entry' | 'landing' | 'ein-form'
type EinStep = 1 | 2 | 'review'

const SERVICES: Record<ServiceId, {
  en: string; es: string; price: number
  short_en: string; short_es: string
  detail_en: string; detail_es: string
}> = {
  labor_law_poster: {
    en: 'Labor Law Posters',
    es: 'Póster de Leyes Laborales',
    price: 120.00,
    short_en: 'Required by law for all workplaces with employees.',
    short_es: 'Requerido por ley para todo lugar de trabajo con empleados.',
    detail_en: 'Both Federal and State Law require every business with at least one employee to post current labor law notices in a clearly visible workplace area. Non-compliance can lead to fines and legal consequences.',
    detail_es: 'La ley federal y estatal exigen que todo negocio con al menos un empleado publique avisos laborales vigentes en un área visible. El incumplimiento puede acarrear multas y consecuencias legales.',
  },
  ein: {
    en: 'EIN (Tax ID)',
    es: 'EIN (Tax ID)',
    price: 161.00,
    short_en: 'Essential for banking, hiring, and taxes.',
    short_es: 'Esencial para banca, contratación e impuestos.',
    detail_en: 'An EIN is a 9-digit number issued by the IRS to identify your business. Required to open a bank account, hire employees, file federal taxes, and conduct business with government agencies.',
    detail_es: 'Un EIN es un número de 9 dígitos emitido por el IRS. Requerido para abrir cuenta bancaria, contratar empleados, presentar declaraciones federales y tramitar con agencias gubernamentales.',
  },
  certificate_of_status: {
    en: 'Certificate of Status',
    es: 'Certificado de Estado',
    price: 79.00,
    short_en: 'Official proof of your business\'s active status.',
    short_es: 'Prueba oficial del estado activo de tu empresa.',
    detail_en: 'Official proof your business is active and authorized to operate in Florida. Often required when applying for loans, renewing licenses, or opening a business bank account.',
    detail_es: 'Prueba oficial de que tu empresa está activa y autorizada en Florida. Frecuentemente requerido al solicitar préstamos, renovar licencias o abrir cuenta bancaria empresarial.',
  },
}

const SERVICE_ORDER: ServiceId[] = ['labor_law_poster', 'ein', 'certificate_of_status']

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
    { value: 'accommodations', label: 'Accommodations', desc: 'Casino hotel, hotel, or motel' },
    { value: 'construction', label: 'Construction', desc: 'Building houses/residential structures, specialty trade contractors' },
    { value: 'finance', label: 'Finance', desc: 'Banks, mortgage company, securities broker, investment advice' },
    { value: 'food_service', label: 'Food Service', desc: 'Restaurant, bar, coffee shop, catering, mobile food service' },
    { value: 'health_care', label: 'Health Care', desc: 'Doctor, mental health specialist, hospital' },
    { value: 'insurance', label: 'Insurance', desc: 'Insurance company or broker' },
    { value: 'manufacturing', label: 'Manufacturing', desc: 'Mechanical/physical/chemical transformation of materials' },
    { value: 'real_estate', label: 'Real Estate', desc: 'Renting/leasing/managing real estate, agent/broker' },
    { value: 'rental_leasing', label: 'Rental & Leasing', desc: 'Rent/lease automobiles, consumer/commercial/industrial goods' },
    { value: 'retail', label: 'Retail', desc: 'Retail store, internet sales, direct sales, auction house' },
    { value: 'social_assistance', label: 'Social Assistance', desc: 'Youth services, residential care, services for disabled' },
    { value: 'transportation', label: 'Transportation', desc: 'Air/rail/water transportation, trucking, delivery/courier' },
    { value: 'warehousing', label: 'Warehousing', desc: 'Warehousing/storage facilities for general merchandise' },
    { value: 'wholesale', label: 'Wholesale', desc: 'Wholesale agent/broker, importer, exporter, distributor' },
    { value: 'other', label: 'Other', desc: '' },
  ],
  es: [
    { value: 'accommodations', label: 'Alojamiento', desc: 'Hotel casino, hotel o motel' },
    { value: 'construction', label: 'Construcción', desc: 'Construcción de casas/estructuras residenciales, contratistas' },
    { value: 'finance', label: 'Finanzas', desc: 'Bancos, hipotecas, corredor de valores, asesoría de inversión' },
    { value: 'food_service', label: 'Servicio de Alimentos', desc: 'Restaurante, bar, café, catering, servicio de comida móvil' },
    { value: 'health_care', label: 'Salud', desc: 'Médico, especialista en salud mental, hospital' },
    { value: 'insurance', label: 'Seguros', desc: 'Compañía o corredor de seguros' },
    { value: 'manufacturing', label: 'Manufactura', desc: 'Transformación mecánica/física/química de materiales' },
    { value: 'real_estate', label: 'Bienes Raíces', desc: 'Alquiler/gestión de bienes raíces, agente/corredor' },
    { value: 'rental_leasing', label: 'Alquiler y Arrendamiento', desc: 'Alquiler de automóviles, bienes de consumo/comerciales' },
    { value: 'retail', label: 'Minorista', desc: 'Tienda al por menor, ventas por internet, ventas directas' },
    { value: 'social_assistance', label: 'Asistencia Social', desc: 'Servicios para jóvenes, cuidado residencial, discapacitados' },
    { value: 'transportation', label: 'Transporte', desc: 'Transporte aéreo/ferroviario/acuático, camionaje, mensajería' },
    { value: 'warehousing', label: 'Almacenamiento', desc: 'Almacenes/instalaciones de almacenamiento para mercancía' },
    { value: 'wholesale', label: 'Mayorista', desc: 'Agente/corredor mayorista, importador, exportador, distribuidor' },
    { value: 'other', label: 'Otro', desc: '' },
  ],
}

const TITLE_OPTIONS = {
  en: [
    { value: 'owner', label: 'I am one of the owners / members' },
    { value: 'officer', label: 'I am an officer of the corporation' },
    { value: 'third_party', label: 'I am a third-party designee' },
    { value: 'other', label: 'Other' },
  ],
  es: [
    { value: 'owner', label: 'Soy uno de los propietarios / miembros' },
    { value: 'officer', label: 'Soy un oficial de la corporación' },
    { value: 'third_party', label: 'Soy un designado de terceros' },
    { value: 'other', label: 'Otro' },
  ],
}

const CLOSING_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const T = {
  en: {
    phone: '(800) 123-4567',
    header_name_1: 'Florida Business',
    header_name_2: 'Formation Center',
    call_us: 'Call Us:',
    // ID entry
    entry_title: 'Complete Your Business Compliance Request',
    entry_subtitle: 'Enter your Document ID to locate your business information and continue.',
    entry_why_title: 'Why You Received a Document ID',
    entry_why_body: 'Your Document ID allows us to securely locate your business information and provide the compliance documents associated with your recent business registration.',
    entry_doc_label: 'Document ID',
    entry_doc_placeholder: 'e.g. L26000075446',
    entry_btn: 'Continue',
    entry_error: 'Document ID not found. Please verify and try again.',
    entry_empty: 'Please enter your Document ID.',
    looking_up: 'Looking up your business...',
    // Landing
    welcome: 'Welcome,',
    welcome_generic: 'Welcome to Florida Business Formation Center',
    hero_subtitle: 'Your business information has been located successfully. Please',
    hero_subtitle_bold: 'review and complete',
    hero_subtitle_end: 'the required compliance documents below to keep your company protected and in good standing.',
    action_title: 'ACTION REQUIRED — Keep Your Business Protected and Compliant',
    action_subtitle: 'As a newly registered business in the State of Florida, there are a few important steps you may need to complete.',
    select_toggle: 'Select All',
    deselect_toggle: 'Deselect All',
    combo_badge: '10% Combo Discount Applied',
    info_title: 'Your Information',
    info_doc_id: 'Document ID',
    info_llc_name: 'LLC Name',
    info_address: 'Business Address',
    info_notice_date: 'Date of Notice',
    info_email: 'Contact Email',
    info_phone: 'Phone Number',
    info_email_placeholder: 'Enter your email',
    info_phone_placeholder: 'Enter your phone',
    order_title: 'Order Summary',
    discount_lbl: 'Discount',
    total_lbl: 'Total',
    checkout_btn: 'Proceed to Checkout',
    processing: 'Processing...',
    terms: 'I agree to the',
    terms_link: 'Terms of Service',
    select_one: 'Please select at least one service.',
    err_terms: 'Please accept the Terms of Service.',
    // Notice
    notice_title: 'Important Notice',
    notice_1: 'Florida Business Formation Center is a privately owned third-party document preparation service and is not affiliated with any government agency, including the IRS, Department of Labor, or Florida Department of State.',
    notice_2: 'This is a solicitation for services, not an official government notice. Fees include administrative and processing costs. All sales are final and non-refundable.',
    // EIN Form
    ein_form_title: 'EIN Application — Additional Information',
    ein_form_back: '← Back to Order',
    ein_step_identity: 'Identity',
    ein_step_llc: 'LLC Details',
    ein_step_review: 'Review',
    responsible_party: 'Responsible Party',
    responsible_party_hint: 'Full legal name of the individual who controls the entity',
    title_role: 'Your Role',
    select_role: 'Select your role...',
    ssn_itin: 'SSN or ITIN',
    ssn_confirm: 'Confirm SSN or ITIN',
    ssn_mismatch: 'SSN/ITIN fields do not match.',
    ssn_hint: 'Protected under federal privacy law (IRS Form SS-4)',
    reason_ein: 'Reason for Applying',
    entity_type: 'Entity Type',
    llc_members: 'Number of Members',
    start_date: 'Date Business Started',
    closing_month: 'Fiscal Year Closing Month',
    has_w2: 'Do you expect W-2 employees in the next 12 months?',
    q_highway: 'Does your business own a highway motor vehicle with a taxable gross weight of 55,000 lbs or more?',
    q_gambling: 'Does your business involve gambling or wagering?',
    q_excise: 'Does your business need to file Form 720 (Quarterly Federal Excise Tax)?',
    q_atf: 'Does your business sell or manufacture alcohol, tobacco, or firearms?',
    business_activity: 'Principal Business Activity',
    business_activity_other: 'Describe your business activity',
    select_opt: 'Select an option...',
    continue_btn: 'Continue',
    back_btn: 'Back',
    err_step1: 'Please complete all required identity fields.',
    err_step2: 'Please complete all required entity detail fields.',
    review_title: 'Review Your Information',
    review_identity: 'Identity',
    review_llc: 'Entity Details',
    review_services: 'Services',
    review_edit: 'Edit',
    review_checkout: 'Proceed to Checkout',
    yes: 'Yes',
    no: 'No',
  },
  es: {
    phone: '(800) 123-4567',
    header_name_1: 'Florida Business',
    header_name_2: 'Formation Center',
    call_us: 'Llámanos:',
    // ID entry
    entry_title: 'Completa tu Solicitud de Cumplimiento Empresarial',
    entry_subtitle: 'Ingresa tu Document ID para localizar la información de tu empresa y continuar.',
    entry_why_title: 'Por qué recibiste un Document ID',
    entry_why_body: 'Tu Document ID nos permite localizar de forma segura la información de tu empresa y proporcionarte los documentos de cumplimiento asociados con tu registro empresarial reciente.',
    entry_doc_label: 'Document ID',
    entry_doc_placeholder: 'ej. L26000075446',
    entry_btn: 'Continuar',
    entry_error: 'Document ID no encontrado. Por favor verifica e intenta de nuevo.',
    entry_empty: 'Por favor ingresa tu Document ID.',
    looking_up: 'Buscando tu empresa...',
    // Landing
    welcome: 'Bienvenido,',
    welcome_generic: 'Bienvenido a Florida Business Formation Center',
    hero_subtitle: 'La información de tu empresa fue localizada exitosamente. Por favor',
    hero_subtitle_bold: 'revisa y completa',
    hero_subtitle_end: 'los documentos de cumplimiento requeridos para mantener tu empresa protegida y en regla.',
    action_title: 'ACCIÓN REQUERIDA — Mantén tu Empresa Protegida y en Cumplimiento',
    action_subtitle: 'Como empresa recién registrada en el Estado de Florida, hay algunos pasos importantes que debes completar.',
    select_toggle: 'Seleccionar Todo',
    deselect_toggle: 'Deseleccionar Todo',
    combo_badge: 'Descuento Combo 10% Aplicado',
    info_title: 'Tu Información',
    info_doc_id: 'Document ID',
    info_llc_name: 'Nombre de la LLC',
    info_address: 'Dirección del Negocio',
    info_notice_date: 'Fecha de Aviso',
    info_email: 'Correo de Contacto',
    info_phone: 'Número de Teléfono',
    info_email_placeholder: 'Ingresa tu correo',
    info_phone_placeholder: 'Ingresa tu teléfono',
    order_title: 'Resumen del Pedido',
    discount_lbl: 'Descuento',
    total_lbl: 'Total',
    checkout_btn: 'Proceder al Pago',
    processing: 'Procesando...',
    terms: 'Acepto los',
    terms_link: 'Términos de Servicio',
    select_one: 'Selecciona al menos un servicio.',
    err_terms: 'Debes aceptar los Términos de Servicio.',
    // Notice
    notice_title: 'Aviso Importante',
    notice_1: 'Florida Business Formation Center es un servicio de preparación de documentos de terceros de propiedad privada y no está afiliado a ninguna agencia gubernamental, incluido el IRS, el Departamento de Trabajo o el Departamento de Estado de Florida.',
    notice_2: 'Esta es una solicitud de servicios, no un aviso gubernamental oficial. Las tarifas incluyen costos administrativos y de procesamiento. Todas las ventas son finales y no reembolsables.',
    // EIN Form
    ein_form_title: 'Solicitud de EIN — Información Adicional',
    ein_form_back: '← Volver al Pedido',
    ein_step_identity: 'Identidad',
    ein_step_llc: 'Detalles LLC',
    ein_step_review: 'Revisión',
    responsible_party: 'Responsable del Negocio',
    responsible_party_hint: 'Nombre legal completo del propietario que controla la entidad',
    title_role: 'Tu Rol',
    select_role: 'Selecciona tu rol...',
    ssn_itin: 'SSN o ITIN',
    ssn_confirm: 'Confirmar SSN o ITIN',
    ssn_mismatch: 'Los campos SSN/ITIN no coinciden.',
    ssn_hint: 'Protegido por la ley federal de privacidad (Formulario IRS SS-4)',
    reason_ein: 'Razón de la Solicitud',
    entity_type: 'Tipo de Entidad',
    llc_members: 'Número de Miembros',
    start_date: 'Fecha de Inicio de Operaciones',
    closing_month: 'Mes de Cierre del Año Fiscal',
    has_w2: '¿Espera tener empleados con W-2 en los próximos 12 meses?',
    q_highway: '¿Su negocio posee un vehículo de carretera con peso bruto gravable de 55,000 libras o más?',
    q_gambling: '¿Su negocio implica juegos de azar o apuestas?',
    q_excise: '¿Su negocio necesita presentar el Formulario 720 (Impuesto Especial Federal Trimestral)?',
    q_atf: '¿Su negocio vende o fabrica alcohol, tabaco o armas de fuego?',
    business_activity: 'Actividad Principal del Negocio',
    business_activity_other: 'Describa la actividad de su negocio',
    select_opt: 'Seleccione una opción...',
    continue_btn: 'Continuar',
    back_btn: 'Regresar',
    err_step1: 'Por favor complete todos los campos de identidad requeridos.',
    err_step2: 'Por favor complete todos los campos de detalles de la entidad.',
    review_title: 'Revisa tu Información',
    review_identity: 'Identidad',
    review_llc: 'Detalles de la Entidad',
    review_services: 'Servicios',
    review_edit: 'Editar',
    review_checkout: 'Proceder al Pago',
    yes: 'Sí',
    no: 'No',
  },
}

// SVG icons for service cards
const IconPoster = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#FEF3C7"/>
    <rect x="9" y="7" width="18" height="22" rx="2" fill="#F59E0B" opacity=".3"/>
    <rect x="9" y="7" width="18" height="22" rx="2" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="12" y="12" width="12" height="1.5" rx=".75" fill="#D97706"/>
    <rect x="12" y="15.5" width="9" height="1.5" rx=".75" fill="#D97706"/>
    <rect x="12" y="19" width="10" height="1.5" rx=".75" fill="#D97706"/>
    <rect x="12" y="22.5" width="7" height="1.5" rx=".75" fill="#D97706"/>
  </svg>
)
const IconEIN = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#DBEAFE"/>
    <rect x="7" y="12" width="22" height="14" rx="2" fill="#2563EB" opacity=".2"/>
    <rect x="7" y="12" width="22" height="14" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
    <rect x="10" y="17" width="6" height="1.5" rx=".75" fill="#2563EB"/>
    <rect x="10" y="20.5" width="9" height="1.5" rx=".75" fill="#2563EB"/>
    <rect x="19" y="17" width="4" height="5" rx="1" fill="#2563EB" opacity=".4"/>
    <circle cx="26" cy="10" r="4" fill="#1D4ED8"/>
    <text x="26" y="13.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="700">$</text>
  </svg>
)
const IconCert = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#FEF3C7"/>
    <rect x="8" y="6" width="20" height="24" rx="2" fill="#F59E0B" opacity=".2"/>
    <rect x="8" y="6" width="20" height="24" rx="2" stroke="#D97706" strokeWidth="1.5"/>
    <rect x="11" y="11" width="14" height="1.5" rx=".75" fill="#D97706"/>
    <rect x="11" y="14.5" width="10" height="1.5" rx=".75" fill="#D97706"/>
    <circle cx="18" cy="22" r="4" fill="#D97706" opacity=".3"/>
    <circle cx="18" cy="22" r="4" stroke="#D97706" strokeWidth="1.2"/>
    <text x="18" y="25" textAnchor="middle" fontSize="6" fill="#D97706" fontWeight="800">★</text>
  </svg>
)

const SERVICE_ICONS: Record<ServiceId, React.FC> = {
  labor_law_poster: IconPoster,
  ein: IconEIN,
  certificate_of_status: IconCert,
}

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

function NewBusinessContent() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const t = T[lang]

  const [pageView, setPageView] = useState<PageView>('id-entry')

  // Company data
  const [docInput, setDocInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [lookupError, setLookupError] = useState('')

  // Editable contact info
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Cart
  const [selected, setSelected] = useState<Set<ServiceId>>(new Set(SERVICE_ORDER))
  const [termsAccepted, setTermsAccepted] = useState(false)

  // EIN form state
  const [einStep, setEinStep] = useState<EinStep>(1)
  const [stepError, setStepError] = useState('')
  const [einFields, setEinFields] = useState({
    responsibleParty: '', title: '', ssn: '', ssnConfirm: '', reasonForEin: '',
  })
  const [showSsn, setShowSsn] = useState(false)
  const [showSsnConfirm, setShowSsnConfirm] = useState(false)
  const [ssnMismatch, setSsnMismatch] = useState(false)
  const [llcFields, setLlcFields] = useState({
    entityType: '' as '' | 'LLC' | 'Corporation',
    llcMembers: '',
    startDate: '',
    businessActivity: '',
    businessActivityOther: '',
    closingMonth: 'December',
    hasW2Employees: '' as '' | 'yes' | 'no',
    highwayVehicle: 'no' as 'yes' | 'no',
    gambling: 'no' as 'yes' | 'no',
    exciseTax: 'no' as 'yes' | 'no',
    alcoholTobaccoFirearms: 'no' as 'yes' | 'no',
  })

  // Payment
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // Computed
  const einSelected = selected.has('ein')
  const allSelected = selected.size === SERVICE_ORDER.length
  const subtotal = [...selected].reduce((sum, id) => sum + SERVICES[id].price, 0)
  const discount = allSelected ? parseFloat((subtotal * 0.10).toFixed(2)) : 0
  const total = parseFloat((subtotal - discount).toFixed(2))

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const lookup = useCallback(async (id: string): Promise<boolean> => {
    if (!id.trim()) return false
    setLookingUp(true)
    setLookupError('')
    try {
      const res = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.company) {
        setLookupError(t.entry_error)
        return false
      }
      const c: Company = data.company
      setCompany(c)
      if (c.email) setContactEmail(c.email)
      return true
    } catch {
      setLookupError(t.entry_error)
      return false
    } finally {
      setLookingUp(false)
    }
  }, [t])

  useEffect(() => {
    const id = searchParams.get('id')
    const l = searchParams.get('lang')
    if (l === 'es') setLang('es')
    if (id) {
      setDocInput(id)
      setPageView('landing')
      lookup(id)
    }
  }, [searchParams, lookup])

  async function handleIdEntry() {
    if (!docInput.trim()) { setLookupError(t.entry_empty); return }
    const found = await lookup(docInput)
    if (found) {
      setPageView('landing')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function toggleService(id: ServiceId) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleCheckout() {
    if (selected.size === 0) { setPayError(t.select_one); return }
    if (!termsAccepted) { setPayError(t.err_terms); return }
    setPayError('')
    if (einSelected) {
      setPageView('ein-form')
      setEinStep(1)
      setStepError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    processPayment()
  }

  async function processPayment() {
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/sunbiz/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company?.id || null,
          document_id: docInput.trim() || company?.document_id || '',
          company_name: company?.company_name || '',
          selected_services: [...selected],
          customer_email: contactEmail || null,
          ein_info: einSelected ? einFields : null,
          llc_info: einSelected ? llcFields : null,
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

  function validateEinStep1(): boolean {
    const { responsibleParty, title, ssn, ssnConfirm, reasonForEin } = einFields
    if (ssn.trim() !== ssnConfirm.trim()) { setSsnMismatch(true); return false }
    setSsnMismatch(false)
    return !!(responsibleParty.trim() && title && ssn.trim() && reasonForEin)
  }

  function validateEinStep2(): boolean {
    const { entityType, startDate, businessActivity, hasW2Employees, businessActivityOther } = llcFields
    if (!entityType || !startDate || !businessActivity || !hasW2Employees) return false
    if (businessActivity === 'other' && !businessActivityOther.trim()) return false
    return true
  }

  function handleEinContinue() {
    setStepError('')
    if (einStep === 1) {
      if (!validateEinStep1()) { setStepError(t.err_step1); return }
      setEinStep(2)
    } else if (einStep === 2) {
      if (!validateEinStep2()) { setStepError(t.err_step2); return }
      setEinStep('review')
    } else if (einStep === 'review') {
      processPayment()
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleEinBack() {
    setStepError('')
    if (einStep === 2) { setEinStep(1); return }
    if (einStep === 'review') { setEinStep(2); return }
    setPageView('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const einSteps = [
    { num: 1, label: t.ein_step_identity },
    { num: 2, label: t.ein_step_llc },
  ]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: '#f4f6f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .nb-header{background:#1C2E44;padding:14px 40px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
        .nb-logo{display:flex;align-items:center;gap:10px}
        .nb-logo-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center}
        .nb-logo-text{line-height:1.2}
        .nb-logo-text .l1{color:#fff;font-weight:700;font-size:.95rem;font-family:'Fraunces',serif}
        .nb-logo-text .l2{color:#93c5fd;font-weight:600;font-size:.78rem}
        .nb-header-right{display:flex;align-items:center;gap:18px}
        .nb-phone{color:#fff;font-size:.84rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px}
        .nb-phone:hover{color:#93c5fd}
        .nb-lang{display:flex;gap:3px;background:rgba(255,255,255,.12);border-radius:20px;padding:3px}
        .nb-lang button{padding:4px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.73rem;font-weight:600;font-family:inherit;transition:all .15s}
        .nb-lang button.active{background:#fff;color:#1C2E44}
        .nb-lang button:not(.active){background:transparent;color:rgba(255,255,255,.7)}

        .id-entry-wrap{min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:40px 24px}
        .id-entry-card{background:#fff;border-radius:16px;padding:44px 48px;max-width:500px;width:100%;box-shadow:0 4px 32px rgba(28,46,68,.10);border:1px solid #e2e8f0}
        .id-entry-title{font-family:'Fraunces',serif;font-size:1.6rem;font-weight:900;color:#1C2E44;margin-bottom:10px;line-height:1.25}
        .id-entry-subtitle{color:#475569;font-size:.9rem;line-height:1.65;margin-bottom:28px}
        .id-why-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;margin-bottom:24px}
        .id-why-title{font-size:.74rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
        .id-why-text{font-size:.82rem;color:#0c4a6e;line-height:1.6}
        .id-label{display:block;font-size:.72rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
        .id-input{width:100%;padding:11px 14px;border:1.5px solid #d1d5db;border-radius:8px;font-size:.9rem;font-family:inherit;color:#1e293b;outline:none;transition:border-color .2s}
        .id-input:focus{border-color:#2563EB}
        .id-input.err{border-color:#ef4444;background:#fef2f2}
        .id-btn{width:100%;padding:13px;border-radius:9px;background:linear-gradient(135deg,#1C2E44,#2563EB);color:#fff;font-size:.95rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;margin-top:12px;transition:all .2s;box-shadow:0 4px 14px rgba(37,99,235,.3)}
        .id-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.4)}
        .id-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .id-error{font-size:.76rem;color:#ef4444;margin-top:8px;background:#fef2f2;padding:7px 10px;border-radius:6px;border:1px solid #fecaca}

        .nb-hero{background:#fff;border-bottom:1px solid #e2e8f0;padding:44px 40px 36px;text-align:center}
        .nb-hero h1{font-family:'Fraunces',serif;font-size:2.1rem;font-weight:900;color:#1C2E44;margin-bottom:14px}
        .nb-hero p{color:#475569;font-size:.95rem;max-width:580px;margin:0 auto;line-height:1.75}

        .nb-action{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:36px 40px}
        .nb-action-inner{max-width:920px;margin:0 auto}
        .nb-action-header{text-align:center;margin-bottom:28px}
        .nb-action-title{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:700;color:#1C2E44;margin-bottom:8px}
        .nb-action-sub{color:#64748b;font-size:.88rem;max-width:580px;margin:0 auto;line-height:1.65}
        .svc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .svc-card{background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:20px;cursor:pointer;transition:all .2s;position:relative}
        .svc-card:hover{border-color:#93c5fd;box-shadow:0 4px 16px rgba(37,99,235,.1)}
        .svc-card.selected{border-color:#2563EB;background:#eff6ff}
        .svc-card-check{position:absolute;top:12px;right:12px;width:22px;height:22px;border-radius:50%;border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .svc-card.selected .svc-card-check{background:#2563EB;border-color:#2563EB}
        .svc-card-icon{margin-bottom:12px}
        .svc-card-name{font-weight:700;color:#1C2E44;font-size:.95rem;margin-bottom:4px}
        .svc-card-price{color:#EA580C;font-weight:700;font-size:1.15rem;margin-bottom:8px}
        .svc-card-desc{color:#64748b;font-size:.8rem;line-height:1.55}
        .svc-actions{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:18px}
        .svc-toggle-btn{background:none;border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:600;color:#2563EB;text-decoration:underline}
        .combo-badge{background:#dcfce7;color:#166534;font-size:.74rem;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0}

        .nb-body{max-width:960px;margin:32px auto;padding:0 32px;display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start}

        .info-box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(28,46,68,.06)}
        .info-box-title{font-weight:700;font-size:1rem;color:#1C2E44;padding:18px 22px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        .info-row{display:flex;align-items:baseline;padding:12px 22px;border-bottom:1px solid #f1f5f9;gap:12px}
        .info-row:last-child{border-bottom:none}
        .info-row-lbl{font-size:.74rem;font-weight:600;color:#94a3b8;min-width:130px;flex-shrink:0}
        .info-row-val{font-size:.88rem;color:#1e293b;font-weight:500;flex:1}
        .info-input{border:1px solid #d1d5db;border-radius:6px;padding:5px 8px;font-size:.84rem;font-family:inherit;color:#1e293b;width:100%;outline:none;transition:border-color .2s}
        .info-input:focus{border-color:#2563EB}

        .order-box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:22px;box-shadow:0 2px 12px rgba(28,46,68,.06);position:sticky;top:80px}
        .order-title{font-weight:700;font-size:1rem;color:#1C2E44;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
        .order-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:.88rem;color:#374151}
        .order-row-name{flex:1}
        .order-row-price{font-weight:600;color:#1C2E44}
        .order-discount{color:#059669;font-weight:600}
        .order-divider{border:none;border-top:1px solid #e2e8f0;margin:12px 0}
        .order-total{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
        .order-total-lbl{font-weight:700;font-size:1rem;color:#1C2E44}
        .order-total-val{font-weight:900;font-size:1.4rem;color:#1C2E44}
        .btn-checkout{width:100%;padding:14px;border-radius:9px;background:#16a34a;color:#fff;font-size:.95rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;margin-top:18px;transition:all .2s;box-shadow:0 4px 14px rgba(22,163,74,.3)}
        .btn-checkout:hover:not(:disabled){background:#15803d;transform:translateY(-1px);box-shadow:0 6px 20px rgba(22,163,74,.4)}
        .btn-checkout:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .terms-row{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.76rem;color:#64748b}
        .terms-row a{color:#2563EB;text-decoration:underline}
        .terms-row input{cursor:pointer;width:15px;height:15px;flex-shrink:0;accent-color:#2563EB}
        .pay-error{color:#ef4444;font-size:.76rem;margin-top:8px;background:#fef2f2;padding:6px 10px;border-radius:6px;border:1px solid #fecaca}
        .order-empty{color:#94a3b8;font-size:.84rem;padding:16px 0;text-align:center}

        .nb-notice{border-top:1px solid #e2e8f0;padding:36px 40px;text-align:center;margin-top:8px}
        .nb-notice-inner{max-width:760px;margin:0 auto}
        .nb-notice-title{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:#1C2E44;margin-bottom:18px}
        .nb-notice hr{border:none;border-top:1px solid #e2e8f0;margin-bottom:18px}
        .nb-notice p{font-size:.8rem;color:#64748b;line-height:1.75;margin-bottom:10px;text-align:left}
        .nb-notice strong{color:#374151}

        .ein-wrap{max-width:680px;margin:0 auto;padding:32px 32px 64px}
        .ein-back{background:none;border:none;cursor:pointer;font-family:inherit;font-size:.84rem;font-weight:600;color:#2563EB;padding:0;margin-bottom:24px;display:flex;align-items:center;gap:4px;text-decoration:underline}
        .ein-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:28px;box-shadow:0 4px 24px rgba(28,46,68,.08)}
        .ein-card-title{font-size:1rem;font-weight:700;color:#1C2E44;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e2e8f0}
        .steps-track{display:flex;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:1.5px solid #f1f5f9}
        .step-item{display:flex;flex-direction:column;align-items:center;flex:0 0 auto}
        .step-line{flex:1;height:2px;background:#e2e8f0;margin-top:12px;min-width:24px}
        .step-line.done{background:#1C2E44}
        .step-circle{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;border:2px solid #e2e8f0;background:#fff;color:#9ca3af;transition:all .2s}
        .step-circle.active{background:#2563EB;border-color:#2563EB;color:#fff}
        .step-circle.done{background:#1C2E44;border-color:#1C2E44;color:#fff}
        .step-lbl{font-size:.58rem;font-weight:700;color:#9ca3af;text-align:center;margin-top:4px;text-transform:uppercase;letter-spacing:.3px;max-width:64px;line-height:1.3}
        .step-lbl.active,.step-lbl.done{color:#1C2E44}
        .step-anim{animation:stepIn .18s ease-out}
        @keyframes stepIn{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .form-field{margin-bottom:12px}
        .form-label{display:block;font-size:.66rem;font-weight:700;color:#374151;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
        .req{color:#ef4444;margin-left:2px}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .form-input{width:100%;padding:8px 11px;border:1.5px solid #d1d5db;border-radius:7px;font-size:.84rem;font-family:inherit;color:#1e293b;outline:none;transition:border-color .2s;background:#fff}
        .form-input:focus{border-color:#2563EB}
        .form-input.err-field{border-color:#ef4444;background:#fef2f2}
        select.form-input{cursor:pointer}
        .form-hint{font-size:.67rem;color:#94a3b8;margin-top:3px;line-height:1.4}
        .pwd-wrap{position:relative;display:flex;align-items:center}
        .pwd-wrap .form-input{padding-right:34px}
        .eye-btn{position:absolute;right:8px;background:none;border:none;cursor:pointer;padding:2px;color:#94a3b8;display:flex;align-items:center;transition:color .15s}
        .eye-btn:hover{color:#1C2E44}
        .ssn-mismatch{font-size:.72rem;color:#ef4444;margin-top:4px}
        .entity-toggle{display:flex;gap:8px;margin-top:4px}
        .entity-btn{flex:1;padding:9px;border-radius:7px;border:1.5px solid #d1d5db;background:#fff;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit;color:#374151;transition:all .15s}
        .entity-btn.selected{background:#1C2E44;border-color:#1C2E44;color:#fff}
        .yn-group{display:flex;gap:8px;margin-top:4px}
        .yn-btn{flex:1;padding:7px;border-radius:6px;border:1.5px solid #d1d5db;background:#fff;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;color:#374151;transition:all .15s}
        .yn-btn.sel-yes{background:#dcfce7;border-color:#86efac;color:#166534}
        .yn-btn.sel-no{background:#f1f5f9;border-color:#cbd5e1;color:#475569}
        .q-block{margin-bottom:10px;padding:10px;border-radius:8px;background:#f8fafc;border:1px solid #f1f5f9}
        .q-text{font-size:.76rem;color:#374151;font-weight:500;line-height:1.5;margin-bottom:6px}
        .act-hint{font-size:.67rem;color:#94a3b8;margin-top:2px;line-height:1.4}
        .step-error{font-size:.74rem;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:7px 11px;margin-top:10px}
        .step-actions{display:flex;gap:10px;margin-top:16px;padding-top:14px;border-top:1.5px solid #f1f5f9}
        .btn-back-sm{flex:1;padding:9px 14px;border-radius:7px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#374151;font-size:.82rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
        .btn-back-sm:hover{background:#f1f5f9;color:#1C2E44}
        .btn-next{flex:2;padding:10px;border-radius:8px;background:linear-gradient(135deg,#1C2E44,#2563EB);color:#fff;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 3px 10px rgba(37,99,235,.25)}
        .btn-next:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(37,99,235,.35)}
        .btn-next:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .review-section{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #f1f5f9}
        .review-section:last-of-type{border-bottom:none;margin-bottom:0}
        .review-section-title{font-size:.78rem;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
        .review-edit{font-size:.7rem;font-weight:600;color:#2563EB;cursor:pointer;text-decoration:underline;background:none;border:none;padding:0;font-family:inherit}
        .review-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}
        .review-label{color:#94a3b8;font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
        .review-value{color:#1e293b;font-size:.82rem;font-weight:500;margin-top:1px;word-break:break-word}

        @media(max-width:860px){
          .nb-body{grid-template-columns:1fr;padding:0 20px}
          .order-box{position:static}
          .svc-cards{grid-template-columns:1fr}
          .nb-action,.nb-hero{padding-left:20px;padding-right:20px}
          .nb-notice{padding-left:20px;padding-right:20px}
        }
        @media(max-width:600px){
          .nb-header{padding:12px 16px}
          .id-entry-card{padding:28px 20px}
          .ein-wrap{padding:20px 16px 48px}
          .form-grid{grid-template-columns:1fr}
          .review-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header className="nb-header">
        <div className="nb-logo">
          <div className="nb-logo-icon">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect width="38" height="38" rx="7" fill="#2563EB"/>
              <text x="19" y="26" textAnchor="middle" fontSize="15" fill="white" fontWeight="900" fontFamily="serif">FL</text>
            </svg>
          </div>
          <div className="nb-logo-text">
            <div className="l1">{t.header_name_1}</div>
            <div className="l2">{t.header_name_2}</div>
          </div>
        </div>
        <div className="nb-header-right">
          <div className="nb-lang">
            {(['en', 'es'] as const).map(l => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <a href={`tel:${t.phone.replace(/\D/g, '')}`} className="nb-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            {t.call_us} {t.phone}
          </a>
        </div>
      </header>

      {/* ── ID ENTRY VIEW ── */}
      {pageView === 'id-entry' && (
        <div className="id-entry-wrap">
          <div className="id-entry-card">
            <h1 className="id-entry-title">{t.entry_title}</h1>
            <p className="id-entry-subtitle">{t.entry_subtitle}</p>

            <div className="id-why-box">
              <div className="id-why-title">{t.entry_why_title}</div>
              <p className="id-why-text">{t.entry_why_body}</p>
            </div>

            <label className="id-label" htmlFor="doc-id-input">{t.entry_doc_label}</label>
            <input
              id="doc-id-input"
              className={`id-input${lookupError ? ' err' : ''}`}
              value={docInput}
              onChange={e => { setDocInput(e.target.value.toUpperCase()); setLookupError('') }}
              onKeyDown={e => e.key === 'Enter' && handleIdEntry()}
              placeholder={t.entry_doc_placeholder}
            />
            {lookupError && <p className="id-error">{lookupError}</p>}

            <button className="id-btn" onClick={handleIdEntry} disabled={lookingUp}>
              {lookingUp ? t.looking_up : t.entry_btn}
            </button>
          </div>
        </div>
      )}

      {/* ── LANDING VIEW ── */}
      {pageView === 'landing' && (
        <>
          {/* Hero */}
          <section className="nb-hero">
            {lookingUp ? (
              <p style={{ color: '#2563EB', fontWeight: 600 }}>{t.looking_up}</p>
            ) : company ? (
              <>
                <h1>{t.welcome} {company.company_name}</h1>
                <p>
                  {t.hero_subtitle} <strong>{t.hero_subtitle_bold}</strong> {t.hero_subtitle_end}
                </p>
              </>
            ) : (
              <>
                <h1>{t.welcome_generic}</h1>
                <p>{t.hero_subtitle} <strong>{t.hero_subtitle_bold}</strong> {t.hero_subtitle_end}</p>
              </>
            )}
          </section>

          {/* Action Required / Services */}
          <section className="nb-action">
            <div className="nb-action-inner">
              <div className="nb-action-header">
                <h2 className="nb-action-title">{t.action_title}</h2>
                <p className="nb-action-sub">{t.action_subtitle}</p>
              </div>

              <div className="svc-cards">
                {SERVICE_ORDER.map(id => {
                  const svc = SERVICES[id]
                  const isChecked = selected.has(id)
                  const Icon = SERVICE_ICONS[id]
                  return (
                    <div key={id} className={`svc-card${isChecked ? ' selected' : ''}`} onClick={() => toggleService(id)}>
                      <div className="svc-card-check">
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="svc-card-icon"><Icon /></div>
                      <div className="svc-card-name">{svc[lang]}</div>
                      <div className="svc-card-price">${svc.price.toFixed(2)}</div>
                      <div className="svc-card-desc">{svc[`detail_${lang}` as 'detail_en' | 'detail_es']}</div>
                    </div>
                  )
                })}
              </div>

              <div className="svc-actions">
                <button className="svc-toggle-btn" onClick={() => setSelected(allSelected ? new Set() : new Set(SERVICE_ORDER))}>
                  {allSelected ? t.deselect_toggle : t.select_toggle}
                </button>
                {allSelected && <span className="combo-badge">✓ {t.combo_badge}</span>}
              </div>
            </div>
          </section>

          {/* Body: Info + Order Summary */}
          <div className="nb-body">
            {/* Your Information */}
            <div className="info-box">
              <div className="info-box-title">{t.info_title}</div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_doc_id}</span>
                <span className="info-row-val">{docInput || company?.document_id || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_llc_name}</span>
                <span className="info-row-val">{company?.company_name || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_address}</span>
                <span className="info-row-val">
                  {[company?.address, company?.city, company?.state, company?.zip].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_notice_date}</span>
                <span className="info-row-val">{today}</span>
              </div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_email}</span>
                <input
                  className="info-input"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder={t.info_email_placeholder}
                  type="email"
                />
              </div>
              <div className="info-row">
                <span className="info-row-lbl">{t.info_phone}</span>
                <input
                  className="info-input"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder={t.info_phone_placeholder}
                  type="tel"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-box">
              <div className="order-title">{t.order_title}</div>

              {selected.size === 0 ? (
                <div className="order-empty">{t.select_one}</div>
              ) : (
                <>
                  {SERVICE_ORDER.filter(id => selected.has(id)).map(id => (
                    <div key={id} className="order-row">
                      <span className="order-row-name">{SERVICES[id][lang]}</span>
                      <span className="order-row-price">${SERVICES[id].price.toFixed(2)}</span>
                    </div>
                  ))}
                  {discount > 0 && (
                    <div className="order-row order-discount">
                      <span className="order-row-name">{t.discount_lbl}:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="order-divider" />
                  <div className="order-total">
                    <span className="order-total-lbl">{t.total_lbl}:</span>
                    <span className="order-total-val" style={{ color: '#1C2E44' }}>${total.toFixed(2)}</span>
                  </div>
                </>
              )}

              <button className="btn-checkout" onClick={handleCheckout} disabled={paying || selected.size === 0}>
                {paying ? t.processing : t.checkout_btn}
              </button>

              <div className="terms-row">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>{t.terms} <a href="/legal" target="_blank">{t.terms_link}</a></span>
              </div>

              {payError && <p className="pay-error">{payError}</p>}
            </div>
          </div>

          {/* Important Notice */}
          <section className="nb-notice">
            <div className="nb-notice-inner">
              <h3 className="nb-notice-title">{t.notice_title}</h3>
              <hr />
              <p><strong>Florida Business Formation Center</strong> {t.notice_1.replace('Florida Business Formation Center ', '')}</p>
              <p>{t.notice_2}</p>
            </div>
          </section>
        </>
      )}

      {/* ── EIN FORM VIEW ── */}
      {pageView === 'ein-form' && (
        <div className="ein-wrap">
          <button className="ein-back" onClick={handleEinBack}>{t.ein_form_back}</button>

          <div className="ein-card">
            <div className="ein-card-title">{t.ein_form_title}</div>

            {/* Step indicator */}
            {einStep !== 'review' && (
              <div className="steps-track">
                {einSteps.map((s, idx) => {
                  const numStep = einStep as number
                  const isDone = numStep > s.num
                  const isActive = numStep === s.num
                  return (
                    <Fragment key={s.num}>
                      {idx > 0 && <div className={`step-line${numStep >= s.num ? ' done' : ''}`} />}
                      <div className="step-item">
                        <div className={`step-circle${isActive ? ' active' : isDone ? ' done' : ''}`}>
                          {isDone ? '✓' : s.num}
                        </div>
                        <div className={`step-lbl${isActive || isDone ? ' active' : ''}`}>{s.label}</div>
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            )}

            {/* Step 1: Identity */}
            {einStep === 1 && (
              <div className="step-anim">
                <div className="form-field">
                  <label className="form-label">{t.responsible_party}<span className="req">*</span></label>
                  <input className="form-input" value={einFields.responsibleParty} onChange={e => setEinFields(p => ({ ...p, responsibleParty: e.target.value }))} />
                  <p className="form-hint">{t.responsible_party_hint}</p>
                </div>

                <div className="form-field">
                  <label className="form-label">{t.title_role}<span className="req">*</span></label>
                  <select className="form-input" value={einFields.title} onChange={e => setEinFields(p => ({ ...p, title: e.target.value }))}>
                    <option value="">{t.select_role}</option>
                    {TITLE_OPTIONS[lang].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <div className="form-grid" style={{ gap: 10 }}>
                    <div>
                      <label className="form-label">{t.ssn_itin}<span className="req">*</span></label>
                      <div className="pwd-wrap">
                        <input
                          className={`form-input${ssnMismatch ? ' err-field' : ''}`}
                          type={showSsn ? 'text' : 'password'}
                          value={einFields.ssn}
                          onChange={e => { setEinFields(p => ({ ...p, ssn: e.target.value })); setSsnMismatch(false) }}
                          placeholder="XXX-XX-XXXX"
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowSsn(v => !v)} tabIndex={-1}>
                          {showSsn ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">{t.ssn_confirm}<span className="req">*</span></label>
                      <div className="pwd-wrap">
                        <input
                          className={`form-input${ssnMismatch ? ' err-field' : ''}`}
                          type={showSsnConfirm ? 'text' : 'password'}
                          value={einFields.ssnConfirm}
                          onChange={e => { setEinFields(p => ({ ...p, ssnConfirm: e.target.value })); setSsnMismatch(false) }}
                          placeholder="XXX-XX-XXXX"
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowSsnConfirm(v => !v)} tabIndex={-1}>
                          {showSsnConfirm ? <EyeOff /> : <EyeOpen />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {ssnMismatch && <p className="ssn-mismatch">⚠ {t.ssn_mismatch}</p>}
                  <p className="form-hint">🔒 {t.ssn_hint}</p>
                </div>

                <div className="form-field">
                  <label className="form-label">{t.reason_ein}<span className="req">*</span></label>
                  <select className="form-input" value={einFields.reasonForEin} onChange={e => setEinFields(p => ({ ...p, reasonForEin: e.target.value }))}>
                    <option value="">{t.select_opt}</option>
                    {REASON_OPTIONS[lang].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {stepError && <div className="step-error">{stepError}</div>}
                <div className="step-actions">
                  <button className="btn-back-sm" onClick={handleEinBack}>{t.back_btn}</button>
                  <button className="btn-next" onClick={handleEinContinue}>{t.continue_btn} →</button>
                </div>
              </div>
            )}

            {/* Step 2: LLC Details */}
            {einStep === 2 && (
              <div className="step-anim">
                <div className="form-field">
                  <label className="form-label">{t.entity_type}<span className="req">*</span></label>
                  <div className="entity-toggle">
                    <button type="button" className={`entity-btn${llcFields.entityType === 'LLC' ? ' selected' : ''}`} onClick={() => setLlcFields(p => ({ ...p, entityType: 'LLC' }))}>LLC</button>
                    <button type="button" className={`entity-btn${llcFields.entityType === 'Corporation' ? ' selected' : ''}`} onClick={() => setLlcFields(p => ({ ...p, entityType: 'Corporation' }))}>Corporation</button>
                  </div>
                </div>

                {llcFields.entityType === 'LLC' && (
                  <div className="form-field">
                    <label className="form-label">{t.llc_members}</label>
                    <select className="form-input" value={llcFields.llcMembers} onChange={e => setLlcFields(p => ({ ...p, llcMembers: e.target.value }))}>
                      <option value="">{t.select_opt}</option>
                      {['1','2','3','4'].map(n => <option key={n} value={n}>{n}</option>)}
                      <option value="5+">5 {lang === 'es' ? 'o más' : 'or more'}</option>
                    </select>
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">{t.start_date}<span className="req">*</span></label>
                  <input type="month" className="form-input" value={llcFields.startDate} onChange={e => setLlcFields(p => ({ ...p, startDate: e.target.value }))} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  {[
                    { key: 'highwayVehicle' as const, q: t.q_highway },
                    { key: 'gambling' as const, q: t.q_gambling },
                    { key: 'exciseTax' as const, q: t.q_excise },
                    { key: 'alcoholTobaccoFirearms' as const, q: t.q_atf },
                  ].map(({ key, q }) => (
                    <div key={key} className="q-block">
                      <div className="q-text">{q}</div>
                      <div className="yn-group">
                        <button type="button" className={`yn-btn${llcFields[key] === 'yes' ? ' sel-yes' : ''}`} onClick={() => setLlcFields(p => ({ ...p, [key]: 'yes' }))}>{t.yes}</button>
                        <button type="button" className={`yn-btn${llcFields[key] === 'no' ? ' sel-no' : ''}`} onClick={() => setLlcFields(p => ({ ...p, [key]: 'no' }))}>{t.no}</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-field">
                  <label className="form-label">{t.business_activity}<span className="req">*</span></label>
                  <select className="form-input" value={llcFields.businessActivity} onChange={e => setLlcFields(p => ({ ...p, businessActivity: e.target.value, businessActivityOther: '' }))}>
                    <option value="">{t.select_opt}</option>
                    {ACTIVITY_OPTIONS[lang].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {llcFields.businessActivity && llcFields.businessActivity !== 'other' && (
                    <p className="act-hint">{ACTIVITY_OPTIONS[lang].find(o => o.value === llcFields.businessActivity)?.desc}</p>
                  )}
                </div>

                {llcFields.businessActivity === 'other' && (
                  <div className="form-field">
                    <label className="form-label">{t.business_activity_other}<span className="req">*</span></label>
                    <input className="form-input" value={llcFields.businessActivityOther} onChange={e => setLlcFields(p => ({ ...p, businessActivityOther: e.target.value }))} placeholder={lang === 'es' ? 'Describa brevemente...' : 'Briefly describe...'} />
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">{t.closing_month}</label>
                    <select className="form-input" value={llcFields.closingMonth} onChange={e => setLlcFields(p => ({ ...p, closingMonth: e.target.value }))}>
                      {CLOSING_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">{t.has_w2}<span className="req">*</span></label>
                  <div className="yn-group">
                    <button type="button" className={`yn-btn${llcFields.hasW2Employees === 'yes' ? ' sel-yes' : ''}`} onClick={() => setLlcFields(p => ({ ...p, hasW2Employees: 'yes' }))}>{t.yes}</button>
                    <button type="button" className={`yn-btn${llcFields.hasW2Employees === 'no' ? ' sel-no' : ''}`} onClick={() => setLlcFields(p => ({ ...p, hasW2Employees: 'no' }))}>{t.no}</button>
                  </div>
                </div>

                {stepError && <div className="step-error">{stepError}</div>}
                <div className="step-actions">
                  <button className="btn-back-sm" onClick={handleEinBack}>{t.back_btn}</button>
                  <button className="btn-next" onClick={handleEinContinue}>{lang === 'es' ? 'Revisar →' : 'Review →'}</button>
                </div>
              </div>
            )}

            {/* Review */}
            {einStep === 'review' && (
              <div className="step-anim">
                <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#1C2E44', marginBottom: 14 }}>{t.review_title}</div>

                <div className="review-section">
                  <div className="review-section-title">
                    {t.review_identity}
                    <button className="review-edit" onClick={() => setEinStep(1)}>{t.review_edit}</button>
                  </div>
                  <div className="review-grid">
                    <div><div className="review-label">{t.responsible_party}</div><div className="review-value">{einFields.responsibleParty || '—'}</div></div>
                    <div><div className="review-label">{t.title_role}</div><div className="review-value">{TITLE_OPTIONS[lang].find(o => o.value === einFields.title)?.label || '—'}</div></div>
                    <div><div className="review-label">{t.ssn_itin}</div><div className="review-value">{'•'.repeat(9)}</div></div>
                    <div><div className="review-label">{t.reason_ein}</div><div className="review-value">{REASON_OPTIONS[lang].find(o => o.value === einFields.reasonForEin)?.label || '—'}</div></div>
                  </div>
                </div>

                <div className="review-section">
                  <div className="review-section-title">
                    {t.review_llc}
                    <button className="review-edit" onClick={() => setEinStep(2)}>{t.review_edit}</button>
                  </div>
                  <div className="review-grid">
                    <div><div className="review-label">{t.entity_type}</div><div className="review-value">{llcFields.entityType || '—'}</div></div>
                    <div><div className="review-label">{t.start_date}</div><div className="review-value">{llcFields.startDate || '—'}</div></div>
                    <div><div className="review-label">{t.business_activity}</div><div className="review-value">{llcFields.businessActivity === 'other' ? (llcFields.businessActivityOther || 'Other') : (ACTIVITY_OPTIONS[lang].find(o => o.value === llcFields.businessActivity)?.label || '—')}</div></div>
                    <div><div className="review-label">{t.has_w2}</div><div className="review-value">{llcFields.hasW2Employees === 'yes' ? t.yes : llcFields.hasW2Employees === 'no' ? t.no : '—'}</div></div>
                  </div>
                </div>

                <div className="review-section">
                  <div className="review-section-title">{t.review_services}</div>
                  {SERVICE_ORDER.filter(id => selected.has(id)).map(id => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', marginBottom: 6 }}>
                      <span style={{ color: '#374151' }}>{SERVICES[id][lang]}</span>
                      <span style={{ fontWeight: 700, color: '#1C2E44' }}>${SERVICES[id].price.toFixed(2)}</span>
                    </div>
                  ))}
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', color: '#059669', fontWeight: 600, marginBottom: 6 }}>
                      <span>{t.discount_lbl}:</span><span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '.95rem', color: '#1C2E44', paddingTop: 8, borderTop: '1.5px solid #e2e8f0', marginTop: 6 }}>
                    <span>{t.total_lbl}:</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {payError && <p className="pay-error">{payError}</p>}
                <div className="step-actions">
                  <button className="btn-back-sm" onClick={handleEinBack}>{t.back_btn}</button>
                  <button className="btn-next" onClick={handleEinContinue} disabled={paying}>
                    {paying ? t.processing : t.review_checkout + ' →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
