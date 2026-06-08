'use client'

import { useState, useEffect } from 'react'

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
}

const PACKAGE_INFO: Record<string, { en: string; es: string; price: string; popular?: boolean }> = {
  basic:    { en: 'Basic',               es: 'Básico',   price: '$49 + state fee' },
  standard: { en: 'Standard',           es: 'Estándar', price: '$149 + state fee', popular: true },
  premium:  { en: 'Premium',            es: 'Premium',  price: '$249 + state fee' },
  addon:    { en: 'New Business Letter', es: 'New Business Letter', price: 'Variable' },
}

const PACKAGE_SERVICES: Record<string, { en: string; es: string }[]> = {
  basic: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Florida Certificate of Formation', es: 'Certificado de Formación de Florida' },
  ],
  standard: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Florida Certificate of Formation', es: 'Certificado de Formación de Florida' },
    { en: 'EIN / Tax ID Number',              es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide',               es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
  ],
  premium: [
    { en: 'Business Formation Filing',       es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search',         es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Florida Certificate of Formation', es: 'Certificado de Formación de Florida' },
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
    approved:       { en: 'Florida has approved your business! We are preparing your Certificate of Formation and will send it to your email shortly.', es: '¡Florida ha aprobado tu negocio! Estamos preparando tu Certificado de Formación y te lo enviaremos pronto.' },
    completed:      { en: 'Your business is officially formed. Check your email for the Certificate of Formation. Welcome to the business world!', es: 'Tu negocio está oficialmente formado. Revisa tu correo para el Certificado de Formación. ¡Bienvenido al mundo empresarial!' },
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
  steps, currentStep, isAddon, initialLang,
}: Props) {
  const [lang, setLang] = useState<'en' | 'es'>(initialLang)

  useEffect(() => {
    const portalLang = localStorage.getItem('portal_lang')
    const siteLang = localStorage.getItem('flbc_lang')
    const detected = portalLang || siteLang
    if (detected === 'es') { setLang('es'); localStorage.setItem('portal_lang', 'es') }
    else if (detected === 'en') setLang('en')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function switchLang(l: 'en' | 'es') {
    setLang(l)
    localStorage.setItem('portal_lang', l)
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

  return (
    <div className="cp-wrapper">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-brand">
          OpaBiz
          <span>{es ? 'Portal del Cliente' : 'Client Portal'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
            <div className="lang-sep" />
            <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => switchLang('es')}>ES</button>
          </div>
          <a href="/api/client-auth/logout" className="btn-logout">{es ? 'Cerrar Sesión' : 'Log Out'}</a>
        </div>
      </div>

      {/* Welcome */}
      <div className="cp-welcome">
        <h1>{es ? `¡Bienvenido, ${order.firstName}!` : `Welcome, ${order.firstName}!`}</h1>
        <p>{es ? `Confirmación #${confirmationNumber}` : `Confirmation #${confirmationNumber}`}</p>
      </div>

      {/* My Orders */}
      {allOrders.length > 1 && (
        <div className="cp-card">
          <h2>{es ? 'Mis Órdenes' : 'My Orders'}</h2>
          <div className="my-orders-grid">
            {allOrders.map(o => {
              const num = getConfirmationNumber(o.id, o.package)
              const pkgLabel = PACKAGE_INFO[o.package?.toLowerCase()]?.[es ? 'es' : 'en'] ?? o.package
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
          <span className="pkg-name">{pkgInfo ? (es ? pkgInfo.es : pkgInfo.en) : order.package}</span>
          {pkgInfo?.popular && <span className="pkg-popular">{es ? 'Más Popular' : 'Most Popular'}</span>}
        </div>
        {pkgInfo?.price && <div className="pkg-price">{pkgInfo.price}</div>}
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
