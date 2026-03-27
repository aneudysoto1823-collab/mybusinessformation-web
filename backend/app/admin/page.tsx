import Link from 'next/link'

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
  package: string
  amount: number
  paymentStatus: string
  status: string
}

async function getOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.orders ?? data ?? []
  } catch {
    return []
  }
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pendiente',   bg: '#f3f4f6', color: '#6b7280' },
  in_review:  { label: 'En revisión', bg: '#fef9c3', color: '#92400e' },
  filed:      { label: 'Enviado',     bg: '#dbeafe', color: '#1d4ed8' },
  approved:   { label: 'Aprobado',    bg: '#dcfce7', color: '#16a34a' },
  completed:  { label: 'Completado',  bg: '#14532d', color: '#f0fdf4' },
}

const PAYMENT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Sin pagar', bg: '#f3f4f6', color: '#6b7280' },
  paid:      { label: 'Pagado',    bg: '#dcfce7', color: '#16a34a' },
  failed:    { label: 'Fallido',   bg: '#fee2e2', color: '#b91c1c' },
  refunded:  { label: 'Reembolso', bg: '#ffedd5', color: '#c2410c' },
}

function Badge({ type, value }: { type: 'status' | 'payment'; value: string }) {
  const map = type === 'status' ? STATUS_BADGE : PAYMENT_BADGE
  const b = map[value] ?? { label: value, bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: b.bg,
      color: b.color,
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {b.label}
    </span>
  )
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
        .stat-card .label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-card .value { font-size: 30px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }

        .card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .card-header {
          padding: 18px 24px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th {
          background: #f8fafc;
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        td {
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          color: #374151;
          white-space: nowrap;
        }
        tr:hover td { background: #f8fafc; }

        .link-ver {
          color: #4f46e5;
          font-weight: 600;
          text-decoration: none;
          font-size: 13px;
        }
        .link-ver:hover { text-decoration: underline; }

        .empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; }
      `}</style>

      <div className="admin-wrapper">
        <div className="admin-header">
          <div>
            <h1>Panel de Administración</h1>
            <p>MyBusinessFormation.com</p>
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

        <div className="card">
          <div className="card-header">Órdenes</div>
          <div className="table-wrap">
            {orders.length === 0 ? (
              <div className="empty">No hay órdenes todavía.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Empresa</th>
                    <th>Paquete</th>
                    <th>Monto</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}>
                        {order.id.slice(0, 8)}…
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.firstName} {order.lastName}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.email}</div>
                      </td>
                      <td>{order.companyName}</td>
                      <td style={{ textTransform: 'capitalize' }}>{order.package}</td>
                      <td>${(order.amount ?? 0).toFixed(2)}</td>
                      <td><Badge type="payment" value={order.paymentStatus} /></td>
                      <td><Badge type="status" value={order.status} /></td>
                      <td style={{ color: '#9ca3af' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="link-ver">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
