'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://mybusinessformation-web-production.up.railway.app'

interface Order {
  id: string
  createdAt: string
  updatedAt: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  companyName: string
  companyName2: string
  companyName3: string
  entityType: string
  businessAddress: string
  speed: string
  package: string
  amount: number
  currency: string
  members: unknown
  registeredAgent: string
  addons: unknown
  orgSignature: string
  stripePaymentId: string
  paymentStatus: string
  status: string
  notes: string
}

const STATUS_OPTIONS = ['pending', 'in_review', 'names_taken', 'ready_to_file', 'filed', 'approved', 'completed']

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
    <span style={{ background: b.bg, color: b.color, padding: '3px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600 }}>
      {b.label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>
        {title}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: value ? '#111827' : '#d1d5db' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [notes, setNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [emailLoading, setEmailLoading] = useState<string | null>(null)
  const [emailMsg, setEmailMsg] = useState('')

  // Buscador de nombres alternativos
  const [namesInput, setNamesInput] = useState('')
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkResults, setCheckResults] = useState<{ name: string; available: boolean }[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestMsg, setSuggestMsg] = useState('')

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/orders/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('No encontrada')
        return r.json()
      })
      .then(data => {
        const o = data.order ?? data
        setOrder(o)
        setNotes(o.notes ?? '')
        setSelectedStatus(o.status)
      })
      .catch(() => setError('No se pudo cargar la orden.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selectedStatus, notes }),
    })
    setSaving(false)
    if (res.ok) {
      setSaveMsg('Guardado correctamente.')
      setOrder(prev => prev ? { ...prev, status: selectedStatus, notes } : prev)
    } else {
      setSaveMsg('Error al guardar.')
    }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function triggerEmail(type: 'names-taken' | 'certificate') {
    setEmailLoading(type)
    setEmailMsg('')
    const res = await fetch(`${BACKEND_URL}/api/notifications/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    })
    setEmailLoading(null)
    setEmailMsg(res.ok ? 'Email enviado correctamente.' : 'Error al enviar el email.')
    setTimeout(() => setEmailMsg(''), 4000)
  }

  async function handleCheckNames() {
    const names = namesInput.split('\n').map(n => n.trim()).filter(n => n.length > 0).slice(0, 10)
    if (names.length === 0) return
    setCheckLoading(true)
    setCheckResults([])
    setSuggestMsg('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/names/check?names=${encodeURIComponent(names.join(','))}`)
      const data = await res.json()
      setCheckResults(data.results ?? [])
    } catch {
      setCheckResults([])
    }
    setCheckLoading(false)
  }

  async function handleSuggestNames() {
    const available = checkResults.filter(r => r.available).map(r => r.name)
    if (available.length === 0 || !order) return
    setSuggestLoading(true)
    setSuggestMsg('')
    const res = await fetch(`${BACKEND_URL}/api/notifications/suggest-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, availableNames: available }),
    })
    setSuggestLoading(false)
    setSuggestMsg(res.ok ? 'Email enviado al cliente con los nombres disponibles.' : 'Error al enviar el email.')
    setTimeout(() => setSuggestMsg(''), 5000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6b7280' }}>
      Cargando orden…
    </div>
  )

  if (error || !order) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', gap: '12px' }}>
      <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error || 'Orden no encontrada.'}</div>
      <Link href="/admin" style={{ color: '#4f46e5', fontSize: '14px' }}>← Volver al panel</Link>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }

        .wrapper { max-width: 860px; margin: 0 auto; padding: 32px 24px; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

        textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          color: #111827;
        }
        textarea:focus { border-color: #4f46e5; }

        select {
          padding: 9px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #111827;
          outline: none;
          background: #fff;
          cursor: pointer;
        }
        select:focus { border-color: #4f46e5; }

        .btn {
          padding: 9px 18px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary  { background: #4f46e5; color: #fff; }
        .btn-primary:hover:not(:disabled)  { background: #4338ca; }
        .btn-yellow   { background: #fbbf24; color: #1a1a2e; }
        .btn-yellow:hover:not(:disabled)   { background: #f59e0b; }
        .btn-green    { background: #16a34a; color: #fff; }
        .btn-green:hover:not(:disabled)    { background: #15803d; }

        .save-msg { font-size: 13px; color: #16a34a; font-weight: 600; }
        .email-msg { font-size: 13px; color: #4f46e5; font-weight: 600; }
      `}</style>

      <div className="wrapper">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <Link href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              ← Volver al panel
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginTop: '6px' }}>
              {order.firstName} {order.lastName}
            </h1>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>
              {order.id}
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <Badge map={PAYMENT_BADGE} value={order.paymentStatus} />
            <Badge map={STATUS_BADGE} value={order.status} />
          </div>
        </div>

        {/* Datos del cliente */}
        <Section title="Datos del Cliente">
          <div className="grid-2">
            <Field label="Nombre" value={`${order.firstName} ${order.lastName}`} />
            <Field label="Email" value={order.email} />
            <Field label="Teléfono" value={order.phone} />
            <Field label="País" value={order.country} />
          </div>
        </Section>

        {/* Empresa */}
        <Section title="Empresa">
          <div className="grid-2">
            <Field label="Nombre 1" value={order.companyName} />
            <Field label="Nombre 2" value={order.companyName2} />
            <Field label="Nombre 3" value={order.companyName3} />
            <Field label="Tipo de entidad" value={order.entityType} />
            <Field label="Paquete" value={order.package} />
            <Field label="Monto" value={order.amount ? `$${order.amount.toFixed(2)} ${order.currency}` : undefined} />
            <Field label="Tramitación" value={order.speed} />
            <Field label="Agente Registrado" value={order.registeredAgent} />
            <Field label="Dirección comercial" value={order.businessAddress} />
          </div>
        </Section>

        {/* Estado y pago */}
        <Section title="Estado y Pago">
          <div className="grid-2">
            <Field label="Estado de la orden" value={order.status} />
            <Field label="Estado del pago" value={order.paymentStatus} />
            <Field label="Stripe Payment ID" value={order.stripePaymentId} />
            <Field label="Fecha de creación" value={new Date(order.createdAt).toLocaleString('en-US')} />
          </div>
        </Section>

        {/* Buscador de nombres alternativos — solo visible cuando status === names_taken */}
        {order.status === 'names_taken' && (
          <Section title="🔍 Buscador de Nombres Alternativos">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px', lineHeight: 1.6 }}>
              Escribe hasta 10 nombres (uno por línea). El sistema verificará cuáles están disponibles
              en la base de datos de Sunbiz.
            </p>
            <textarea
              rows={6}
              value={namesInput}
              onChange={e => {
                const lines = e.target.value.split('\n')
                if (lines.length <= 10) setNamesInput(e.target.value)
              }}
              placeholder={`Sunshine Digital Solutions LLC\nCoastal Ventures Group LLC\nMiami Tech Hub Inc\n...`}
            />
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleCheckNames} disabled={checkLoading || namesInput.trim() === ''}>
                {checkLoading ? 'Verificando…' : 'Verificar disponibilidad'}
              </button>
            </div>

            {checkResults.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>
                  Resultados
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  {checkResults.map(r => (
                    <li key={r.name} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 14px', borderRadius: '8px', marginBottom: '6px',
                      background: r.available ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${r.available ? '#86efac' : '#fecaca'}`,
                      fontSize: '14px', fontWeight: 500,
                      color: r.available ? '#166534' : '#b91c1c',
                    }}>
                      <span style={{ fontSize: '16px' }}>{r.available ? '✅' : '❌'}</span>
                      <span>{r.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600 }}>
                        {r.available ? 'Disponible' : 'Tomado'}
                      </span>
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-green"
                    onClick={handleSuggestNames}
                    disabled={suggestLoading || checkResults.filter(r => r.available).length === 0}
                  >
                    {suggestLoading ? 'Enviando…' : `✉️ Enviar sugerencias al cliente (${checkResults.filter(r => r.available).length} disponibles)`}
                  </button>
                  {suggestMsg && (
                    <span style={{ fontSize: '13px', color: suggestMsg.startsWith('Error') ? '#b91c1c' : '#16a34a', fontWeight: 600 }}>
                      {suggestMsg}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Acciones */}
        <Section title="Acciones">
          {/* Cambiar estado */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
              Cambiar Estado
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>
          </div>

          {/* Emails */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
              Enviar Emails
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-yellow"
                onClick={() => triggerEmail('names-taken')}
                disabled={emailLoading !== null}
              >
                {emailLoading === 'names-taken' ? 'Enviando…' : '⚠️ Nombres Tomados'}
              </button>
              <button
                className="btn btn-green"
                onClick={() => triggerEmail('certificate')}
                disabled={emailLoading !== null}
              >
                {emailLoading === 'certificate' ? 'Enviando…' : '🎉 Enviar Certificate'}
              </button>
              {emailMsg && <span className="email-msg">{emailMsg}</span>}
            </div>
          </div>
        </Section>

        {/* Notas internas */}
        <Section title="Notas Internas">
          <textarea
            rows={5}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Escribe notas internas sobre esta orden…"
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar notas'}
            </button>
            {saveMsg && <span className="save-msg">{saveMsg}</span>}
          </div>
        </Section>
      </div>
    </>
  )
}
