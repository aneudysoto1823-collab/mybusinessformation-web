export const dynamic = 'force-dynamic'

import OrdersTable from './OrdersTable'
import LogoutButton from './LogoutButton'
import { getSupabaseAdmin } from '@/lib/supabase'

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
}

async function getOrders(): Promise<Order[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, updatedAt, firstName, lastName, email, companyName, package, amount, paymentStatus, status')
    .order('createdAt', { ascending: false })
  if (error) {
    console.error('[admin/getOrders] Supabase error:', error.message)
    return []
  }
  return data ?? []
}

export default async function AdminDashboard() {
  const orders = await getOrders()

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
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }

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
            <h1>Panel de Administración</h1>
            <p>opabiz.com</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/admin/campaigns" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              📨 Campaigns
            </a>
            <a href="/admin/citas" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              📅 Citas
            </a>
            <a href="/admin/contabilidad" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              💰 Contabilidad
            </a>
            <a href="/admin/security" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              🔐 Seguridad
            </a>
            <LogoutButton />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Órdenes</div>
            <div className="value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="label">Sin Pagar</div>
            <div className="value">{pendingPayment}</div>
          </div>
          <div className="stat-card">
            <div className="label">En Revisión</div>
            <div className="value">{inReview}</div>
          </div>
          <div className="stat-card">
            <div className="label">Ingresos Totales</div>
            <div className="value">
              ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="orders-card">
          <OrdersTable orders={orders} />
        </div>
      </div>
    </>
  )
}
