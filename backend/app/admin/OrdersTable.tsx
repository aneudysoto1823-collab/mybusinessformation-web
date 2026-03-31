'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface Order {
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

const TABS = [
  { key: 'all',            label: 'Todas' },
  { key: 'pending',        label: 'Pending' },
  { key: 'in_review',      label: 'In review' },
  { key: 'names_taken',    label: 'Names taken' },
  { key: 'ready_to_file',  label: 'Ready to file' },
  { key: 'filed',          label: 'Filed' },
  { key: 'approved',       label: 'Approved' },
  { key: 'completed',      label: 'Completed' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:        { label: 'Pending',        bg: '#f3f4f6', color: '#6b7280' },
  in_review:      { label: 'In review',      bg: '#fef9c3', color: '#92400e' },
  names_taken:    { label: 'Names taken',    bg: '#fee2e2', color: '#b91c1c' },
  ready_to_file:  { label: 'Ready to file',  bg: '#ede9fe', color: '#6d28d9' },
  filed:          { label: 'Filed',          bg: '#dbeafe', color: '#1d4ed8' },
  approved:       { label: 'Approved',       bg: '#dcfce7', color: '#16a34a' },
  completed:      { label: 'Completed',      bg: '#14532d', color: '#f0fdf4' },
}

const PAYMENT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: 'Sin pagar', bg: '#f3f4f6', color: '#6b7280' },
  paid:     { label: 'Pagado',    bg: '#dcfce7', color: '#16a34a' },
  failed:   { label: 'Fallido',   bg: '#fee2e2', color: '#b91c1c' },
  refunded: { label: 'Reembolso', bg: '#ffedd5', color: '#c2410c' },
}

const PKG_ORDER: Record<string, number> = { basic: 0, standard: 1, premium: 2 }

function Badge({ map, value }: { map: Record<string, { label: string; bg: string; color: string }>; value: string }) {
  const b = map[value] ?? { label: value, bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: b.bg, color: b.color,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {b.label}
    </span>
  )
}

function isStale(order: Order): boolean {
  if (order.status === 'completed' || order.status === 'approved') return false
  if (!order.updatedAt) return false
  return Date.now() - new Date(order.updatedAt).getTime() > 24 * 60 * 60 * 1000
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [pkgFilter, setPkgFilter] = useState('all')
  const [search, setSearch] = useState('')

  const countFor = (key: string) =>
    key === 'all' ? orders.length : orders.filter(o => o.status === key).length

  let visible = activeTab === 'all'
    ? [...orders]
    : orders.filter(o => o.status === activeTab)

  if (pkgFilter !== 'all') {
    visible = visible.filter(o => o.package === pkgFilter)
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    visible = visible.filter(o => {
      const fbfc = ('FBFC-' + o.id.replace(/-/g, '').substring(0, 8)).toLowerCase()
      const name = `${o.firstName} ${o.lastName}`.toLowerCase()
      const email = (o.email ?? '').toLowerCase()
      return fbfc.includes(q) || name.includes(q) || email.includes(q)
    })
  }

  visible.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'amount_desc': return (b.amount ?? 0) - (a.amount ?? 0)
      case 'amount_asc':  return (a.amount ?? 0) - (b.amount ?? 0)
      case 'package': return (PKG_ORDER[a.package] ?? 0) - (PKG_ORDER[b.package] ?? 0)
      default:        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <>
      <style>{`
        .controls-bar {
          display: flex;
          gap: 10px;
          padding: 16px 24px 12px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .ctrl-select {
          padding: 7px 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 7px;
          font-size: 13px;
          font-family: inherit;
          color: #374151;
          background: #fff;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }
        .ctrl-select:focus { border-color: #4f46e5; }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 12px 24px 0;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
        }
        .tab-btn {
          padding: 8px 14px;
          border: none;
          background: transparent;
          border-radius: 6px 6px 0 0;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s, border-color 0.15s;
          font-family: inherit;
        }
        .tab-btn:hover { color: #4f46e5; }
        .tab-btn.active {
          color: #4f46e5;
          font-weight: 700;
          border-bottom: 2px solid #4f46e5;
          background: #f5f3ff;
        }
        .tab-count {
          display: inline-block;
          background: #e5e7eb;
          color: #6b7280;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          margin-left: 5px;
        }
        .tab-btn.active .tab-count {
          background: #ede9fe;
          color: #4f46e5;
        }

        .table-wrap { overflow-x: auto; background: #fff; border-radius: 0 0 10px 10px; }
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
        .link-fbfc {
          color: #4f46e5; font-weight: 700; text-decoration: none;
          font-size: 12px; font-family: monospace; cursor: pointer;
        }
        .link-fbfc:hover { text-decoration: underline; }
        .link-ver { color: #4f46e5; font-weight: 600; text-decoration: none; font-size: 13px; }
        .link-ver:hover { text-decoration: underline; }
        .badge-stale {
          display: inline-block;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          margin-left: 6px;
          white-space: nowrap;
        }
        .empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; background: #fff; border-radius: 0 0 10px 10px; }

        .search-bar {
          padding: 14px 24px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
        }
        .search-wrap {
          position: relative;
          max-width: 420px;
        }
        .search-input {
          width: 100%;
          padding: 9px 36px 9px 36px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #111827;
          background: #f9fafb;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .search-input:focus { border-color: #4f46e5; background: #fff; }
        .search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 15px;
          pointer-events: none;
        }
        .search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: #e5e7eb;
          border: none;
          border-radius: 999px;
          width: 20px;
          height: 20px;
          font-size: 12px;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          line-height: 1;
        }
        .search-clear:hover { background: #d1d5db; color: #111827; }
      `}</style>

      <div>
        {/* Controles de ordenamiento y filtro */}
        <div className="controls-bar">
          <select
            className="ctrl-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Más recientes primero</option>
            <option value="oldest">Más antiguas primero</option>
            <option value="amount_desc">Mayor monto</option>
            <option value="amount_asc">Menor monto</option>
            <option value="package">Por paquete (Basic → Premium)</option>
          </select>
          <select
            className="ctrl-select"
            value={pkgFilter}
            onChange={e => setPkgFilter(e.target.value)}
          >
            <option value="all">Todos los paquetes</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Buscador */}
        <div className="search-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number, client name or email..."
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        {/* Tabs de estado */}
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="tab-count">{countFor(tab.key)}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            {search.trim()
              ? `No orders found matching your search "${search.trim()}"`
              : 'No hay órdenes en este estado.'
            }
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th># Orden</th>
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
                {visible.map(order => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="link-fbfc">
                        {'FBFC-' + order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.firstName} {order.lastName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.email}</div>
                    </td>
                    <td>{order.companyName}</td>
                    <td style={{ textTransform: 'capitalize' }}>{order.package}</td>
                    <td>${(order.amount ?? 0).toFixed(2)}</td>
                    <td><Badge map={PAYMENT_BADGE} value={order.paymentStatus} /></td>
                    <td>
                      <Badge map={STATUS_BADGE} value={order.status} />
                      {isStale(order) && <span className="badge-stale">⚠️ +24h</span>}
                    </td>
                    <td style={{ color: '#9ca3af' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="link-ver">Ver →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
