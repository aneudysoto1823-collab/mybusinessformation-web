import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import DashboardContent from './DashboardContent'

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

function parseAddonServices(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch { /* noop */ }
  }
  return []
}

const ADDON_STEPS = [
  { key: 'payment',    label: 'Payment Confirmed',        labelEs: 'Pago Confirmado' },
  { key: 'processing', label: 'Processing Your Services', labelEs: 'Procesando tus Servicios' },
  { key: 'completed',  label: 'Services Delivered',       labelEs: 'Servicios Entregados' },
]

function getAddonStepIndex(status: string): number {
  if (status === 'completed') return 2
  if (status === 'in_review' || status === 'processing') return 1
  return 0
}

function parseAddons(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

interface DocumentItem {
  key: string
  label: string
  labelEs: string
  url: string | null
  pending: string
  pendingEs: string
}

async function getDocuments(orderId: string, order: Order): Promise<DocumentItem[]> {
  const supabase = getSupabaseAdmin()
  const bucket = 'certificates'
  const addons = parseAddons(order.addons)
  const pkgKey = (order.package ?? '').toLowerCase()

  async function signedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  }

  const docs: DocumentItem[] = []

  // Addon orders — documents based on purchased services array
  if (pkgKey === 'addon') {
    const services = parseAddonServices(order.addons)
    const hasEin  = services.includes('ein') || services.includes('bundle')
    const hasCert = services.includes('certificate_of_status') || services.includes('bundle')
    const hasLabor = services.includes('labor_law_poster') || services.includes('bundle')

    if (hasEin) docs.push({
      key: 'ein-letter',
      label: 'EIN / Tax ID Letter', labelEs: 'Carta EIN / ID Fiscal',
      url: await signedUrl(`orders/${orderId}/ein-letter.pdf`),
      pending: 'Pending — will be issued by the IRS', pendingEs: 'Pendiente — será emitido por el IRS',
    })
    if (hasCert) docs.push({
      key: 'certificate-of-status',
      label: 'Certificate of Status (FL)', labelEs: 'Certificado de Buena Reputación (FL)',
      url: await signedUrl(`orders/${orderId}/certificate-of-status.pdf`),
      pending: 'Pending — being processed', pendingEs: 'Pendiente — en proceso',
    })
    if (hasLabor) docs.push({
      key: 'labor-poster',
      label: 'Labor Law Poster 2026', labelEs: 'Póster de Ley Laboral 2026',
      url: await signedUrl(`orders/${orderId}/labor-poster.pdf`),
      pending: 'Pending — being prepared', pendingEs: 'Pendiente — siendo preparado',
    })
    return docs
  }

  // Formation orders — Certificate of Formation always shown
  docs.push({
    key: 'certificate',
    label: 'Certificate of Formation', labelEs: 'Certificado de Formación',
    url: order.status === 'completed'
      ? await signedUrl(`orders/${orderId}/certificate.pdf`)
      : null,
    pending: 'Pending — will be available once your business is approved',
    pendingEs: 'Pendiente — estará disponible cuando tu negocio sea aprobado',
  })

  // Operating Agreement
  if (addons.oa || pkgKey === 'premium') {
    docs.push({
      key: 'operating-agreement',
      label: 'Operating Agreement', labelEs: 'Acuerdo Operativo',
      url: await signedUrl(`orders/${orderId}/operating-agreement.pdf`),
      pending: 'Pending — being prepared by our team', pendingEs: 'Pendiente — siendo preparado por nuestro equipo',
    })
  }

  // EIN / Tax ID Letter
  if (addons.ein || pkgKey === 'standard' || pkgKey === 'premium') {
    docs.push({
      key: 'ein-letter',
      label: 'EIN / Tax ID Letter', labelEs: 'Carta EIN / ID Fiscal',
      url: await signedUrl(`orders/${orderId}/ein-letter.pdf`),
      pending: 'Pending — will be sent by IRS after formation', pendingEs: 'Pendiente — será enviado por el IRS tras la formación',
    })
  }

  // ITIN Application
  if (addons.itin || pkgKey === 'premium') {
    docs.push({
      key: 'itin-application',
      label: 'ITIN Application', labelEs: 'Solicitud de ITIN',
      url: await signedUrl(`orders/${orderId}/itin-application.pdf`),
      pending: 'Pending', pendingEs: 'Pendiente',
    })
  }

  return docs
}

