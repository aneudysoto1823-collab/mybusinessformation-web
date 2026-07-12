'use client'

import { useState, useEffect } from 'react'
import { getOrderItemKeys, getOrderItemLabel } from '@/lib/order-items'

interface Order {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  entityType: string
  package: string
  speed: string
  amount: number
  paymentStatus: string
  status: string
  addons: unknown
}

interface DocumentItem {
  key: string
  label: string
  labelEs: string
  url: string | null
  pending: string
  pendingEs: string
}

interface Step {
  key: string
  label: string
  labelEs: string
}

interface Props {
  order: Order
  allOrders: Order[]
  documents: DocumentItem[]
  confirmationNumber: string
  steps: Step[]
  currentStep: number
  isAddon: boolean
  initialLang: 'en' | 'es'
  hasPassword: boolean
}

const PACKAGE_INFO: Record<string, { en: string; es: string; price: string; popular?: boolean }> = {
  basic:    { en: 'Basic',               es: 'Básico',   price: '$0 + state fee' },
  standard: { en: 'Standard',           es: 'Estándar', price: '$199 + state fee', popular: true },
  premium:  { en: 'Premium',            es: 'Premium',  price: '$299 + state fee' },
  addon:    { en: 'New Business Letter', es: 'New Business Letter', price: 'Variable' },
}

const PACKAGE_SERVICES: Record<string, { en: string; es: string }[]> = {
  basic: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
  ],
  standard: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number',              es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide',               es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
  ],
  premium: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number',              es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide',               es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
    { en: 'Operating Agreement',              es: 'Acuerdo Operativo' },
    { en: 'Expedited Filing (1–3 days)',       es: 'Registro Prioritario (1–3 días)' },
    { en: 'ITIN Application',                 es: 'Solicitud de ITIN' },
    { en: 'DBA / Fictitious Name',            es: 'DBA / Nombre Ficticio' },
    { en: 'Articles of Amendment',            es: 'Artículos de Enmienda' },
  ],
}

const ADDON_SERVICE_LABELS: Record<string, { en: string; es: string }> = {
  ein:                   { en: 'EIN / Tax ID Number',                                              es: 'EIN / Número de ID Fiscal' },
  labor_law_poster:      { en: 'Labor Law Poster 2026',                                            es: 'Póster de Ley Laboral 2026' },
  certificate_of_status: { en: 'Certificate of Status (FL)',                                       es: 'Certificado de Buena Reputación (FL)' },
  bundle:                { en: 'Business Essentials Bundle (EIN + Labor Poster + Certificate)',    es: 'Paquete Esencial (EIN + Póster + Certificado)' },
}

const STATUS_LABELS: Record<string, { en: string; es: string }> = {
  pending:        { en: 'Pending',       es: 'Pendiente' },
  in_review:      { en: 'In Review',     es: 'En Revisión' },
  names_taken:    { en: 'Names Taken',   es: 'Nombres Tomados' },
  ready_to_file:  { en: 'Ready to File', es: 'Listo para Registrar' },
  filed:          { en: 'Processed',     es: 'Procesado' },
  approved:       { en: 'Approved',      es: 'Aprobado' },
  completed:      { en: 'Completed',     es: 'Completado' },
  processing:     { en: 'Processing',    es: 'Procesando' },
}

