import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const BACKEND_URL =
  process.env.BACKEND_URL ||
  'https://mybusinessformation-web-production.up.railway.app'

interface Order {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  entityType: string
  package: string
  amount: number
  paymentStatus: string
  status: string
}

async function getOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.order ?? data ?? null
  } catch {
    return null
  }
}

const STEPS = [
  { key: 'order_received',   label: 'Order Received' },
  { key: 'payment',          label: 'Payment Confirmed' },
  { key: 'name_check',       label: 'Name Availability Check' },
  { key: 'ready_to_file',    label: 'Ready to File' },
  { key: 'filed',            label: 'Filed with Florida' },
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

function getConfirmationNumber(id: string): string {
  return `FBFC-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

export default async function ClientDashboardPage() {
  const cookieStore = await cookies()
  const orderId = cookieStore.get('client_session')?.value

  if (!orderId) redirect('/client-portal')

  const order = await getOrder(orderId)
  if (!order) redirect('/client-portal')

  const currentStep = getCurrentStepIndex(order.status)
  const confirmationNumber = getConfirmationNumber(order.id)
  const whatsNext = getWhatsNext(order.status)

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
        .status-pill.names_taken   { background: #fee2e2; color: #991b1b; }
        .status-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .status-pill.filed         { background: #dbeafe; color: #1e40af; }
        .status-pill.approved      { background: #d1fae5; color: #065f46; }
        .status-pill.completed     { background: #d1fae5; color: #065f46; }
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

        {/* Timeline */}
        <div className="cp-card">
          <h2>Order Status</h2>
          <div className="timeline">
            {STEPS.map((step, i) => {
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
            {(order.status ?? '').replace(/_/g, ' ')}
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
              <div className="detail-label">Package</div>
              <div className="detail-value">{order.package || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Amount</div>
              <div className="detail-value">
                ${(order.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
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
      </div>
    </>
  )
}
