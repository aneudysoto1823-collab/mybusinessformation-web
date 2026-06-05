import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'

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

const PACKAGE_INFO: Record<string, { name: string; price: string; popular?: boolean }> = {
  basic:    { name: 'Basic',               price: '$49 + state fee' },
  standard: { name: 'Standard',           price: '$149 + state fee', popular: true },
  premium:  { name: 'Premium',            price: '$249 + state fee' },
  addon:    { name: 'New Business Letter', price: 'Variable' },
}

const ADDON_SERVICE_LABELS: Record<string, string> = {
  ein:                   'EIN / Tax ID Number',
  labor_law_poster:      'Labor Law Poster 2026',
  certificate_of_status: 'Certificate of Status (FL)',
  bundle:                'Business Essentials Bundle (EIN + Labor Poster + Certificate)',
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
  { key: 'payment',    label: 'Payment Confirmed' },
  { key: 'processing', label: 'Processing Your Services' },
  { key: 'completed',  label: 'Services Delivered' },
]

function getAddonStepIndex(status: string): number {
  if (status === 'completed') return 2
  if (status === 'in_review' || status === 'processing') return 1
  return 0
}

function getAddonWhatsNext(status: string): string {
  if (status === 'completed') return 'Your services are ready! Check the Documents section below to download your files.'
  if (status === 'in_review' || status === 'processing') return 'Payment confirmed! Our team is processing your services. We\'ll email you as soon as everything is ready.'
  return 'Your order has been received and is being reviewed.'
}

