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
  { key: 'services',       label: 'Servicios' },
  { key: 'addon',          label: 'New Business Letter' },
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

const PKG_ORDER: Record<string, number> = { basic: 0, standard: 1, premium: 2, services: 3, addon: 4 }

const PKG_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  basic:    { label: 'Basic',                bg: '#f3f4f6', color: '#6b7280' },
  standard: { label: 'Standard',            bg: '#dbeafe', color: '#1d4ed8' },
  premium:  { label: 'Premium',             bg: '#ede9fe', color: '#6d28d9' },
  services: { label: 'Servicios',           bg: '#ede9fe', color: '#7c3aed' },
  addon:    { label: 'New Business Letter', bg: '#ffedd5', color: '#c2410c' },
}

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

const TBL = {
  en: {
    all: 'All', nbl: 'New Business Letter', pending: 'Pending', inReview: 'In review',
    namesTaken: 'Names taken', readyToFile: 'Ready to file', filed: 'Filed',
    approved: 'Approved', completed: 'Completed',
    newestFirst: 'Newest first', oldestFirst: 'Oldest first',
    allPackages: 'All packages', from: 'From', to: 'To', clear: 'Clear',
    searchPh: 'Search by order number, client name or email...',
    colOrder: '# Order', colClient: 'Client', colCompany: 'Company',
    colPackage: 'Package', colAmount: 'Amount', colPayment: 'Payment',
    colStatus: 'Status', colDate: 'Date',
    noOrders: 'No orders in the selected date range.',
    noOrdersStatus: 'No orders in this status.',
    view: 'View →',
  },
  es: {
    all: 'Todas', nbl: 'New Business Letter', pending: 'Pending', inReview: 'In review',
    namesTaken: 'Names taken', readyToFile: 'Ready to file', filed: 'Filed',
    approved: 'Approved', completed: 'Completed',
    newestFirst: 'Más recientes primero', oldestFirst: 'Más antiguas primero',
    allPackages: 'Todos los paquetes', from: 'Desde', to: 'Hasta', clear: 'Limpiar',
    searchPh: 'Search by order number, client name or email...',
    colOrder: '# Orden', colClient: 'Cliente', colCompany: 'Empresa',
    colPackage: 'Paquete', colAmount: 'Monto', colPayment: 'Pago',
    colStatus: 'Estado', colDate: 'Fecha',
    noOrders: 'No hay órdenes en el rango de fechas seleccionado.',
    noOrdersStatus: 'No hay órdenes en este estado.',
    view: 'Ver →',
  },
}

