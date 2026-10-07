export const dynamic = 'force-dynamic'

import OrdersTable from './OrdersTable'
import LogoutButton from './LogoutButton'
import AdminLangToggle from './AdminLangToggle'
import { getSupabaseAdmin } from '@/lib/supabase'
import { listOrdersWithSubscriptions } from '@/lib/order-subscriptions'
import { SERVICES_CATALOG } from '@/lib/services-pricing'

const T = {
  en: {
    title: 'Administration Panel', sub: 'opabiz.com',
    campaigns: 'Campaigns & Letters', appointments: 'Appointments',
    accounting: 'Accounting', security: 'Security', drafts: 'OrderDraft', opabiz: 'OpaBiz Connect', guias: 'Guides', posters: 'Labor Law Poster', manual: 'Manual', logout: 'Log out',
    totalOrders: 'Total Orders', unpaid: 'Unpaid',
    inReview: 'In Review', revenue: 'Total Revenue', failedPayments: 'Failed Payments',
    failedTitle: 'Subscriptions with a failed payment', failedHint: 'Stripe keeps retrying. The customer already got an email to update their card; follow up if it stays failed.',
  },
  es: {
    title: 'Panel de Administración', sub: 'opabiz.com',
    campaigns: 'Campañas y Cartas', appointments: 'Citas',
    accounting: 'Contabilidad', security: 'Seguridad', drafts: 'OrderDraft', opabiz: 'OpaBiz Connect', guias: 'Guías', posters: 'Labor Law Poster', manual: 'Manual', logout: 'Cerrar sesión',
    totalOrders: 'Total Órdenes', unpaid: 'Sin Pagar',
    inReview: 'En Revisión', revenue: 'Ingresos Totales', failedPayments: 'Pagos Fallidos',
    failedTitle: 'Suscripciones con pago fallido', failedHint: 'Stripe sigue reintentando. Al cliente ya le llegó un email para actualizar su tarjeta; dale seguimiento si sigue fallando.',
  },
}

interface NameCheck {
  available?: boolean
  exactCount?: number
  example?: string
  similarCount?: number
  normalized?: string
  checkedAt?: string
  error?: string
}

interface Order {
  id: string
  createdAt: string
  updatedAt: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  package: string
  amount: number
  paymentStatus: string
  status: string
  nameCheck: NameCheck | null
  isDraft?: boolean
  notes: string | null
}

async function getOrders(): Promise<Order[]> {
  // @brand-unified — el panel admin muestra órdenes de opabiz.com y
  // mybusinessformation.com juntas por decisión del founder (2026-09-04).
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, updatedAt, firstName, lastName, email, companyName, package, amount, paymentStatus, status, nameCheck, isDraft, notes')
    .order('createdAt', { ascending: false })
  if (error) {
    console.error('[admin/getOrders] Supabase error:', error.message)
    return []
  }
  // Borradores (formularios sin terminar de llenar, ver isDraft) no son órdenes
  // reales todavía — no deben mezclarse con el panel operativo del equipo.
  return (data ?? []).filter((o: Order) => !o.isDraft)
}

// Renovaciones que Stripe no pudo cobrar (status past_due, ver
// handleInvoicePaymentFailed en webhooks/stripe). Antes solo se veían entrando
// al detalle de cada orden; ahora el panel principal las junta (2026-10-06).
async function getFailedSubscriptionPayments(): Promise<{ orderId: string; customer: string; service: string }[]> {
  try {
    const orders = await listOrdersWithSubscriptions()
    return orders.flatMap(o => o.subscriptions
      .filter(e => e.status === 'past_due')
      .map(e => ({
        orderId: o.id,
        customer: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email,
        service: SERVICES_CATALOG[e.service]?.name_es ?? e.service,
      })))
  } catch (e) {
    console.error('[admin] getFailedSubscriptionPayments error:', e)
    return []
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang = (params.lang === 'en' ? 'en' : 'es') as 'en' | 'es'
  const t = T[lang]
  const [orders, failedPayments] = await Promise.all([getOrders(), getFailedSubscriptionPayments()])

  const total = orders.length
  const pendingPayment = orders.filter(o => o.paymentStatus === 'pending').length
  const inReview = orders.filter(o => o.status === 'in_review').length
  const revenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.amount ?? 0), 0)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: var(--font-sans); }

        .admin-wrapper { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .admin-header h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
        .admin-header p  { font-size: 13px; color: #6b7280; margin-top: 2px; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: #fff;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .stat-card .label {
          font-size: 12px; color: #6b7280; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .stat-card .value { font-size: 30px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }

        .stat-card.alert { border: 1.5px solid #fecaca; }
        .stat-card.alert .value { color: #b91c1c; }
        .failed-box { background: #fff; border: 1.5px solid #fecaca; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .failed-box h2 { font-size: 14px; color: #b91c1c; font-weight: 700; }
        .failed-box p { font-size: 12.5px; color: #6b7280; margin: 4px 0 10px; }
        .failed-box a { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 8px 0; border-top: 1px solid #f1f5f9; font-size: 13px; color: #1a1a2e; text-decoration: none; }
        .failed-box a:hover { color: #2563EB; }
        .failed-box a span:last-child { color: #6b7280; }

        .orders-card {
          background: transparent;
          border-radius: 10px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        @media (max-width: 640px) {
          .admin-wrapper { padding: 16px 12px; }
          .admin-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .admin-header h1 { font-size: 18px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { padding: 14px 16px; }
          .stat-card .value { font-size: 24px; }
        }
      `}</style>

      <div className="admin-wrapper">
        <div className="admin-header">
          <div>
            <h1>{t.title}</h1>
            <p>{t.sub}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminLangToggle />
            <a href={`/admin/campaigns?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.campaigns}
            </a>
            <a href="/admin/marketing" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              Marketing saliente
            </a>
            <a href={`/admin/citas?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.appointments}
            </a>
            <a href={`/admin/contabilidad?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.accounting}
            </a>
            <a href={`/admin/security?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.security}
            </a>
            <a href={`/admin/drafts?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.drafts}
            </a>
            <a href="/admin/opabiz" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.opabiz}
            </a>
            <a href="/admin/guias" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.guias}
            </a>
            <a href="/admin/labor-law-poster" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.posters}
            </a>
            <a href="/admin/manual" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.manual}
            </a>
            <LogoutButton lang={lang} />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">{t.totalOrders}</div>
            <div className="value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="label">{t.unpaid}</div>
            <div className="value">{pendingPayment}</div>
          </div>
          <div className="stat-card">
            <div className="label">{t.inReview}</div>
            <div className="value">{inReview}</div>
          </div>
          <div className="stat-card">
            <div className="label">{t.revenue}</div>
            <div className="value">
              ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`stat-card${failedPayments.length > 0 ? ' alert' : ''}`}>
            <div className="label">{t.failedPayments}</div>
            <div className="value">{failedPayments.length}</div>
          </div>
        </div>

        {failedPayments.length > 0 && (
          <div className="failed-box">
            <h2>{t.failedTitle}</h2>
            <p>{t.failedHint}</p>
            {failedPayments.map(f => (
              <a key={`${f.orderId}-${f.service}`} href={`/admin/orders/${f.orderId}`}>
                <span>{f.customer} · FBFC-{f.orderId.slice(0, 8).toUpperCase()}</span>
                <span>{f.service}</span>
              </a>
            ))}
          </div>
        )}

        <div className="orders-card">
          <OrdersTable orders={orders} lang={lang} />
        </div>
      </div>
    </>
  )
}