async function getOrder(id: string): Promise<Order | null> {
  const { data } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, firstName, lastName, email, companyName, entityType, package, speed, amount, paymentStatus, status, addons')
    .eq('id', id)
    .single()
  return (data as Order | null)
}

async function getOrdersByEmail(email: string): Promise<Order[]> {
  const { data } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, firstName, lastName, email, companyName, entityType, package, speed, amount, paymentStatus, status, addons')
    .eq('email', email.toLowerCase().trim())
    .order('createdAt', { ascending: false })
  return (data ?? []) as Order[]
}

const STEPS = [
  { key: 'order_received',   label: 'Order Received',            labelEs: 'Orden Recibida' },
  { key: 'payment',          label: 'Payment Confirmed',         labelEs: 'Pago Confirmado' },
  { key: 'name_check',       label: 'Name Availability Check',   labelEs: 'Verificación de Nombre' },
  { key: 'ready_to_file',    label: 'Ready to File',             labelEs: 'Listo para Registrar' },
  { key: 'filed',            label: 'Processed with Florida',    labelEs: 'Procesado ante Florida' },
  { key: 'approved',         label: 'Approved by State',         labelEs: 'Aprobado por el Estado' },
  { key: 'completed',        label: 'Completed',                 labelEs: 'Completado' },
]

// Returns index of the current active step (0-based)
function getCurrentStepIndex(status: string): number {
  switch (status) {
    case 'pending':       return 0
    case 'in_review':     return 2
    case 'names_taken':   return 2
    case 'ready_to_file': return 3
    case 'filed':         return 4
    case 'approved':      return 5
    case 'completed':     return 6
    default:              return 0
  }
}

