'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const PROXY = '/api/proxy'

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

const PACKAGE_INFO: Record<string, { name: string; price: string; popular?: boolean }> = {
  basic:    { name: 'Basic',    price: '$49 + state fee' },
  standard: { name: 'Standard', price: '$149 + state fee', popular: true },
  premium:  { name: 'Premium',  price: '$249 + state fee' },
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Notas internas (Func 6)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesMsg, setNotesMsg] = useState('')

  // Cambio manual de estado (selector)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [manualMsg, setManualMsg] = useState('')

  // Emails manuales
  const [emailLoading, setEmailLoading] = useState<string | null>(null)
  const [emailMsg, setEmailMsg] = useState('')

  // Buscador de nombres (Func 2)
  const [namesInput, setNamesInput] = useState('')
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkResults, setCheckResults] = useState<{ name: string; available: boolean }[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestMsg, setSuggestMsg] = useState('')

  // Subida de Certificate (Func 4)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certMsg, setCertMsg] = useState('')

  // Botones de avance de estado (Func 5)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    fetch(`${PROXY}/orders/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('No encontrada')
        return r.json()
      })
      .then(data => {
        const o = data.order ?? data.data ?? data
        setOrder(o)
        setNotes(o.notes ?? '')
        setSelectedStatus(o.status)
      })
      .catch(() => setError('No se pudo cargar la orden.'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Guardar notas (Func 6) ───────────────────────────────────────────────
  async function handleSaveNotes() {
    setNotesSaving(true)
    setNotesMsg('')
    const res = await fetch(`${PROXY}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setNotesSaving(false)
    setNotesMsg(res.ok ? 'Nota guardada.' : 'Error al guardar.')
    if (res.ok) setOrder(prev => prev ? { ...prev, notes } : prev)
    setTimeout(() => setNotesMsg(''), 3000)
  }

  // ── Cambio manual de estado (selector) ──────────────────────────────────
  async function handleManualStatusSave() {
    setManualSaving(true)
    setManualMsg('')
    const res = await fetch(`${PROXY}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selectedStatus }),
    })
    setManualSaving(false)
    if (res.ok) {
      setManualMsg('Estado actualizado.')
      setOrder(prev => prev ? { ...prev, status: selectedStatus } : prev)
    } else {
      setManualMsg('Error al actualizar.')
    }
    setTimeout(() => setManualMsg(''), 3000)
  }

  // ── Emails manuales ───────────────────────────────────────────────────────
  async function triggerEmail(type: 'names-taken' | 'certificate') {
    setEmailLoading(type)
    setEmailMsg('')
    const res = await fetch(`${PROXY}/notifications/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    })
    setEmailLoading(null)
    setEmailMsg(res.ok ? 'Email enviado correctamente.' : 'Error al enviar el email.')
    setTimeout(() => setEmailMsg(''), 4000)
  }

  // ── Buscador de nombres (Func 2) ─────────────────────────────────────────
  async function handleCheckNames() {
    const names = namesInput.split('\n').map(n => n.trim()).filter(n => n.length > 0).slice(0, 10)
    if (names.length === 0) return
    setCheckLoading(true)
    setCheckResults([])
    setSuggestMsg('')
    try {
      const res = await fetch(`${PROXY}/names/check?names=${encodeURIComponent(names.join(','))}`)
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
    const res = await fetch(`${PROXY}/notifications/suggest-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, availableNames: available }),
    })
    setSuggestLoading(false)
    setSuggestMsg(res.ok ? 'Email enviado al cliente con los nombres disponibles.' : 'Error al enviar el email.')
    setTimeout(() => setSuggestMsg(''), 5000)
  }

  // ── Subida de Certificate PDF (Func 4) ───────────────────────────────────
  async function handleUploadCertificate() {
    if (!certFile || !order) return
    setCertLoading(true)
    setCertMsg('')
    const formData = new FormData()
    formData.append('file', certFile)
    formData.append('orderId', order.id)
    const res = await fetch('/api/admin/upload-certificate', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setCertLoading(false)
    if (res.ok) {
      setCertMsg('✅ Certificate subido y enviado al cliente. Orden marcada como completed.')
      setOrder(prev => prev ? { ...prev, status: 'completed' } : prev)
      setSelectedStatus('completed')
      setCertFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      setCertMsg(`Error: ${data.error ?? 'No se pudo completar la operación.'}`)
    }
    setTimeout(() => setCertMsg(''), 6000)
  }

  // ── Avance de estado (Func 5) ────────────────────────────────────────────
  async function advanceStatus(newStatus: string) {
    setStatusLoading(true)
    setStatusMsg('')
    const res = await fetch(`${PROXY}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setStatusLoading(false)
    if (res.ok) {
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev)
      setSelectedStatus(newStatus)
      setStatusMsg(`Estado actualizado a "${newStatus}".`)
    } else {
      setStatusMsg('Error al actualizar el estado.')
    }
    setTimeout(() => setStatusMsg(''), 4000)
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

  const availableCount = checkResults.filter(r => r.available).length

  const isStale = order.updatedAt
    && order.status !== 'completed'
    && order.status !== 'approved'
    && Date.now() - new Date(order.updatedAt).getTime() > 24 * 60 * 60 * 1000

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
        .wrapper { max-width: 860px; margin: 0 auto; padding: 32px 24px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

        textarea {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; font-family: inherit; resize: vertical;
          outline: none; color: #111827;
        }
        textarea:focus { border-color: #4f46e5; }

        select {
          padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; font-family: inherit; color: #111827;
          outline: none; background: #fff; cursor: pointer;
        }
        select:focus { border-color: #4f46e5; }

        input[type="file"] {
          width: 100%; padding: 10px 14px;
          border: 1.5px dashed #d1d5db; border-radius: 8px;
          font-size: 14px; font-family: inherit; color: #6b7280;
          background: #f9fafb; cursor: pointer; outline: none;
        }
        input[type="file"]:hover { border-color: #4f46e5; background: #f5f3ff; }

        .btn {
          padding: 9px 18px; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: opacity 0.15s; font-family: inherit;
        }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-primary { background: #4f46e5; color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #4338ca; }
        .btn-yellow  { background: #fbbf24; color: #1a1a2e; }
        .btn-yellow:hover:not(:disabled)  { background: #f59e0b; }
        .btn-green   { background: #16a34a; color: #fff; }
        .btn-green:hover:not(:disabled)   { background: #15803d; }
        .btn-blue    { background: #1d4ed8; color: #fff; }
        .btn-blue:hover:not(:disabled)    { background: #1e40af; }
        .btn-red     { background: #b91c1c; color: #fff; }
        .btn-red:hover:not(:disabled)     { background: #991b1b; }
        .btn-purple  { background: #6d28d9; color: #fff; }
        .btn-purple:hover:not(:disabled)  { background: #5b21b6; }

        .msg-ok  { font-size: 13px; color: #16a34a; font-weight: 600; }
        .msg-err { font-size: 13px; color: #b91c1c; font-weight: 600; }
        .msg-inf { font-size: 13px; color: #4f46e5; font-weight: 600; }

        .sublabel {
          font-size: 11px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px;
        }
      `}</style>

      <div className="wrapper">
        {/* Alerta de inactividad +24h */}
        {isStale && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '12px 20px', marginBottom: '20px',
            fontSize: '13px', fontWeight: 600, color: '#b91c1c',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ⚠️ This order has not been updated in more than 24 hours.
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <Link href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              ← Volver al panel
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginTop: '6px' }}>
              {order.firstName} {order.lastName}
            </h1>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5', marginTop: '4px', fontFamily: 'monospace' }}>
              {'FBFC-' + order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px', fontFamily: 'monospace' }}>
              {order.id}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
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
          </div>
        </Section>

        {/* Paquete y Pago */}
        <Section title="Paquete y Pago">
          {(() => {
            const pkgKey = (order.package ?? '').toLowerCase()
            const pkgInfo = PACKAGE_INFO[pkgKey]
            const services = PACKAGE_SERVICES[pkgKey] ?? []
            let addons: Record<string, unknown> = {}
            try { addons = JSON.parse(order.addons as string) } catch { /* noop */ }
            if (order.addons && typeof order.addons === 'object' && !Array.isArray(order.addons)) {
              addons = order.addons as Record<string, unknown>
            }
            const addonItems = [
              { key: 'ein',  label: 'EIN / Tax ID' },
              { key: 'oa',   label: 'Operating Agreement' },
              { key: 'itin', label: 'ITIN Application' },
              { key: 'ar',   label: 'Annual Report Filing' },
            ]
            const activeAddons = addonItems.filter(a => addons[a.key])
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>
                    {pkgInfo?.name ?? order.package}
                  </span>
                  {pkgInfo?.popular && (
                    <span style={{ background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>Most Popular</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600, marginBottom: '16px' }}>{pkgInfo?.price}</div>

                {order.speed === 'expedited' && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                    ⚡ Priority Processing (1–3 days)
                  </div>
                )}

                {services.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Services Included</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {services.map(s => (
                        <li key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                          {s}
                          {s === 'Expedited Filing (1–3 days)' && order.speed === 'expedited' && (
                            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>ACTIVE</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeAddons.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Add-ons</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activeAddons.map(a => (
                        <li key={a.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                          <span style={{ color: '#6d28d9', fontWeight: 700 }}>✓</span> {a.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid-2" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <Field label="Monto total" value={order.amount ? `$${order.amount.toFixed(2)} ${order.currency ?? 'USD'}` : undefined} />
                  <Field label="Tramitación" value={order.speed} />
                  <Field label="Estado del pago" value={order.paymentStatus} />
                  <Field label="Stripe Payment ID" value={order.stripePaymentId} />
                </div>
              </>
            )
          })()}
        </Section>

        {/* Agente Registrado */}
        <Section title="Agente Registrado">
          <div className="grid-2">
            <Field
              label="Agente"
              value={
                order.registeredAgent === 'us' ? 'Nuestro servicio (incluido)' :
                order.registeredAgent === 'own' ? 'Agente propio' :
                order.registeredAgent
              }
            />
            <Field label="Dirección comercial" value={order.businessAddress} />
          </div>
        </Section>

        {/* Miembros / Organizers */}
        {(() => {
          let members: Array<{
            type?: string
            firstName?: string
            lastName?: string
            title?: string
            ownership?: number
            useCompanyAddress?: boolean
            address?: string
          }> = []
          try { members = JSON.parse(order.members as string) } catch { /* noop */ }
          if (!Array.isArray(members) && order.members && typeof order.members === 'object') {
            members = order.members as typeof members
          }
          return Array.isArray(members) && members.length > 0 ? (
            <Section title="Miembros / Organizers">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {members.map((m, i) => (
                  <div key={i} style={{
                    background: '#f8fafc', border: '1px solid #e5e7eb',
                    borderRadius: '8px', padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>
                      {m.type === 'organizer' ? 'Organizer' : 'Member'} #{i + 1}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Field label="Nombre" value={`${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || undefined} />
                      <Field label="Título" value={m.title} />
                      {m.ownership != null && (
                        <Field label="% de propiedad" value={`${m.ownership}%`} />
                      )}
                      <Field
                        label="Dirección"
                        value={m.useCompanyAddress ? 'Usa dirección de la empresa' : m.address}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null
        })()}

        {/* Add-ons */}
        {(() => {
          let addons: Record<string, unknown> = {}
          try { addons = JSON.parse(order.addons as string) } catch { /* noop */ }
          if (order.addons && typeof order.addons === 'object' && !Array.isArray(order.addons)) {
            addons = order.addons as Record<string, unknown>
          }
          const addonList: { key: string; label: string }[] = [
            { key: 'ein',  label: 'EIN / Tax ID' },
            { key: 'oa',   label: 'Operating Agreement' },
            { key: 'itin', label: 'ITIN Application' },
            { key: 'ar',   label: 'Annual Report' },
          ]
          return (
            <Section title="Add-ons">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: addons.raInfo ? '16px' : '0' }}>
                {addonList.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{addons[key] ? '✅' : '—'}</span>
                    <span style={{ fontSize: '14px', color: addons[key] ? '#111827' : '#9ca3af', fontWeight: addons[key] ? 600 : 400 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              {typeof addons.raInfo === 'string' && addons.raInfo && (
                <div style={{ marginTop: '14px' }}>
                  <Field label="Info RA / ITIN" value={addons.raInfo} />
                </div>
              )}
            </Section>
          )
        })()}

        {/* Firma */}
        {order.orgSignature && (
          <Section title="Firma">
            <Field label="Firma del Organizador" value={order.orgSignature} />
          </Section>
        )}

        {/* Estado y pago */}
        <Section title="Estado y Pago">
          <div className="grid-2">
            <Field label="Estado de la orden" value={order.status} />
            <Field label="Fecha de creación" value={new Date(order.createdAt).toLocaleString('en-US')} />
            <Field label="Última actualización" value={order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-US') : undefined} />
          </div>
        </Section>

        {/* ── Pre-filled Documents ─────────────────────────────────────────── */}
        {(() => {
          let addons: Record<string, unknown> = {}
          try { addons = JSON.parse(order.addons as string) } catch { /* noop */ }
          if (order.addons && typeof order.addons === 'object' && !Array.isArray(order.addons)) {
            addons = order.addons as Record<string, unknown>
          }
          const pkg = (order.package ?? '').toLowerCase()
          const isStandard = pkg === 'standard' || pkg === 'premium'
          const isPremium = pkg === 'premium'

          const docs: { label: string; endpoint: string; color: string }[] = []

          // Todos los paquetes
          docs.push({ label: 'Articles of Organization', endpoint: 'articles-of-organization', color: '#4f46e5' })
          docs.push({ label: 'BOI Filing (FinCEN)', endpoint: 'boi-filing', color: '#0f766e' })

          // Standard y Premium
          if (isStandard) {
            docs.push({ label: 'EIN SS-4 (IRS)', endpoint: 'ein-ss4', color: '#1d4ed8' })
            docs.push({ label: 'Operating Agreement', endpoint: 'operating-agreement', color: '#7c3aed' })
          } else {
            // Basic con add-ons
            if (addons.ein) docs.push({ label: 'EIN SS-4 (IRS)', endpoint: 'ein-ss4', color: '#1d4ed8' })
            if (addons.oa)  docs.push({ label: 'Operating Agreement', endpoint: 'operating-agreement', color: '#7c3aed' })
          }

          // Solo Premium
          if (isPremium) {
            docs.push({ label: 'DBA / Fictitious Name', endpoint: 'dba', color: '#b45309' })
          }

          return (
            <Section title="📥 Pre-filled Documents">
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
                Documents pre-filled with client data. Download, review, and submit to the appropriate agency.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {docs.map(({ label, endpoint, color }) => {
                  const baseUrl = `${PROXY}/documents/${order.id}/${endpoint}`
                  return (
                    <div
                      key={endpoint}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 16px', borderRadius: '8px',
                        background: '#f8fafc', border: '1.5px solid #e5e7eb',
                      }}
                    >
                      <span style={{ color: color, fontWeight: 600, fontSize: '14px' }}>
                        📄 {label}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={`${baseUrl}?view=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '12px', background: '#f1f5f9', color: color,
                            border: `1.5px solid ${color}`, padding: '4px 12px',
                            borderRadius: '999px', textDecoration: 'none', fontWeight: 600,
                          }}
                        >
                          👁 Ver PDF
                        </a>
                        <a
                          href={baseUrl}
                          download
                          style={{
                            fontSize: '12px', background: color, color: '#fff',
                            padding: '4px 12px', borderRadius: '999px',
                            textDecoration: 'none', fontWeight: 600,
                          }}
                        >
                          ↓ Descargar
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )
        })()}

        {/* ── FUNC 5 — Gestión de Estado ─────────────────────────────────── */}
        <Section title="⚡ Gestión de Estado">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Estado actual:</span>
            <Badge map={STATUS_BADGE} value={order.status} />
          </div>

          <div className="sublabel">Avanzar al siguiente estado</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

            {order.status === 'pending' && (
              <button
                className="btn btn-primary"
                onClick={() => advanceStatus('in_review')}
                disabled={statusLoading || order.paymentStatus !== 'paid'}
                title={order.paymentStatus !== 'paid' ? 'Requiere pago confirmado' : ''}
              >
                → In review
                {order.paymentStatus !== 'paid' && <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.7 }}>(requiere pago)</span>}
              </button>
            )}

            {order.status === 'in_review' && (
              <>
                <button className="btn btn-purple" onClick={() => advanceStatus('ready_to_file')} disabled={statusLoading}>
                  ✓ Nombre disponible → Ready to file
                </button>
                <button className="btn btn-red" onClick={() => advanceStatus('names_taken')} disabled={statusLoading}>
                  ✗ Nombres tomados → Names taken
                </button>
              </>
            )}

            {order.status === 'names_taken' && (
              <button className="btn btn-primary" onClick={() => advanceStatus('in_review')} disabled={statusLoading}>
                ↩ Cliente respondió → In review
              </button>
            )}

            {order.status === 'ready_to_file' && (
              <button className="btn btn-blue" onClick={() => advanceStatus('filed')} disabled={statusLoading}>
                → Filed (enviado al Estado de Florida)
              </button>
            )}

            {order.status === 'filed' && (
              <button className="btn btn-green" onClick={() => advanceStatus('approved')} disabled={statusLoading}>
                → Approved (Florida aprobó)
              </button>
            )}

            {order.status === 'approved' && (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Sube el Certificate PDF abajo para marcar como completed.
              </span>
            )}

            {order.status === 'completed' && (
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                ✅ Orden cerrada — Certificate entregado al cliente.
              </span>
            )}

            {statusLoading && <span style={{ fontSize: '13px', color: '#6b7280' }}>Actualizando…</span>}
            {statusMsg && (
              <span className={statusMsg.startsWith('Error') ? 'msg-err' : 'msg-ok'}>{statusMsg}</span>
            )}
          </div>
        </Section>

        {/* ── FUNC 2 — Buscador de nombres (solo cuando names_taken) ─────── */}
        {order.status === 'names_taken' && (
          <Section title="🔍 Buscador de Nombres Alternativos">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px', lineHeight: 1.6 }}>
              Escribe hasta 10 nombres (uno por línea). El sistema verificará cuáles están disponibles en Sunbiz.
            </p>
            <textarea
              rows={6}
              value={namesInput}
              onChange={e => {
                if (e.target.value.split('\n').length <= 10) setNamesInput(e.target.value)
              }}
              placeholder={'Sunshine Digital Solutions LLC\nCoastal Ventures Group LLC\nMiami Tech Hub Inc\n...'}
            />
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleCheckNames} disabled={checkLoading || namesInput.trim() === ''}>
                {checkLoading ? 'Verificando…' : 'Verificar disponibilidad'}
              </button>
            </div>

            {checkResults.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div className="sublabel">Resultados</div>
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
                    disabled={suggestLoading || availableCount === 0}
                  >
                    {suggestLoading ? 'Enviando…' : `✉️ Enviar sugerencias al cliente (${availableCount} disponibles)`}
                  </button>
                  {suggestMsg && (
                    <span className={suggestMsg.startsWith('Error') ? 'msg-err' : 'msg-ok'}>{suggestMsg}</span>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── FUNC 4 — Subida de Certificate PDF (solo cuando approved) ───── */}
        {order.status === 'approved' && (
          <Section title="📄 Certificate of Formation">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
              Sube el PDF aprobado por el Estado de Florida. Al subir, el sistema lo guardará en Supabase Storage,
              enviará el email al cliente y marcará la orden como <strong>completed</strong> automáticamente.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={e => setCertFile(e.target.files?.[0] ?? null)}
            />
            {certFile && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#4f46e5', fontWeight: 500 }}>
                Archivo seleccionado: {certFile.name} ({(certFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-green"
                onClick={handleUploadCertificate}
                disabled={!certFile || certLoading}
              >
                {certLoading ? 'Subiendo y enviando…' : '🚀 Subir y enviar al cliente'}
              </button>
              {certMsg && (
                <span className={certMsg.startsWith('Error') ? 'msg-err' : 'msg-ok'}>{certMsg}</span>
              )}
            </div>
          </Section>
        )}

        {/* ── Acciones manuales ─────────────────────────────────────────────── */}
        <Section title="Acciones Manuales">
          <div style={{ marginBottom: '24px' }}>
            <div className="sublabel">Cambiar Estado (forzar)</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleManualStatusSave} disabled={manualSaving}>
                {manualSaving ? 'Guardando…' : 'Guardar'}
              </button>
              {manualMsg && <span className="msg-ok">{manualMsg}</span>}
            </div>
          </div>

          <div>
            <div className="sublabel">Enviar Emails</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-yellow" onClick={() => triggerEmail('names-taken')} disabled={emailLoading !== null}>
                {emailLoading === 'names-taken' ? 'Enviando…' : '⚠️ Email: Nombres Tomados'}
              </button>
              <button className="btn btn-green" onClick={() => triggerEmail('certificate')} disabled={emailLoading !== null}>
                {emailLoading === 'certificate' ? 'Enviando…' : '🎉 Email: Certificate'}
              </button>
              {emailMsg && <span className="msg-inf">{emailMsg}</span>}
            </div>
          </div>
        </Section>

        {/* ── FUNC 6 — Notas Internas ──────────────────────────────────────── */}
        <Section title="📝 Notas Internas">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
            Solo visibles para el equipo. No se muestran al cliente.
          </p>
          <textarea
            rows={5}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Escribe notas internas sobre esta orden…"
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleSaveNotes} disabled={notesSaving}>
              {notesSaving ? 'Guardando…' : 'Guardar nota'}
            </button>
            {notesMsg && <span className="msg-ok">{notesMsg}</span>}
          </div>
        </Section>
      </div>
    </>
  )
}
