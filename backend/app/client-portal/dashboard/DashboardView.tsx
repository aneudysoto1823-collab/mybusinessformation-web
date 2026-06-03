'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/tracking'

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

interface Props {
  order: Order
  allOrders: Order[]
  selectedId: string
  confirmationNumber: string
  whatsNext: string
  whatsNextEs: string
  steps: { key: string; label: string; labelEs: string }[]
  currentStep: number
  documents: DocumentItem[]
  isAddon: boolean
  packageServices: string[]
  activeAddons: { key: string; label: string; labelEs: string }[]
  addonServices: { key: string; label: string; labelEs: string }[]
  statusLabel: string
  statusLabelEs: string
}

const STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending', in_review: 'In Review', names_taken: 'Names Taken',
  ready_to_file: 'Ready to File', filed: 'Processed', approved: 'Approved',
  completed: 'Completed', processing: 'Processing',
}
const STATUS_LABELS_ES: Record<string, string> = {
  pending: 'Pendiente', in_review: 'En Revisión', names_taken: 'Nombres Tomados',
  ready_to_file: 'Listo para Tramitar', filed: 'Procesado', approved: 'Aprobado',
  completed: 'Completado', processing: 'Procesando',
}

const PACKAGE_LABELS_ES: Record<string, string> = {
  basic: 'Básico', standard: 'Estándar', premium: 'Premium', addon: 'New Business Letter',
}