export default function OrdersTable({ orders, lang = 'es' }: { orders: Order[]; lang?: string }) {
  const tbl = TBL[lang as 'en' | 'es'] ?? TBL.es
  const [activeTab, setActiveTab] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [pkgFilter, setPkgFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const countFor = (key: string) => {
    if (key === 'all') return orders.length
    if (key === 'addon') return orders.filter(o => o.package === 'addon').length
    if (key === 'services') return orders.filter(o => o.package === 'services').length
    return orders.filter(o => o.status === key).length
  }

  let visible = activeTab === 'all'
    ? [...orders]
    : activeTab === 'addon'
    ? orders.filter(o => o.package === 'addon')
    : activeTab === 'services'
    ? orders.filter(o => o.package === 'services')
    : orders.filter(o => o.status === activeTab)

  if (pkgFilter !== 'all') {
    visible = visible.filter(o => o.package === pkgFilter)
  }

  if (dateFrom) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)
    visible = visible.filter(o => new Date(o.createdAt) >= from)
  }

  if (dateTo) {
    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)
    visible = visible.filter(o => new Date(o.createdAt) <= to)
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    visible = visible.filter(o => {
      const prefix = o.package === 'addon' ? 'FBNB-' : 'FBFC-'
      const fbfc = (prefix + o.id.replace(/-/g, '').substring(0, 8)).toLowerCase()
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

        .table-wrap { overflow-x: auto; background: #fff; border-radius: 0 0 10px 10px; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 12.5px; table-layout: fixed; }
        th {
          background: #f8fafc;
          padding: 10px 10px;
          text-align: left;
          font-size: 10.5px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
        }
        td {
          padding: 10px 10px;
          border-top: 1px solid #f1f5f9;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        col.col-orden   { width: 108px; }
        col.col-cliente { width: 170px; }
        col.col-empresa { width: 160px; }
        col.col-paquete { width: 90px;  }
        col.col-monto   { width: 74px;  }
        col.col-pago    { width: 88px;  }
        col.col-estado  { width: 148px; }
        col.col-fecha   { width: 76px;  }
        col.col-accion  { width: 56px;  }
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

        .date-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .date-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
        }
        .ctrl-date {
          padding: 7px 10px;
          border: 1.5px solid #e5e7eb;
          border-radius: 7px;
          font-size: 13px;
          font-family: inherit;
          color: #374151;
          background: #fff;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .ctrl-date:focus { border-color: #4f46e5; }
        .ctrl-date::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
        .date-clear {
          background: none;
          border: none;
          font-size: 12px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0 2px;
          font-family: inherit;
          line-height: 1;
        }
        .date-clear:hover { color: #374151; }
      `}</style>

      <div>
        {/* Controles de ordenamiento y filtro */}
        <div className="controls-bar">
          <select
            className="ctrl-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">{tbl.newestFirst}</option>
            <option value="oldest">{tbl.oldestFirst}</option>
            <option value="amount_desc">{lang === 'en' ? 'Highest amount' : 'Mayor monto'}</option>
            <option value="amount_asc">{lang === 'en' ? 'Lowest amount' : 'Menor monto'}</option>
            <option value="package">{lang === 'en' ? 'By package' : 'Por paquete (Basic → Premium)'}</option>
          </select>
          <select
            className="ctrl-select"
            value={pkgFilter}
            onChange={e => setPkgFilter(e.target.value)}
          >
            <option value="all">{tbl.allPackages}</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="services">Servicios</option>
            <option value="addon">New Business Letter</option>
          </select>

          <div className="date-group">
            <span className="date-label">{tbl.from}</span>
            <input
              type="date"
              className="ctrl-date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
            />
            {dateFrom && (
              <button className="date-clear" onClick={() => setDateFrom('')} title={tbl.clear}>✕</button>
            )}
            <span className="date-label">{tbl.to}</span>
            <input
              type="date"
              className="ctrl-date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
            />
            {dateTo && (
              <button className="date-clear" onClick={() => setDateTo('')} title={tbl.clear}>✕</button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="search-bar">
          <div className="search-wrap">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
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
              ? `No orders found matching "${search.trim()}"`
              : (dateFrom || dateTo)
              ? tbl.noOrders
              : tbl.noOrdersStatus
            }
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <colgroup>
                <col className="col-orden" />
                <col className="col-cliente" />
                <col className="col-empresa" />
                <col className="col-paquete" />
                <col className="col-monto" />
                <col className="col-pago" />
                <col className="col-estado" />
                <col className="col-fecha" />
                <col className="col-accion" />
              </colgroup>
              <thead>
                <tr>
                  <th>{tbl.colOrder}</th>
                  <th>{tbl.colClient}</th>
                  <th>{tbl.colCompany}</th>
                  <th>{tbl.colPackage}</th>
                  <th>{tbl.colAmount}</th>
                  <th>{tbl.colPayment}</th>
                  <th>{tbl.colStatus}</th>
                  <th>{tbl.colDate}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(order => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="link-fbfc">
                        {(order.package === 'addon' ? 'FBNB-' : 'FBFC-') + order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.firstName} {order.lastName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.email}</div>
                    </td>
                    <td>{order.companyName}</td>
                    <td><Badge map={PKG_LABEL} value={order.package} /></td>
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
                      <Link href={`/admin/orders/${order.id}`} className="link-ver">{tbl.view}</Link>
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