function getWhatsNext(status: string, es: boolean): string {
  const T: Record<string, { en: string; es: string }> = {
    pending:        { en: 'Your order has been received. Complete your payment to get started.', es: 'Tu orden ha sido recibida. Completa tu pago para comenzar.' },
    in_review:      { en: 'Payment confirmed! Our team is verifying the availability of your business names with the State of Florida.', es: '¡Pago confirmado! Nuestro equipo está verificando la disponibilidad de tus nombres con el Estado de Florida.' },
    names_taken:    { en: 'The names you selected are already registered in Florida. Our team will send you alternative name suggestions shortly — please check your email.', es: 'Los nombres que seleccionaste ya están registrados en Florida. Nuestro equipo te enviará sugerencias alternativas pronto — revisa tu correo.' },
    ready_to_file:  { en: 'A business name is available! Our team is preparing to file your formation documents with the State of Florida.', es: '¡Un nombre está disponible! Nuestro equipo está preparando los documentos para registrar tu negocio.' },
    filed:          { en: 'Your business formation documents have been submitted to the State of Florida. Approval typically takes 3–5 business days.', es: 'Tus documentos han sido enviados al Estado de Florida. La aprobación generalmente toma de 3 a 5 días hábiles.' },
    approved:       { en: 'Florida has approved your business! We are preparing your Articles of Organization / Incorporation and will send them to your email shortly.', es: '¡Florida ha aprobado tu negocio! Estamos preparando tus Artículos de Organización / Incorporación y te los enviaremos pronto.' },
    completed:      { en: 'Your business is officially formed. Check your email for the Articles of Organization / Incorporation. Welcome to the business world!', es: 'Tu negocio está oficialmente formado. Revisa tu correo para los Artículos de Organización / Incorporación. ¡Bienvenido al mundo empresarial!' },
  }
  const msg = T[status]
  if (!msg) return es ? 'Tu orden está siendo procesada. Te mantendremos informado por correo.' : 'Your order is being processed. We will keep you updated by email.'
  return es ? msg.es : msg.en
}

function getAddonWhatsNext(status: string, es: boolean): string {
  if (status === 'completed') return es ? '¡Tus servicios están listos! Revisa la sección de Documentos para descargar tus archivos.' : 'Your services are ready! Check the Documents section below to download your files.'
  if (status === 'in_review' || status === 'processing') return es ? '¡Pago confirmado! Nuestro equipo está procesando tus servicios. Te notificaremos por correo cuando todo esté listo.' : 'Payment confirmed! Our team is processing your services. We\'ll email you as soon as everything is ready.'
  return es ? 'Tu orden ha sido recibida y está siendo revisada.' : 'Your order has been received and is being reviewed.'
}