export default function DashboardView({
  order, allOrders, selectedId, confirmationNumber,
  whatsNext, whatsNextEs, steps, currentStep, documents,
  isAddon, packageServices, activeAddons, addonServices,
  statusLabel, statusLabelEs,
}: Props) {
  const [lang, setLang] = useState<'en' | 'es'>('en')

  // Hidratar idioma desde localStorage en mount — localStorage no existe en SSR.
  useEffect(() => {
    const saved = localStorage.getItem('portal_lang')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  function switchLang(l: 'en' | 'es') {
    setLang(l)
    localStorage.setItem('portal_lang', l)
    trackEvent('lang_toggle', { from: lang, to: l, source: 'client-portal-dashboard' })
  }

  const es = lang === 'es'

  function getOrderPkgLabel(pkg: string) {
    if (es) return PACKAGE_LABELS_ES[pkg] ?? pkg
    return pkg === 'addon' ? 'New Business Letter'
      : pkg === 'basic' ? 'Basic'
      : pkg === 'standard' ? 'Standard'
      : pkg === 'premium' ? 'Premium'
      : pkg
  }

  function getStatusLabel(status: string) {
    return es
      ? (STATUS_LABELS_ES[status] ?? status.replace(/_/g, ' '))
      : (STATUS_LABELS_EN[status] ?? status.replace(/_/g, ' '))
  }

  function getConfirmationNumber(id: string, pkg: string): string {
    const prefix = pkg === 'addon' ? 'FBNB' : 'FBFC'
    return `${prefix}-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  }

  const pkgKey = (order.package ?? '').toLowerCase()
  const pkgName = pkgKey === 'addon' ? 'New Business Letter'
    : pkgKey === 'basic' ? (es ? 'Básico' : 'Basic')
    : pkgKey === 'standard' ? (es ? 'Estándar' : 'Standard')
    : pkgKey === 'premium' ? 'Premium'
    : order.package

  const pkgPrice: Record<string, string> = {
    basic: '$49 + state fee', standard: '$149 + state fee', premium: '$249 + state fee', addon: 'Variable',
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }

        .cp-wrapper { max-width: 760px; margin: 0 auto; padding: 40px 24px 60px; }

        .cp-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 32px;
        }
        .cp-header-brand { font-size: 15px; font-weight: 700; color: #1a1a2e; }
        .cp-header-brand span { display: block; font-size: 13px; font-weight: 400; color: #6b7280; margin-top: 2px; }

        .header-right { display: flex; align-items: center; gap: 10px; }

        .lang-toggle {
          display: flex;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .lang-btn {
          padding: 5px 11px; font-size: 12px; font-weight: 700;
          color: #94a3b8; background: transparent; border: none;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .lang-btn.active { background: #1C2E44; color: #ffffff; }
        .lang-btn:hover:not(.active) { color: #374151; }
        .lang-sep { width: 1px; background: #e2e8f0; }

        .btn-logout {
          background: none; border: 1.5px solid #e5e7eb;
          border-radius: 8px; padding: 7px 14px;
          font-size: 13px; font-weight: 600; color: #374151;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
          text-decoration: none;
        }
        .btn-logout:hover { border-color: #d1d5db; color: #111827; }

        .my-orders-grid { display: flex; flex-direction: column; gap: 10px; }
        .order-card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border: 1.5px solid #e5e7eb; border-radius: 10px;
          text-decoration: none; background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s; gap: 12px;
        }
        .order-card:hover { border-color: #4f46e5; box-shadow: 0 2px 8px rgba(79,70,229,0.08); }
        .order-card.active { border-color: #4f46e5; background: #f5f3ff; }
        .order-card-left { display: flex; flex-direction: column; gap: 3px; }
        .order-card-num { font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; }
        .order-card.active .order-card-num { color: #3730a3; }
        .order-card-company { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .order-card-pkg { font-size: 12px; color: #6b7280; }
        .order-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .order-card-arrow { font-size: 14px; color: #9ca3af; }
        .order-card.active .order-card-arrow { color: #4f46e5; }
        .order-pill {
          font-size: 11px; font-weight: 700; padding: 2px 9px;
          border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px;
        }
        .order-pill.pending       { background: #fef3c7; color: #92400e; }
        .order-pill.in_review     { background: #dbeafe; color: #1e40af; }
        .order-pill.processing    { background: #dbeafe; color: #1e40af; }
        .order-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .order-pill.filed         { background: #dbeafe; color: #1e40af; }
        .order-pill.approved      { background: #d1fae5; color: #065f46; }
        .order-pill.completed     { background: #d1fae5; color: #065f46; }
        .order-pill.names_taken   { background: #fee2e2; color: #991b1b; }

        .cp-welcome { margin-bottom: 28px; }
        .cp-welcome h1 { font-size: 24px; font-weight: 700; color: #1a1a2e; }
        .cp-welcome p { font-size: 14px; color: #6b7280; margin-top: 4px; }

        .cp-card {
          background: #ffffff; border-radius: 12px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
          padding: 28px 28px 24px; margin-bottom: 20px;
        }
        .cp-card h2 {
          font-size: 14px; font-weight: 700; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px;
        }

        .timeline { display: flex; flex-direction: column; gap: 0; }
        .timeline-item { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 20px; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-icon {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          position: relative; z-index: 1;
        }
        .timeline-icon.done { background: #d1fae5; color: #065f46; }
        .timeline-icon.current { background: #4f46e5; color: #ffffff; }
        .timeline-icon.pending { background: #f3f4f6; color: #9ca3af; }
        .timeline-line {
          position: absolute; left: 13px; top: 28px; bottom: 0;
          width: 2px; background: #e5e7eb; z-index: 0;
        }
        .timeline-item.done .timeline-line { background: #a7f3d0; }
        .timeline-item:last-child .timeline-line { display: none; }
        .timeline-label { padding-top: 4px; }
        .timeline-label .step-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .timeline-item.pending .step-name { color: #9ca3af; font-weight: 500; }
        .timeline-item.current .step-name { color: #4f46e5; }
        .timeline-item.current .step-badge {
          display: inline-block; font-size: 11px; font-weight: 600;
          color: #4f46e5; background: #eef2ff; border-radius: 4px;
          padding: 2px 7px; margin-left: 8px; vertical-align: middle;
        }

        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .details-grid { grid-template-columns: 1fr; } }
        .detail-item .detail-label { font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }
        .detail-item .detail-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }

        .whats-next-text { font-size: 14px; color: #374151; line-height: 1.65; }

        .status-pill {
          display: inline-block; font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 12px;
        }
        .status-pill.pending       { background: #fef3c7; color: #92400e; }
        .status-pill.in_review     { background: #dbeafe; color: #1e40af; }
        .status-pill.processing    { background: #dbeafe; color: #1e40af; }
        .status-pill.names_taken   { background: #fee2e2; color: #991b1b; }
        .status-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .status-pill.filed         { background: #dbeafe; color: #1e40af; }
        .status-pill.approved      { background: #d1fae5; color: #065f46; }
        .status-pill.completed     { background: #d1fae5; color: #065f46; }

        .pkg-name { font-size: 22px; font-weight: 800; color: #1a1a2e; }
        .pkg-price { font-size: 14px; color: #6b7280; font-weight: 600; margin-top: 2px; margin-bottom: 16px; }
        .pkg-popular { display: inline-block; background: #4f46e5; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; margin-left: 10px; vertical-align: middle; }
        .pkg-speed-badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #16a34a; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 700; margin-bottom: 18px; }
        .pkg-sublabel { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .pkg-services { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 7px; }
        .pkg-services li { display: flex; align-items: center; gap: 9px; font-size: 14px; color: #374151; }
        .pkg-services li .chk { color: #16a34a; font-weight: 700; }
        .pkg-services li .addon-chk { color: #6d28d9; font-weight: 700; }
        .pkg-active-badge { background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; margin-left: 4px; }

        .doc-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .doc-item:last-child { border-bottom: none; }
        .doc-icon { width: 36px; height: 36px; background: #eef2ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .doc-info { flex: 1; min-width: 0; }
        .doc-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .doc-status { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .btn-download { display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .btn-download:hover { background: #15803d; }

        @media (max-width: 480px) {
          .cp-wrapper { padding: 20px 14px 40px; }
          .cp-header { flex-wrap: wrap; gap: 10px; }
          .cp-header-brand { font-size: 14px; }
          .cp-welcome h1 { font-size: 20px; }
          .cp-card { padding: 18px 16px 16px; }
          .btn-logout { padding: 6px 10px; font-size: 12px; }
          .doc-item { flex-wrap: wrap; gap: 10px; }
          .doc-icon { width: 32px; height: 32px; font-size: 16px; }
          .btn-download { width: 100%; text-align: center; padding: 10px 16px; min-height: 44px; }
          .order-card { padding: 12px 14px; }
        }
      `}</style>

      <div className="cp-wrapper">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-brand">
            Florida Business Formation Center
            <span>{es ? 'Portal de Clientes' : 'Client Portal'}</span>
          </div>
          <div className="header-right">
            <div className="lang-toggle">
              <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
              <div className="lang-sep" />
              <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => switchLang('es')}>ES</button>
            </div>
            <a href="/api/client-auth/logout" className="btn-logout">
              {es ? 'Cerrar sesión' : 'Log Out'}
            </a>
          </div>
        </div>

        {/* Welcome */}
        <div className="cp-welcome">
          <h1>{es ? `¡Bienvenido, ${order.firstName}!` : `Welcome, ${order.firstName}!`}</h1>
          <p>{es ? 'Confirmación #' : 'Confirmation #'}{confirmationNumber}</p>
        </div>

        {/* My Orders */}
        {allOrders.length > 1 && (
          <div className="cp-card">
            <h2>{es ? 'Mis Órdenes' : 'My Orders'}</h2>
            <div className="my-orders-grid">
              {allOrders.map(o => {
                const num = getConfirmationNumber(o.id, o.package)
                const isActive = o.id === selectedId
                return (
                  <a key={o.id} href={`/client-portal/dashboard?order=${o.id}`} className={`order-card${isActive ? ' active' : ''}`}>
                    <div className="order-card-left">
                      <div className="order-card-num">{num}</div>
                      <div className="order-card-company">{o.companyName}</div>
                      <div className="order-card-pkg">{getOrderPkgLabel(o.package)}</div>
                    </div>
                    <div className="order-card-right">
                      <span className={`order-pill ${o.status}`}>{getStatusLabel(o.status)}</span>
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
          <h2>{es ? 'Estado de tu Orden' : 'Order Status'}</h2>
          <div className="timeline">
            {steps.map((step, i) => {
              const isDone = i < currentStep
              const isCurrent = i === currentStep
              const cls = isDone ? 'done' : isCurrent ? 'current' : 'pending'
              return (
                <div key={step.key} className={`timeline-item ${cls}`}>
                  <div style={{ position: 'relative' }}>
                    <div className={`timeline-icon ${cls}`}>{isDone ? '✓' : i + 1}</div>
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
          <h2>{es ? '¿Qué sigue?' : "What's Next"}</h2>
          <div className={`status-pill ${order.status}`}>{es ? statusLabelEs : statusLabel}</div>
          <p className="whats-next-text">{es ? whatsNextEs : whatsNext}</p>
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
              <div className="detail-label">{es ? 'Fecha de Orden' : 'Order Date'}</div>
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
          <div><span className="pkg-name">{pkgName}</span>{pkgKey === 'standard' && <span className="pkg-popular">{es ? 'Más Popular' : 'Most Popular'}</span>}</div>
          <div className="pkg-price">{pkgPrice[pkgKey]}</div>
          {order.speed === 'expedited' && (
            <div className="pkg-speed-badge">⚡ {es ? 'Procesamiento Prioritario (1–3 días)' : 'Priority Processing (1–3 days)'}</div>
          )}
          {packageServices.length > 0 && (
            <>
              <div className="pkg-sublabel">{isAddon ? (es ? 'Servicios Comprados' : 'Services Purchased') : (es ? 'Servicios Incluidos' : 'Included Services')}</div>
              <ul className="pkg-services">
                {(isAddon ? addonServices : packageServices.map(s => ({ key: s, label: s, labelEs: s }))).map(s => (
                  <li key={typeof s === 'string' ? s : s.key}>
                    <span className={isAddon ? 'chk' : 'chk'}>✓</span>
                    {typeof s === 'string' ? s : (es ? s.labelEs : s.label)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {!isAddon && activeAddons.length > 0 && (
            <>
              <div className="pkg-sublabel">Add-ons</div>
              <ul className="pkg-services">
                {activeAddons.map(a => (
                  <li key={a.key}><span className="addon-chk">✓</span>{es ? a.labelEs : a.label}</li>
                ))}
              </ul>
            </>
          )}
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
              {doc.url
                ? <a href={doc.url} className="btn-download" target="_blank" rel="noopener noreferrer">{es ? 'Descargar PDF' : 'Download PDF'}</a>
                : <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500, flexShrink: 0 }}>{es ? 'Pendiente' : 'Pending'}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