const PACKAGE_SERVICES: Record<string, string[]> = {
  basic: [
    'Business Formation Filing',
    'Name Availability Search',
    'Florida Certificate of Formation',
  ],
  standard: [
    'Business Formation Filing',
    'Name Availability Search',
    'Florida Certificate of Formation',
    'EIN / Tax ID Number',
    'Bank Account Guide',
    'Registered Agent (1st year free)',
  ],
  premium: [
    'Business Formation Filing',
    'Name Availability Search',
    'Florida Certificate of Formation',
    'EIN / Tax ID Number',
    'Bank Account Guide',
    'Registered Agent (1st year free)',
    'Operating Agreement',
    'Expedited Filing (1–3 days)',
    'ITIN Application',
    'DBA / Fictitious Name',
    'Articles of Amendment',
  ],
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
  url: string | null
  pending: string
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
      label: 'EIN / Tax ID Letter',
      url: await signedUrl(`orders/${orderId}/ein-letter.pdf`),
      pending: 'Pending — will be issued by the IRS',
    })
    if (hasCert) docs.push({
      key: 'certificate-of-status',
      label: 'Certificate of Status (FL)',
      url: await signedUrl(`orders/${orderId}/certificate-of-status.pdf`),
      pending: 'Pending — being processed',
    })
    if (hasLabor) docs.push({
      key: 'labor-poster',
      label: 'Labor Law Poster 2026',
      url: await signedUrl(`orders/${orderId}/labor-poster.pdf`),
      pending: 'Pending — being prepared',
    })
    return docs
  }

  // Formation orders — Certificate of Formation always shown
  docs.push({
    key: 'certificate',
    label: 'Certificate of Formation',
    url: order.status === 'completed'
      ? await signedUrl(`orders/${orderId}/certificate.pdf`)
      : null,
    pending: 'Pending — will be available once your business is approved',
  })

  // Operating Agreement
  if (addons.oa || pkgKey === 'premium') {
    docs.push({
      key: 'operating-agreement',
      label: 'Operating Agreement',
      url: await signedUrl(`orders/${orderId}/operating-agreement.pdf`),
      pending: 'Pending — being prepared by our team',
    })
  }

  // EIN / Tax ID Letter
  if (addons.ein || pkgKey === 'standard' || pkgKey === 'premium') {
    docs.push({
      key: 'ein-letter',
      label: 'EIN / Tax ID Letter',
      url: await signedUrl(`orders/${orderId}/ein-letter.pdf`),
      pending: 'Pending — will be sent by IRS after formation',
    })
  }

  // ITIN Application
  if (addons.itin || pkgKey === 'premium') {
    docs.push({
      key: 'itin-application',
      label: 'ITIN Application',
      url: await signedUrl(`orders/${orderId}/itin-application.pdf`),
      pending: 'Pending',
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

const STATUS_LABELS: Record<string, string> = {
  pending:        'Pending',
  in_review:      'In Review',
  names_taken:    'Names Taken',
  ready_to_file:  'Ready to File',
  filed:          'Processed',
  approved:       'Approved',
  completed:      'Completed',
  processing:     'Processing',
}

const STEPS = [
  { key: 'order_received',   label: 'Order Received' },
  { key: 'payment',          label: 'Payment Confirmed' },
  { key: 'name_check',       label: 'Name Availability Check' },
  { key: 'ready_to_file',    label: 'Ready to File' },
  { key: 'filed',            label: 'Processed with Florida' },
  { key: 'approved',         label: 'Approved by State' },
  { key: 'completed',        label: 'Completed' },
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

function getWhatsNext(status: string): string {
  switch (status) {
    case 'pending':
      return 'Your order has been received. Complete your payment to get started.'
    case 'in_review':
      return 'Payment confirmed! Our team is verifying the availability of your business names with the State of Florida.'
    case 'names_taken':
      return 'The names you selected are already registered in Florida. Our team will send you alternative name suggestions shortly — please check your email.'
    case 'ready_to_file':
      return 'A business name is available! Our team is preparing to file your formation documents with the State of Florida.'
    case 'filed':
      return 'Your business formation documents have been submitted to the State of Florida. Approval typically takes 3–5 business days.'
    case 'approved':
      return 'Florida has approved your business! We are preparing your Certificate of Formation and will send it to your email shortly.'
    case 'completed':
      return 'Your business is officially formed. Check your email for the Certificate of Formation. Welcome to the business world!'
    default:
      return 'Your order is being processed. We will keep you updated by email.'
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
  const whatsNext = isAddon ? getAddonWhatsNext(order.status) : getWhatsNext(order.status)
  const steps = isAddon ? ADDON_STEPS : STEPS
  const documents = await getDocuments(order.id, order)

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
      `}</style>

      <div className="cp-wrapper">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-brand">
            MyBusinessFormation
            <span>Client Portal</span>
          </div>
          <a href="/api/client-auth/logout" className="btn-logout">Log Out</a>
        </div>

        {/* Welcome */}
        <div className="cp-welcome">
          <h1>Welcome, {order.firstName}!</h1>
          <p>Confirmation #{confirmationNumber}</p>
        </div>

        {/* My Orders — only shown when client has multiple orders */}
        {allOrders.length > 1 && (
          <div className="cp-card">
            <h2>My Orders</h2>
            <div className="my-orders-grid">
              {allOrders.map(o => {
                const num = getConfirmationNumber(o.id, o.package)
                const pkgLabel = o.package === 'addon' ? 'New Business Letter'
                  : o.package === 'basic' ? 'Basic'
                  : o.package === 'standard' ? 'Standard'
                  : o.package === 'premium' ? 'Premium'
                  : o.package
                const isActive = o.id === order.id
                return (
                  <a
                    key={o.id}
                    href={`/client-portal/dashboard?order=${o.id}`}
                    className={`order-card${isActive ? ' active' : ''}`}
                  >
                    <div className="order-card-left">
                      <div className="order-card-num">{num}</div>
                      <div className="order-card-company">{o.companyName}</div>
                      <div className="order-card-pkg">{pkgLabel}</div>
                    </div>
                    <div className="order-card-right">
                      <span className={`order-pill ${o.status}`}>
                        {STATUS_LABELS[o.status] ?? o.status.replace(/_/g, ' ')}
                      </span>
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
          <h2>Order Status</h2>
          <div className="timeline">
            {steps.map((step, i) => {
              const isDone = i < currentStep
              const isCurrent = i === currentStep
              const className = isDone ? 'done' : isCurrent ? 'current' : 'pending'
              return (
                <div key={step.key} className={`timeline-item ${className}`}>
                  <div style={{ position: 'relative' }}>
                    <div className={`timeline-icon ${className}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div className="timeline-line" />
                  </div>
                  <div className="timeline-label">
                    <span className="step-name">{step.label}</span>
                    {isCurrent && <span className="step-badge">In Progress</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* What's Next */}
        <div className="cp-card">
          <h2>What&apos;s Next</h2>
          <div className={`status-pill ${order.status}`}>
            {STATUS_LABELS[order.status] ?? (order.status ?? '').replace(/_/g, ' ')}
          </div>
          <p className="whats-next-text">{whatsNext}</p>
        </div>

        {/* Company Details */}
        <div className="cp-card">
          <h2>Your Company Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-label">Company Name</div>
              <div className="detail-value">{order.companyName || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Entity Type</div>
              <div className="detail-value">{order.entityType || 'LLC'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Order Date</div>
              <div className="detail-value">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Contact Email</div>
              <div className="detail-value">{order.email}</div>
            </div>
          </div>
        </div>

        {/* Package & Services */}
        {(() => {
          const pkgKey = (order.package ?? '').toLowerCase()
          const pkgInfo = PACKAGE_INFO[pkgKey]

          if (pkgKey === 'addon') {
            const services = parseAddonServices(order.addons)
            return (
              <div className="cp-card">
                <h2>Your Services</h2>
                <div>
                  <span className="pkg-name">New Business Letter</span>
                </div>
                {services.length > 0 && (
                  <>
                    <div className="pkg-sublabel">Services Purchased</div>
                    <ul className="pkg-services">
                      {services.map(s => (
                        <li key={s}>
                          <span className="chk">✓</span>
                          {ADDON_SERVICE_LABELS[s] ?? s}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <a href="/servicios" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '18px', padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  + Add Services
                </a>
              </div>
            )
          }

          const services = PACKAGE_SERVICES[pkgKey] ?? []
          const addons = parseAddons(order.addons)
          const addonItems: { key: string; label: string }[] = [
            { key: 'ein',  label: 'EIN / Tax ID' },
            { key: 'oa',   label: 'Operating Agreement' },
            { key: 'itin', label: 'ITIN Application' },
            { key: 'ar',   label: 'Annual Report Filing' },
          ]
          const activeAddons = addonItems.filter(a => addons[a.key])
          return (
            <div className="cp-card">
              <h2>Your Package &amp; Services</h2>
              <div>
                <span className="pkg-name">{pkgInfo?.name ?? order.package}</span>
                {pkgInfo?.popular && <span className="pkg-popular">Most Popular</span>}
              </div>
              <div className="pkg-price">{pkgInfo?.price}</div>

              {order.speed === 'expedited' && (
                <div className="pkg-speed-badge">⚡ Priority Processing (1–3 days)</div>
              )}

              {services.length > 0 && (
                <>
                  <div className="pkg-sublabel">Included Services</div>
                  <ul className="pkg-services">
                    {services.map(s => (
                      <li key={s}>
                        <span className="chk">✓</span>
                        {s}
                        {s === 'Expedited Filing (1–3 days)' && order.speed === 'expedited' && (
                          <span className="pkg-active-badge">ACTIVE</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {activeAddons.length > 0 && (
                <>
                  <div className="pkg-sublabel">Add-ons</div>
                  <ul className="pkg-services">
                    {activeAddons.map(a => (
                      <li key={a.key}>
                        <span className="addon-chk">✓</span>
                        {a.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <a href="/servicios" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '18px', padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                + Add Services
              </a>
            </div>
          )
        })()}

        {/* My Documents */}
        <div className="cp-card">
          <h2>My Documents</h2>
          {documents.map(doc => (
            <div key={doc.key} className="doc-item">
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-name">{doc.label}</div>
                {!doc.url && (
                  <div className="doc-status">{doc.pending}</div>
                )}
              </div>
              {doc.url ? (
                <a href={doc.url} className="btn-download" target="_blank" rel="noopener noreferrer">
                  Download PDF
                </a>
              ) : (
                <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500, flexShrink: 0 }}>Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