function getConfirmationNumber(id: string, pkg: string): string {
  const prefix = pkg === 'addon' ? 'FBNB' : 'FBFC'
  return `${prefix}-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

function parseAddons(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function parseAddonServices(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch { /* noop */ }
  }
  return []
}

export default function DashboardContent({
  order, allOrders, documents, confirmationNumber,
  steps, currentStep, isAddon, initialLang, hasPassword,
}: Props) {
  const [lang, setLang] = useState<'en' | 'es'>(initialLang)
  const [pwBanner, setPwBanner] = useState(!hasPassword)
  const [pwForm, setPwForm] = useState(false)
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwShow, setPwShow] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    // Prioridad: ?lang de la URL (idioma del home del que viene) → portal_lang →
    // flbc_lang. El ?lang persiste para que la sesión del portal se quede en ese
    // idioma. Persistimos también 'en' (antes solo 'es', dejando valores stale).
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    const portalLang = localStorage.getItem('portal_lang')
    const siteLang = localStorage.getItem('flbc_lang')
    const detected = urlLang || portalLang || siteLang
    if (detected === 'es') { setLang('es'); localStorage.setItem('portal_lang', 'es') }
    else if (detected === 'en') { setLang('en'); localStorage.setItem('portal_lang', 'en') }
    if (localStorage.getItem('pw_banner_dismissed')) setPwBanner(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function switchLang(l: 'en' | 'es') {
    setLang(l)
    localStorage.setItem('portal_lang', l)
  }

  function dismissPwBanner() {
    setPwBanner(false)
    localStorage.setItem('pw_banner_dismissed', '1')
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pw.length < 8) { setPwError(es ? 'Mínimo 8 caracteres.' : 'Minimum 8 characters.'); return }
    if (pw !== pwConfirm) { setPwError(es ? 'Las contraseñas no coinciden.' : 'Passwords do not match.'); return }
    setPwLoading(true)
    const res = await fetch('/api/client-auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setPwLoading(false)
    if (res.ok) {
      setPwSuccess(true)
      setPwBanner(false)
      setPwForm(false)
      localStorage.removeItem('pw_banner_dismissed')
    } else {
      const d = await res.json()
      setPwError(d.error || (es ? 'Error al guardar.' : 'Could not save password.'))
    }
  }

  const es = lang === 'es'

  const pkgKey = (order.package ?? '').toLowerCase()
  const pkgInfo = PACKAGE_INFO[pkgKey]
  const whatsNext = isAddon ? getAddonWhatsNext(order.status, es) : getWhatsNext(order.status, es)
  const statusLabel = (STATUS_LABELS[order.status] ?? { en: order.status, es: order.status })
  const addonServices = parseAddonServices(order.addons)
  const addons = parseAddons(order.addons)
  const addonItems = [
    { key: 'ein',  en: 'EIN / Tax ID',          es: 'EIN / ID Fiscal' },
    { key: 'oa',   en: 'Operating Agreement',   es: 'Acuerdo Operativo' },
    { key: 'itin', en: 'ITIN Application',      es: 'Solicitud de ITIN' },
    { key: 'ar',   en: 'Annual Report Filing',  es: 'Presentación de Informe Anual' },
  ]
  const activeAddons = addonItems.filter(a => addons[a.key])
  const pkgServices = PACKAGE_SERVICES[pkgKey] ?? []
  // Órdenes à la carte de /servicios/checkout (package:'services') — el shape
  // de order.addons es {services, bundles, intake, lines, lang}, no el mapa de
  // booleanos de formación. getOrderItemKeys ya sabe resolver ambos shapes (y
  // el de marketing) a etiquetas legibles sin mostrar claves crudas.
  const isServicesOrder = pkgKey === 'services'
  const servicesOrderLabels = isServicesOrder
    ? getOrderItemKeys('services', order.addons).map(k => getOrderItemLabel(k, { entityType: order.entityType, lang: es ? 'es' : 'en' }))
    : []

  return (
    <div className="cp-wrapper">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          <a href={es ? '/es' : '/'} className="cp-back">{es ? '← Inicio' : '← Home'}</a>
          <a href={es ? '/es' : '/'} className="cp-header-brand">
            OpaBiz
            <span>{es ? 'Portal del Cliente' : 'Client Portal'}</span>
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
            <div className="lang-sep" />
            <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => switchLang('es')}>ES</button>
          </div>
          <a href={`/api/client-auth/logout?lang=${es ? 'es' : 'en'}`} className="btn-logout">{es ? 'Cerrar Sesión' : 'Log Out'}</a>
        </div>
      </div>

      {/* Welcome */}
      <div className="cp-welcome">
        <h1>{es ? `¡Bienvenido, ${order.firstName}!` : `Welcome, ${order.firstName}!`}</h1>
        <p>{es ? `Confirmación #${confirmationNumber}` : `Confirmation #${confirmationNumber}`}</p>
      </div>

      {/* Password success toast */}
      {pwSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '.87rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>✓</span>
          <span>{es ? 'Contraseña creada. Ya puedes iniciar sesión con tu email y contraseña.' : 'Password created. You can now sign in with your email and password.'}</span>
        </div>
      )}

      {/* Set password banner */}
      {pwBanner && !pwSuccess && (
        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontWeight: 700, fontSize: '.9rem', color: '#1e40af', margin: '0 0 2px' }}>
              {es ? '🔑 Crea tu contraseña' : '🔑 Set up your password'}
            </p>
            <p style={{ fontSize: '.8rem', color: '#3b82f6', margin: 0 }}>
              {es ? 'Para acceder más rápido en el futuro sin tu número de orden.' : 'Access your portal faster next time without your order number.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setPwForm(v => !v)} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {es ? 'Crear contraseña' : 'Create password'}
            </button>
            <button onClick={dismissPwBanner} style={{ background: 'none', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: '.82rem', color: '#3b82f6', cursor: 'pointer', fontFamily: 'inherit' }}>
              {es ? 'Ahora no' : 'Later'}
            </button>
          </div>
        </div>
      )}

      {/* Set password form */}
      {pwForm && !pwSuccess && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: '#1C2E44', marginBottom: 14, fontSize: '.95rem' }}>
            {es ? 'Crear contraseña' : 'Create your password'}
          </p>
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type={pwShow ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder={es ? 'Nueva contraseña (mín. 8 caracteres)' : 'New password (min. 8 characters)'}
                required
                style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.87rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setPwShow(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }} tabIndex={-1}>
                {pwShow ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <input
              type={pwShow ? 'text' : 'password'}
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              placeholder={es ? 'Confirmar contraseña' : 'Confirm password'}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.87rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {pwError && <p style={{ color: '#dc2626', fontSize: '.8rem', margin: 0 }}>{pwError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={pwLoading} style={{ background: '#1C2E44', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {pwLoading ? (es ? 'Guardando...' : 'Saving...') : (es ? 'Guardar contraseña' : 'Save password')}
              </button>
              <button type="button" onClick={() => setPwForm(false)} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', fontSize: '.85rem', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                {es ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Orders */}
      {allOrders.length > 1 && (
        <div className="cp-card">
          <h2>{es ? 'Mis Órdenes' : 'My Orders'}</h2>
          <div className="my-orders-grid">
            {allOrders.map(o => {
              const num = getConfirmationNumber(o.id, o.package)
              const oPkgKey = o.package?.toLowerCase()
              const pkgLabel = PACKAGE_INFO[oPkgKey]?.[es ? 'es' : 'en']
                ?? (oPkgKey === 'services' ? (es ? 'Servicios a la Carta' : 'À La Carte Services') : o.package)
              const isActive = o.id === order.id
              const sl = STATUS_LABELS[o.status] ?? { en: o.status, es: o.status }
              return (
                <a key={o.id} href={`/client-portal/dashboard?order=${o.id}`} className={`order-card${isActive ? ' active' : ''}`}>
                  <div className="order-card-left">
                    <div className="order-card-num">{num}</div>
                    <div className="order-card-company">{o.companyName}</div>
                    <div className="order-card-pkg">{pkgLabel}</div>
                  </div>
                  <div className="order-card-right">
                    <span className={`order-pill ${o.status}`}>{es ? sl.es : sl.en}</span>
                    <span className="order-card-arrow">{isActive ? '●' : '→'}</span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="cp-card">
        <h2>{es ? 'Estado de la Orden' : 'Order Status'}</h2>
        <div className="timeline">
          {steps.map((step, i) => {
            const isDone = i < currentStep
            const isCurrent = i === currentStep
            const className = isDone ? 'done' : isCurrent ? 'current' : 'pending'
            return (
              <div key={step.key} className={`timeline-item ${className}`}>
                <div style={{ position: 'relative' }}>
                  <div className={`timeline-icon ${className}`}>{isDone ? '✓' : i + 1}</div>
                  <div className="timeline-line" />
                </div>
                <div className="timeline-label">
                  <span className="step-name">{es ? step.labelEs : step.label}</span>
                  {isCurrent && <span className="step-badge">{es ? 'En Progreso' : 'In Progress'}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* What's Next */}
      <div className="cp-card">
        <h2>{es ? '¿Qué Sigue?' : "What's Next"}</h2>
        <div className={`status-pill ${order.status}`}>{es ? statusLabel.es : statusLabel.en}</div>
        <p className="whats-next-text">{whatsNext}</p>
      </div>

      {/* Company Details */}
      <div className="cp-card">
        <h2>{es ? 'Detalles de tu Empresa' : 'Your Company Details'}</h2>
        <div className="details-grid">
          <div className="detail-item">
            <div className="detail-label">{es ? 'Nombre de la Empresa' : 'Company Name'}</div>
            <div className="detail-value">{order.companyName || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">{es ? 'Tipo de Entidad' : 'Entity Type'}</div>
            <div className="detail-value">{order.entityType || 'LLC'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">{es ? 'Fecha de la Orden' : 'Order Date'}</div>
            <div className="detail-value">
              {new Date(order.createdAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">{es ? 'Correo de Contacto' : 'Contact Email'}</div>
            <div className="detail-value">{order.email}</div>
          </div>
        </div>
      </div>

      {/* Package & Services */}
      <div className="cp-card">
        <h2>{isAddon ? (es ? 'Tus Servicios' : 'Your Services') : (es ? 'Tu Paquete y Servicios' : 'Your Package & Services')}</h2>
        <div>
          <span className="pkg-name">
            {pkgInfo ? (es ? pkgInfo.es : pkgInfo.en) : isServicesOrder ? (es ? 'Servicios a la Carta' : 'À La Carte Services') : order.package}
          </span>
          {pkgInfo?.popular && <span className="pkg-popular">{es ? 'Más Popular' : 'Most Popular'}</span>}
        </div>
        {pkgInfo?.price && <div className="pkg-price">{pkgInfo.price}</div>}
        {isServicesOrder && <div className="pkg-price">{es ? `Total pagado: $${order.amount.toFixed(2)}` : `Total paid: $${order.amount.toFixed(2)}`}</div>}
        {order.speed === 'expedited' && (
          <div className="pkg-speed-badge">⚡ {es ? 'Procesamiento Prioritario (1–3 días)' : 'Priority Processing (1–3 days)'}</div>
        )}
        {isAddon ? (
          addonServices.length > 0 && (
            <>
              <div className="pkg-sublabel">{es ? 'Servicios Comprados' : 'Services Purchased'}</div>
              <ul className="pkg-services">
                {addonServices.map(s => (
                  <li key={s}><span className="chk">✓</span>{(ADDON_SERVICE_LABELS[s] ?? { en: s, es: s })[es ? 'es' : 'en']}</li>
                ))}
              </ul>
            </>
          )
        ) : isServicesOrder ? (
          servicesOrderLabels.length > 0 && (
            <>
              <div className="pkg-sublabel">{es ? 'Servicios Comprados' : 'Services Purchased'}</div>
              <ul className="pkg-services">
                {servicesOrderLabels.map(l => (
                  <li key={l}><span className="chk">✓</span>{l}</li>
                ))}
              </ul>
            </>
          )
        ) : (
          <>
            {pkgServices.length > 0 && (
              <>
                <div className="pkg-sublabel">{es ? 'Servicios Incluidos' : 'Included Services'}</div>
                <ul className="pkg-services">
                  {pkgServices.map(s => (
                    <li key={s.en}><span className="chk">✓</span>{es ? s.es : s.en}</li>
                  ))}
                </ul>
              </>
            )}
            {activeAddons.length > 0 && (
              <>
                <div className="pkg-sublabel">{es ? 'Adicionales' : 'Add-ons'}</div>
                <ul className="pkg-services">
                  {activeAddons.map(a => (
                    <li key={a.key}><span className="addon-chk">✓</span>{es ? a.es : a.en}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <a href={es ? '/servicios?lang=es' : '/servicios'} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '18px', padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
          {es ? '+ Agregar Servicios' : '+ Add Services'}
        </a>
      </div>

      {/* Documents */}
      <div className="cp-card">
        <h2>{es ? 'Mis Documentos' : 'My Documents'}</h2>
        {documents.map(doc => (
          <div key={doc.key} className="doc-item">
            <div className="doc-icon">📄</div>
            <div className="doc-info">
              <div className="doc-name">{es ? doc.labelEs : doc.label}</div>
              {!doc.url && <div className="doc-status">{es ? doc.pendingEs : doc.pending}</div>}
            </div>
            {doc.url ? (
              <a href={doc.url} className="btn-download" target="_blank" rel="noopener noreferrer">
                {es ? 'Descargar PDF' : 'Download PDF'}
              </a>
            ) : (
              <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500, flexShrink: 0 }}>
                {es ? 'Pendiente' : 'Pending'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
