'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ServicesFilingForm from './ServicesFilingForm'
import { getOrderItemKeys, getOrderItemLabel } from '@/lib/order-items'

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
  orderProcessedEmailSentAt?: string | null
  deliveredItems?: Record<string, boolean> | null
  deliveredFiles?: { url: string; filename: string; uploadedAt: string }[] | null
  nameCheck?: {
    available?: boolean
    exactCount?: number
    example?: string
    similarCount?: number
    normalized?: string
    checkedAt?: string
    error?: string
  } | null
}

const STATUS_OPTIONS = ['pending', 'in_review', 'names_taken', 'ready_to_file', 'filed', 'approved', 'completed']

const PACKAGE_INFO: Record<string, { name: string; price: string; popular?: boolean }> = {
  basic:    { name: 'Basic',                price: '$0 + state fee' },
  standard: { name: 'Standard',            price: '$199 + state fee', popular: true },
  premium:  { name: 'Premium',             price: '$299 + state fee' },
  addon:    { name: 'New Business Letter',  price: 'Variable' },
}

const PACKAGE_SERVICES: Record<string, string[]> = {
  basic: [
    'Business Formation Filing',
    'Name Availability Search',
    'Articles of Organization / Incorporation',
  ],
  standard: [
    'Business Formation Filing',
    'Name Availability Search',
    'Articles of Organization / Incorporation',
    'EIN / Tax ID Number',
    'Bank Account Guide',
    'Registered Agent (1st year free)',
  ],
  premium: [
    'Business Formation Filing',
    'Name Availability Search',
    'Articles of Organization / Incorporation',
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
  disputed: { label: 'En disputa', bg: '#fecdd3', color: '#9f1239' },
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

  // Enviar documento(s) al cliente — unifica lo que antes era Approved+Certificate (Func 4)
  const [deliveryChecked, setDeliveryChecked] = useState<Record<string, boolean>>({})
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([])
  const [sendWithoutFile, setSendWithoutFile] = useState(false)
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

  // Refresca solo el objeto "order" (paymentStatus, status, etc.) cada 20s
  // para que un cambio disparado por webhook (ej. un reembolso o chargeback)
  // aparezca solo, sin recargar la página. No toca notes/selectedStatus para
  // no pisar una edición en curso del admin.
  useEffect(() => {
    const poll = () => {
      fetch(`${PROXY}/orders/${id}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return
          const o = data.order ?? data.data ?? data
          setOrder(o)
        })
        .catch(() => {})
    }
    const intervalId = setInterval(poll, 20000)
    return () => clearInterval(intervalId)
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
  async function triggerEmail(type: 'names-taken' | 'order-confirmation') {
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

  // ── Enviar documento(s) al cliente (Func 4) ──────────────────────────────
  // Ítems disponibles para marcar: formación + addons en true, menos los que
  // ya se entregaron en una ronda anterior (order.deliveredItems).
  function pendingDeliveryItems(): string[] {
    if (!order) return []
    const delivered = order.deliveredItems ?? {}
    const all = getOrderItemKeys(order.package, order.addons)
    return all.filter(k => !delivered[k])
  }

  async function handleSendApprovalUpdate() {
    if (!order) return
    const itemsToSend = Object.keys(deliveryChecked).filter(k => deliveryChecked[k])
    if (itemsToSend.length === 0) return
    const hasFiles = deliveryFiles.length > 0
    if (!hasFiles && !sendWithoutFile) return
    if (!hasFiles && sendWithoutFile) {
      const ok = window.confirm('¿Estás seguro que quieres enviar sin adjuntar archivo?')
      if (!ok) return
    }
    setCertLoading(true)
    setCertMsg('')
    const formData = new FormData()
    formData.append('orderId', order.id)
    formData.append('approvedItems', JSON.stringify(itemsToSend))
    formData.append('sendWithoutFile', String(sendWithoutFile))
    deliveryFiles.forEach(f => formData.append('files', f))
    const res = await fetch('/api/admin/send-approval-update', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setCertLoading(false)
    if (res.ok) {
      setCertMsg(data.pendingItems?.length ? '✅ Enviado. Todavía quedan ítems pendientes.' : '✅ Enviado. Orden marcada como completed.')
      setOrder(prev => prev
        ? { ...prev, status: data.status, deliveredItems: { ...(prev.deliveredItems ?? {}), ...Object.fromEntries(itemsToSend.map(k => [k, true])) } }
        : prev)
      setSelectedStatus(data.status)
      setDeliveryChecked({})
      setDeliveryFiles([])
      setSendWithoutFile(false)
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

      // "approved" ya NO dispara email (2026-07-09) — es puramente interno.
      // El aviso al cliente se maneja aparte con "Enviar documento(s) al
      // cliente" (checklist + archivos), ver handleSendApprovalUpdate.
      const notifMap: Record<string, string> = {
        filed: 'order-processed',
      }
      if (notifMap[newStatus]) {
        fetch(`${PROXY}/notifications/${notifMap[newStatus]}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }).catch(() => { /* notificación no bloquea el flujo */ })
      }
    } else {
      setStatusMsg('Error al actualizar el estado.')
    }
    setTimeout(() => setStatusMsg(''), 4000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#6b7280' }}>
      Cargando orden…
    </div>
  )

  if (error || !order) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', gap: '12px' }}>
      <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error || 'Orden no encontrada.'}</div>
      <Link href="/admin" style={{ color: '#4f46e5', fontSize: '14px' }}>← Volver al panel</Link>
    </div>
  )

  const availableCount = checkResults.filter(r => r.available).length

  // Date.now() en render es intencional: queremos saber si la orden está "stale"
  // en este momento de la sesión del admin. No hay autorefresh, así que el valor
  // se calcula una vez por render manual.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now()
  const isStale = order.updatedAt
    && order.status !== 'completed'
    && order.status !== 'approved'
    && nowMs - new Date(order.updatedAt).getTime() > 24 * 60 * 60 * 1000

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: var(--font-sans); }
        .wrapper { max-width: 860px; margin: 0 auto; padding: 32px 24px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
        .col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .col-2 { grid-template-columns: 1fr; } }

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

        @media (max-width: 768px) {
          .wrapper { padding: 20px 14px; }
          .btn { padding: 10px 16px; }
          h1 { font-size: 17px !important; }
          textarea { font-size: 16px; }
          select { font-size: 16px; }
          input[type="file"] { font-size: 16px; }
        }
        @media (max-width: 480px) {
          .wrapper { padding: 16px 12px; }
          .btn { min-height: 44px; }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <Link href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              ← Volver al panel
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginTop: '6px' }}>
              {order.firstName} {order.lastName}
            </h1>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5', marginTop: '4px', fontFamily: 'monospace' }}>
              {(order.package === 'addon' ? 'FBNB-' : 'FBFC-') + order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}
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
          {/* Chequeo automático Sunbiz (Order.nameCheck JSONB). Ver doc 29. */}
          {(() => {
            const nc = order.nameCheck
            if (!nc || nc.error) {
              return (
                <div style={{marginTop:'14px',padding:'12px 14px',background:'#fef3c7',borderRadius:'8px',borderLeft:'3px solid #f59e0b',fontSize:'13px',color:'#92400e',lineHeight:1.5}}>
                  ℹ️ <strong>Chequeo Sunbiz no disponible</strong> — verificar manualmente.{nc?.error ? ` (Motivo: ${nc.error})` : ''}
                </div>
              )
            }
            if (nc.available === false) {
              return (
                <div style={{marginTop:'14px',padding:'12px 14px',background:'#fef2f2',borderRadius:'8px',borderLeft:'3px solid #dc2626',fontSize:'13px',color:'#991b1b',lineHeight:1.5}}>
                  ⚠️ <strong>NOMBRE POSIBLEMENTE TOMADO</strong> en Florida — coincide con: <strong>{nc.example ?? '(sin ejemplo)'}</strong> ({nc.similarCount ?? 0} similares en FTS5). Revisar antes de presentar.
                  {nc.normalized && <div style={{fontSize:'11px',color:'#9b1c1c',marginTop:'4px',fontFamily:'monospace'}}>normalizado: {nc.normalized}</div>}
                </div>
              )
            }
            return (
              <div style={{marginTop:'14px',padding:'12px 14px',background:'#ecfdf5',borderRadius:'8px',borderLeft:'3px solid #10b981',fontSize:'13px',color:'#065f46',lineHeight:1.5}}>
                ✓ <strong>Sin conflictos exactos detectados en Sunbiz</strong> (chequeo automático contra 3.9M LLC/Corp activas).
                {nc.similarCount && nc.similarCount > 0 ? <div style={{fontSize:'12px',marginTop:'4px',color:'#047857'}}>{nc.similarCount} nombres similares existen (info, no bloquea).</div> : null}
                {nc.normalized && <div style={{fontSize:'11px',color:'#047857',marginTop:'4px',fontFamily:'monospace'}}>normalizado: {nc.normalized}</div>}
              </div>
            )
          })()}
        </Section>

        {/* Paquete y Pago */}
        <Section title="Paquete y Pago">
          {(() => {
            const pkgKey = (order.package ?? '').toLowerCase()
            const pkgInfo = PACKAGE_INFO[pkgKey]
            const isAddon = pkgKey === 'addon'

            if (isAddon) {
              const services = parseAddonServices(order.addons)
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>New Business Letter</span>
                    <span style={{ background: '#ffedd5', color: '#c2410c', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>New Business</span>
                  </div>
                  {services.length > 0 && (
                    <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Servicios adquiridos</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {services.map(s => (
                          <li key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                            <span style={{ color: '#c2410c', fontWeight: 700 }}>✓</span>
                            {ADDON_SERVICE_LABELS[s] ?? s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid-2" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <Field label="Monto total" value={order.amount ? `$${order.amount.toFixed(2)} ${order.currency ?? 'USD'}` : undefined} />
                    <Field label="Estado del pago" value={order.paymentStatus} />
                    <Field label="Stripe Payment ID" value={order.stripePaymentId} />
                  </div>
                </>
              )
            }

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
                    <div className="col-2">
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
              <div className="col-2" style={{ marginBottom: addons.raInfo ? '16px' : '0' }}>
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

        {/* ── Formulario autollenado de Servicios (à la carte) ─────────────── */}
        {(order.package ?? '').toLowerCase() === 'services' && (
          <Section title="🧾 Formulario de servicios (autollenado desde Sunbiz)">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
              Datos de la empresa autollenados desde Sunbiz (Turso) con el número de registro del cliente,
              + los datos que el cliente aportó por cada servicio. Editable e imprimible para hacer los trámites.
            </p>
            <ServicesFilingForm
              orderId={order.id}
              addons={order.addons}
              firstName={order.firstName}
              lastName={order.lastName}
              email={order.email}
              phone={order.phone}
              companyName={order.companyName}
              entityType={order.entityType}
            />
          </Section>
        )}

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
                {order.orderProcessedEmailSentAt && (
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Email &quot;Orden Procesada&quot; ya enviado automáticamente (Priority) el {new Date(order.orderProcessedEmailSentAt).toLocaleString()}
                  </span>
                )}
              </>
            )}

            {order.status === 'names_taken' && (
              <button className="btn btn-primary" onClick={() => advanceStatus('in_review')} disabled={statusLoading}>
                ↩ Cliente respondió → In review
              </button>
            )}

            {order.status === 'ready_to_file' && (
              <>
                <button className="btn btn-blue" onClick={() => advanceStatus('filed')} disabled={statusLoading}>
                  → Filed (enviado al Estado de Florida)
                </button>
                {order.orderProcessedEmailSentAt && (
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Email &quot;Orden Procesada&quot; ya enviado automáticamente (Priority) el {new Date(order.orderProcessedEmailSentAt).toLocaleString()} — este botón no lo va a reenviar.
                  </span>
                )}
              </>
            )}

            {order.status === 'filed' && (
              <>
                <button className="btn btn-green" onClick={() => advanceStatus('approved')} disabled={statusLoading}>
                  → Approved (solo interno, no manda email)
                </button>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Para avisarle al cliente, usá &quot;Enviar documento(s) al cliente&quot; abajo.
                </span>
              </>
            )}

            {order.status === 'approved' && (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Usá &quot;Enviar documento(s) al cliente&quot; abajo para avisarle y/o marcar como completed.
              </span>
            )}

            {order.status === 'completed' && (
              <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                ✅ Orden cerrada — todo lo entregado al cliente.
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

        {/* ── FUNC 4 — Enviar documento(s) al cliente (filed/approved) ────── */}
        {(order.status === 'filed' || order.status === 'approved') && (
          <Section title="📄 Enviar documento(s) al cliente">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.6 }}>
              Marcá qué ítems quedaron aprobados/entregados en esta ronda. El email le dice al cliente
              qué está listo y qué sigue en proceso — funciona para formación y/o cualquier addon
              (no asume que siempre hay un Certificate de por medio).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {pendingDeliveryItems().map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={!!deliveryChecked[key]}
                    onChange={e => setDeliveryChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                  />
                  {getOrderItemLabel(key, { entityType: order.entityType })}
                </label>
              ))}
              {Object.keys(order.deliveredItems ?? {}).filter(k => order.deliveredItems?.[k]).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#9ca3af' }}>
                  <input type="checkbox" checked disabled />
                  {getOrderItemLabel(key, { entityType: order.entityType })} <span style={{ fontSize: '12px' }}>(ya entregado)</span>
                </label>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={e => setDeliveryFiles(Array.from(e.target.files ?? []))}
            />
            {deliveryFiles.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#4f46e5', fontWeight: 500 }}>
                {deliveryFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join(', ')}
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
              <input type="checkbox" checked={sendWithoutFile} onChange={e => setSendWithoutFile(e.target.checked)} />
              Enviar sin adjuntar archivo
            </label>
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-green"
                onClick={handleSendApprovalUpdate}
                disabled={
                  certLoading ||
                  Object.values(deliveryChecked).every(v => !v) ||
                  (deliveryFiles.length === 0 && !sendWithoutFile)
                }
              >
                {certLoading ? 'Enviando…' : '🚀 Enviar al cliente'}
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
              {order.package === 'addon' ? (
                <span style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                  Orden New Business Letter — notificaciones manuales vía email directo al cliente.
                </span>
              ) : (
                <>
                  <button className="btn btn-blue" onClick={() => triggerEmail('order-confirmation')} disabled={emailLoading !== null} title="Reenviar el email de confirmación al cliente (útil cuando el envío automático original se perdió).">
                    {emailLoading === 'order-confirmation' ? 'Enviando…' : '🔁 Reenviar: Confirmación de Orden'}
                  </button>
                  {/* Nombres Tomados no aplica a órdenes de servicios à la carte
                      (no hay chequeo de nombre de empresa ahí). */}
                  {order.package !== 'services' && (
                    <button className="btn btn-yellow" onClick={() => triggerEmail('names-taken')} disabled={emailLoading !== null}>
                      {emailLoading === 'names-taken' ? 'Enviando…' : '⚠️ Email: Nombres Tomados'}
                    </button>
                  )}
                </>
              )}
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
