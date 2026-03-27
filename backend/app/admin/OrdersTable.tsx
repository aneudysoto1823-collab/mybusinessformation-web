'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface Order {
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

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState('all')

  const countFor = (key: string) =>
    key === 'all' ? orders.length : orders.filter(o => o.status === key).length

  const visible = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  return (
    <>
      <style>{`
        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 0;
          padding: 16px 24px 0;
          background: #fff;
          border-radius: 10px 10px 0 0;
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
        .link-ver { color: #4f46e5; font-weight: 600; text-decoration: none; font-size: 13px; }
        .link-ver:hover { text-decoration: underline; }
        .empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; background: #fff; border-radius: 0 0 10px 10px; }
      `}</style>

      <div>
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
          <div className="empty">No hay órdenes en este estado.</div>
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
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>
                      {'FBFC-' + order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.firstName} {order.lastName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.email}</div>
                    </td>
                    <td>{order.companyName}</td>
                    <td style={{ textTransform: 'capitalize' }}>{order.package}</td>
                    <td>${(order.amount ?? 0).toFixed(2)}</td>
                    <td><Badge map={PAYMENT_BADGE} value={order.paymentStatus} /></td>
                    <td><Badge map={STATUS_BADGE} value={order.status} /></td>
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