function getConfirmationNumber(id: string, pkg: string): string {
  const prefix = pkg === 'addon' ? 'FBNB' : 'FBFC'
  return `${prefix}-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const cookieStore = await cookies()
  const sessionOrderId = cookieStore.get('client_session')?.value
  if (!sessionOrderId) redirect('/client-portal')

  const sessionOrder = await getOrder(sessionOrderId)
  if (!sessionOrder) redirect('/client-portal')

  // Fetch all orders for this client's email
  const allOrders = await getOrdersByEmail(sessionOrder.email)

  // Determine which order to display (URL param or default to session order)
  const params = await searchParams
  const selectedId = params.order && allOrders.some(o => o.id === params.order)
    ? params.order
    : sessionOrderId

  const order = allOrders.find(o => o.id === selectedId) ?? sessionOrder

  const isAddon = order.package === 'addon'
  const currentStep = isAddon ? getAddonStepIndex(order.status) : getCurrentStepIndex(order.status)
  const confirmationNumber = getConfirmationNumber(order.id, order.package)
  const steps = isAddon ? ADDON_STEPS : STEPS
  const documents = await getDocuments(order.id, order)
  const portalLangCookie = cookieStore.get('portal_lang')?.value
  const initialLang: 'en' | 'es' = portalLangCookie === 'es' ? 'es' : 'en'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f4f6f9;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .cp-wrapper {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* Header */
        .cp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .cp-header-brand {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .cp-header-brand span {
          display: block;
          font-size: 13px;
          font-weight: 400;
          color: #6b7280;
          margin-top: 2px;
        }

        .btn-logout {
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          text-decoration: none;
        }

        .btn-logout:hover {
          border-color: #d1d5db;
          color: #111827;
        }

        /* My Orders */
        .my-orders-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .order-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          text-decoration: none;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
          gap: 12px;
        }
        .order-card:hover {
          border-color: #4f46e5;
          box-shadow: 0 2px 8px rgba(79,70,229,0.08);
        }
        .order-card.active {
          border-color: #4f46e5;
          background: #f5f3ff;
        }
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

        /* Welcome */
        .cp-welcome {
          margin-bottom: 28px;
        }

        .cp-welcome h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .cp-welcome p {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        /* Card */
        .cp-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
          padding: 28px 28px 24px;
          margin-bottom: 20px;
        }

        .cp-card h2 {
          font-size: 14px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        /* Timeline */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding-bottom: 20px;
          position: relative;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .timeline-icon.done {
          background: #d1fae5;
          color: #065f46;
        }

        .timeline-icon.current {
          background: #4f46e5;
          color: #ffffff;
        }

        .timeline-icon.pending {
          background: #f3f4f6;
          color: #9ca3af;
        }

        .timeline-line {
          position: absolute;
          left: 13px;
          top: 28px;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
          z-index: 0;
        }

        .timeline-item.done .timeline-line {
          background: #a7f3d0;
        }

        .timeline-item:last-child .timeline-line {
          display: none;
        }

        .timeline-label {
          padding-top: 4px;
        }

        .timeline-label .step-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }

        .timeline-item.pending .step-name {
          color: #9ca3af;
          font-weight: 500;
        }

        .timeline-item.current .step-name {
          color: #4f46e5;
        }

        .timeline-item.current .step-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 4px;
          padding: 2px 7px;
          margin-left: 8px;
          vertical-align: middle;
        }

        /* Details grid */
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 500px) {
          .details-grid { grid-template-columns: 1fr; }
        }

        .detail-item .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
        }

        .detail-item .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }

        /* What's next */
        .whats-next-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.65;
        }

        .status-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 12px;
        }

        .status-pill.pending       { background: #fef3c7; color: #92400e; }
        .status-pill.in_review     { background: #dbeafe; color: #1e40af; }
        .status-pill.processing    { background: #dbeafe; color: #1e40af; }
        .status-pill.names_taken   { background: #fee2e2; color: #991b1b; }
        .status-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .status-pill.filed         { background: #dbeafe; color: #1e40af; }
        .status-pill.approved      { background: #d1fae5; color: #065f46; }
        .status-pill.completed     { background: #d1fae5; color: #065f46; }

        /* Package & Services */
        .pkg-name {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a2e;
        }
        .pkg-price {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 2px;
          margin-bottom: 16px;
        }
        .pkg-popular {
          display: inline-block;
          background: #4f46e5;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 999px;
          margin-left: 10px;
          vertical-align: middle;
        }
        .pkg-speed-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .pkg-sublabel {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .pkg-services {
          list-style: none;
          padding: 0;
          margin: 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .pkg-services li {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          color: #374151;
        }
        .pkg-services li .chk { color: #16a34a; font-weight: 700; }
        .pkg-services li .addon-chk { color: #6d28d9; font-weight: 700; }
        .pkg-active-badge {
          background: #dcfce7;
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 999px;
          margin-left: 4px;
        }

        /* My Documents */
        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .doc-item:last-child { border-bottom: none; }
        .doc-icon {
          width: 36px;
          height: 36px;
          background: #eef2ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .doc-info { flex: 1; min-width: 0; }
        .doc-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .doc-status {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .btn-download {
          display: inline-block;
          background: #16a34a;
          color: #fff;
          text-decoration: none;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-download:hover { background: #15803d; }
        .lang-toggle { display: flex; background: #f3f4f6; border-radius: 20px; padding: 3px; gap: 2px; }
        .lang-btn { background: none; border: none; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; }
        .lang-btn.active { background: #1C2E44; color: #fff; }
        .lang-sep { width: 1px; background: #e2e8f0; }
      `}</style>
      <DashboardContent
        order={order}
        allOrders={allOrders}
        documents={documents}
        confirmationNumber={confirmationNumber}
        steps={steps}
        currentStep={currentStep}
        isAddon={isAddon}
        initialLang={initialLang}
      />
    </>
  )
}
