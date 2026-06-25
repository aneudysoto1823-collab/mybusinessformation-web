import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { nameCheckHtmlLine, NameCheckResult } from '@/lib/sunbiz-namecheck'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getResend = () => new Resend(process.env.RESEND_API_KEY)
// Webhook envía 2 emails: confirmación al cliente + alerta interna al admin.
// FROM y Reply-To centralizados en env vars (mismo patrón que lib/notifications.ts).
// ADMIN_EMAIL ahora va al buzón admin@opabiz.com de Zoho (configurable).
const FROM          = process.env.RESEND_FROM_TRANSACTIONAL || 'onboarding@resend.dev'
const REPLY_TO      = process.env.RESEND_REPLY_TO || 'info@opabiz.com'
const PORTAL        = 'https://opabiz.com/client-portal'
const ADMIN_EMAIL   = process.env.INTERNAL_ALERT_EMAIL || 'aneurysoto@gmail.com'
// Display Names: "OpaBiz" para el cliente, "OpaBiz Alerts" para alertas internas.
const FROM_OPABIZ        = `OpaBiz <${FROM}>`
const FROM_OPABIZ_ALERTS = `OpaBiz Alerts <${FROM}>`

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] signature check failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session  = event.data.object as Stripe.Checkout.Session
  const meta     = session.metadata ?? {}

  // ── Flujo de FORMACIÓN (home): la orden ya existe (pending) ────────────────
  // El Embedded Checkout del home crea la orden antes de pagar y pasa su id en
  // metadata. Aquí solo la marcamos como pagada y enviamos los emails.
  if (meta.kind === 'formation' && meta.orderId) {
    return handleFormationPaid(meta.orderId, session)
  }

  // ── Flujo de SERVICIOS à la carte (/servicios/checkout) ───────────────────
  // La orden ya existe (pending, package:'services'). Al pagar la marcamos paid
  // + in_review y enviamos confirmación al cliente + alerta interna.
  if (meta.kind === 'services' && meta.orderId) {
    return handleServicesPaid(meta.orderId, session)
  }

  // ── Flujo de ADD-ONS (new-business / marketing): crear orden nueva ────────
  const email    = session.customer_details?.email ?? null
  const name     = session.customer_details?.name  ?? null
  const amountPaid = (session.amount_total ?? 0) / 100

  const companyId       = meta.company_id       || null
  const documentId      = meta.document_id      || null
  const companyName     = meta.company_name     || 'Unknown Company'
  const selectedServices = meta.selected_services ? meta.selected_services.split(',') : []
  const lang            = (meta.lang as 'en' | 'es') || 'en'

  if (!email) {
    console.error('[stripe-webhook] no customer email in session', session.id)
    return NextResponse.json({ received: true })
  }

  const supabase = getSupabaseAdmin()

  // Split name into first / last (best-effort)
  const nameParts = (name ?? companyName).trim().split(/\s+/)
  const firstName = nameParts[0] ?? 'Client'
  const lastName  = nameParts.slice(1).join(' ') || '-'

  // Look up entity type from prospective_companies
  let entityType = 'llc'
  if (companyId) {
    const { data: pc } = await supabase
      .from('prospective_companies')
      .select('company_type')
      .eq('id', companyId)
      .single()
    if (pc?.company_type) entityType = pc.company_type.toLowerCase()
  }

  // Create Order
  const orderId = crypto.randomUUID()
  const fbfcNumber = `FBNB-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}`

  const { error: orderError } = await supabase.from('Order').insert({
    id:              orderId,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
    firstName,
    lastName,
    email:           email.toLowerCase().trim(),
    companyName:     companyName.trim().toUpperCase(),
    entityType,
    package:         'addon',
    addons:          selectedServices,
    amount:          amountPaid,
    currency:        'USD',
    paymentStatus:   'paid',
    status:          'in_review',
    speed:           'standard',
    registeredAgent: 'us',
  })

  if (orderError) {
    console.error('[stripe-webhook] order insert error:', orderError)
    return NextResponse.json({ error: 'Order insert failed' }, { status: 500 })
  }

  // Update prospective_companies → purchased
  if (companyId) {
    await supabase
      .from('prospective_companies')
      .update({ status: 'purchased' })
      .eq('id', companyId)

    await supabase
      .from('qr_scans')
      .update({ converted: true })
      .eq('company_id', companyId)
  }

  // Record conversion
  await supabase.from('conversions').insert({
    company_id:  companyId,
    order_id:    orderId,
    email,
    services:    selectedServices,
    total_amount: amountPaid,
  }).then(() => {})

  // Send confirmation email
  const isEs = lang === 'es'
  const serviceLabels: Record<string, { en: string; es: string }> = {
    labor_law_poster:      { en: 'Labor Law Poster 2026',      es: 'Póster de Leyes Laborales 2026' },
    ein:                   { en: 'EIN / Tax ID Number',         es: 'EIN / Número de Identificación Fiscal' },
    certificate_of_status: { en: 'Certificate of Status (FL)', es: 'Certificado de Estado (FL)' },
    bundle:                { en: 'Business Essentials Bundle',  es: 'Bundle Esencial de Negocios' },
  }

  const servicesHtml = selectedServices
    .map(s => `<li style="margin:4px 0">${serviceLabels[s]?.[lang] ?? s}</li>`)
    .join('')

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: email,
    subject: isEs
      ? `OpaBiz: ✅ Pago confirmado — ${companyName}`
      : `OpaBiz: ✅ Payment confirmed — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px;margin-bottom:8px">
            ${isEs ? `¡Hola ${firstName}! Tu pago fue confirmado 🎉` : `Hi ${firstName}, your payment is confirmed! 🎉`}
          </h2>
          <p style="color:#475569;line-height:1.7">
            ${isEs
              ? `Gracias por tu compra. Aquí está el resumen de tu orden:`
              : `Thank you for your purchase. Here's your order summary:`}
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:6px 0;font-size:14px"><strong>${isEs ? 'Empresa' : 'Company'}:</strong> ${companyName}</p>
            ${documentId ? `<p style="margin:6px 0;font-size:14px"><strong>Document ID:</strong> ${documentId}</p>` : ''}
            <p style="margin:6px 0;font-size:14px"><strong>${isEs ? 'Servicios adquiridos' : 'Services purchased'}:</strong></p>
            <ul style="margin:6px 0 6px 18px;font-size:14px;color:#475569">${servicesHtml}</ul>
            <p style="margin:6px 0;font-size:14px"><strong>Total:</strong> $${amountPaid.toFixed(2)} USD</p>
            <p style="margin:12px 0 6px;font-size:14px;background:#EFF6FF;padding:10px 14px;border-radius:6px;border-left:3px solid #2563EB">
              <strong>${isEs ? 'Número de confirmación' : 'Confirmation Number'}:</strong>
              <span style="font-size:16px;font-weight:800;color:#2563EB;letter-spacing:.5px"> ${fbfcNumber}</span>
            </p>
          </div>

          <p style="color:#475569;line-height:1.7">
            ${isEs
              ? `Con este número puedes acceder al portal de clientes para ver el estado de tu orden:`
              : `Use this number to access your client portal and track your order:`}
          </p>

          <div style="text-align:center;margin:24px 0">
            <a href="${PORTAL}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
              ${isEs ? 'Acceder al Portal de Clientes' : 'Access Client Portal'}
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.6">
            Florida Business Formation Center · opabiz.com<br/>
            ${isEs
              ? 'Somos una empresa de preparación de documentos, no un bufete de abogados.'
              : 'We are a document preparation service, not a law firm.'}
          </p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] email error (non-fatal):', err))

  // Notify admin of new New Business Letter order
  getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: ADMIN_EMAIL,
    subject: `OpaBiz Alerts: 🆕 Nueva orden New Business Letter — ${companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#c2410c;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">🆕 Nueva Orden — New Business Letter</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Empresa</td><td style="padding:6px 0;font-weight:600">${companyName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Cliente</td><td style="padding:6px 4px;font-weight:600">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Número</td><td style="padding:6px 4px;font-weight:700;color:#c2410c">${fbfcNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Servicios</td><td style="padding:6px 0">${selectedServices.join(', ')}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Total</td><td style="padding:6px 4px;font-weight:700">$${amountPaid.toFixed(2)} USD</td></tr>
          </table>
          <div style="margin-top:16px;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;color:#9a3412">
            Procesar los servicios adquiridos y actualizar el estado de la orden cuando estén listos.
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] admin notification error (non-fatal):', err))

  return NextResponse.json({ received: true, orderId, fbfcNumber })
}

// ─────────────────────────────────────────────────────────────────────────────
// Flujo de FORMACIÓN (home / Embedded Checkout)
// La orden ya existe en estado pending (creada por /api/orders con deferEmails).
// Al confirmarse el pago: marcar paid + in_review y enviar confirmación + alerta.
// Idempotente: si ya está paid, no reenvía emails.
// ─────────────────────────────────────────────────────────────────────────────
async function handleFormationPaid(orderId: string, session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin()
  const amountPaid = (session.amount_total ?? 0) / 100

  const { data: existing } = await supabase
    .from('Order')
    .select('paymentStatus')
    .eq('id', orderId)
    .single()

  if (!existing) {
    console.error('[stripe-webhook] formation order not found:', orderId)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (existing.paymentStatus === 'paid') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const { data: order, error } = await supabase
    .from('Order')
    .update({
      paymentStatus: 'paid',
      status:        'in_review',
      amount:        amountPaid,
      updatedAt:     new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error || !order) {
    console.error('[stripe-webhook] formation order update failed:', orderId, error)
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
  }

  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

  // Pre-computar la linea HTML del name-check (solo se usa en el email
  // del admin de mas abajo). Try/catch para que NUNCA pueda romper el
  // procesamiento del pago si nameCheckHtmlLine throw por algun motivo.
  let nameCheckHtml = ''
  try { nameCheckHtml = nameCheckHtmlLine((order.nameCheck as NameCheckResult | null) ?? null) }
  catch (e) { console.error('[stripe-webhook] nameCheckHtmlLine error (non-fatal):', e) }

  // Confirmación al cliente (pago confirmado) — NO incluye name-check
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: ✅ Payment confirmed — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName}, your payment is confirmed! 🎉</h2>
          <p style="color:#475569;line-height:1.7">
            Thank you for choosing Florida Business Formation Center. Here's a summary of your order:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Entity Type:</strong> ${(order.entityType ?? 'llc').toUpperCase()}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Package:</strong> ${order.package}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Total paid:</strong> $${amountPaid.toFixed(2)} USD</p>
            <p style="margin:12px 0 6px;font-size:14px;background:#EFF6FF;padding:10px 14px;border-radius:6px;border-left:3px solid #2563EB">
              <strong>Confirmation Number:</strong>
              <span style="font-size:16px;font-weight:800;color:#2563EB;letter-spacing:.5px"> ${fbfc}</span>
            </p>
          </div>
          <p style="color:#475569;line-height:1.7">
            Our team is now reviewing your information and will verify name availability with the
            Florida Division of Corporations. We'll be in touch within <strong>1 business day</strong>.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${PORTAL}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
              Access Client Portal
            </a>
          </div>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
            Florida Business Formation Center · opabiz.com<br/>
            This is a transactional email. We are a document preparation service, not a law firm.
          </p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] formation email error (non-fatal):', err))

  // Alerta interna (orden pagada)
  getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: ADMIN_EMAIL,
    subject: `OpaBiz Alerts: 🆕 NUEVA ORDEN PAGADA — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#059669;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">🆕 Nueva Orden Pagada — Formación</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Empresa</td><td style="padding:6px 0;font-weight:600">${order.companyName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Cliente</td><td style="padding:6px 4px;font-weight:600">${order.firstName} ${order.lastName}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${order.email}" style="color:#2563eb">${order.email}</a></td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Número</td><td style="padding:6px 4px;font-weight:700;color:#059669">${fbfc}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Paquete</td><td style="padding:6px 0">${order.package} · ${order.speed}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Total</td><td style="padding:6px 4px;font-weight:700">$${amountPaid.toFixed(2)} USD</td></tr>
          </table>
          ${nameCheckHtml}
          <div style="text-align:center;margin:18px 0 4px">
            <a href="https://opabiz.com/admin/orders/${order.id}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Abrir en el panel admin →</a>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] formation admin alert error (non-fatal):', err))

  return NextResponse.json({ received: true, orderId, fbfc })
}

// ─────────────────────────────────────────────────────────────────────────────
// Flujo de SERVICIOS à la carte (/servicios/checkout)
// La orden ya existe (pending, package:'services'). Al pagar: marcar paid +
// in_review, listar los servicios comprados y enviar confirmación + alerta.
// Idempotente: si ya está paid, no reenvía emails.
// ─────────────────────────────────────────────────────────────────────────────
async function handleServicesPaid(orderId: string, session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin()
  const amountPaid = (session.amount_total ?? 0) / 100

  const { data: existing } = await supabase
    .from('Order')
    .select('paymentStatus')
    .eq('id', orderId)
    .single()

  if (!existing) {
    console.error('[stripe-webhook] services order not found:', orderId)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (existing.paymentStatus === 'paid') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const { data: order, error } = await supabase
    .from('Order')
    .update({
      paymentStatus: 'paid',
      status:        'in_review',
      amount:        amountPaid,
      updatedAt:     new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error || !order) {
    console.error('[stripe-webhook] services order update failed:', orderId, error)
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
  }

  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

  // Lista de servicios comprados (desde addons.services / addons.lines)
  const addons = (order.addons ?? {}) as { services?: string[]; lines?: { label: string; amount: number }[] }
  const serviceLines = Array.isArray(addons.lines) ? addons.lines : []
  const servicesListHtml = serviceLines
    .map(l => `<li style="margin:4px 0">${l.label} — $${l.amount}</li>`)
    .join('') || '<li>—</li>'
  const servicesPlain = (addons.services ?? []).join(', ')

  // Confirmación al cliente
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: ✅ Payment confirmed — ${fbfc}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName}, your payment is confirmed! 🎉</h2>
          <p style="color:#475569;line-height:1.7">
            Thank you for choosing OpaBiz. Here's a summary of the services you ordered:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <ul style="margin:6px 0 6px 18px;font-size:14px;color:#475569">${servicesListHtml}</ul>
            <p style="margin:6px 0;font-size:14px"><strong>Total paid:</strong> $${amountPaid.toFixed(2)} USD</p>
            <p style="margin:12px 0 6px;font-size:14px;background:#EFF6FF;padding:10px 14px;border-radius:6px;border-left:3px solid #2563EB">
              <strong>Confirmation Number:</strong>
              <span style="font-size:16px;font-weight:800;color:#2563EB;letter-spacing:.5px"> ${fbfc}</span>
            </p>
          </div>
          <p style="color:#475569;line-height:1.7">
            Our team is reviewing your information and will be in touch within <strong>1 business day</strong>
            to move your order forward.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${PORTAL}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
              Access Client Portal
            </a>
          </div>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
            OpaBiz · opabiz.com<br/>
            This is a transactional email. We are a document preparation service, not a law firm.
          </p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] services email error (non-fatal):', err))

  // Alerta interna
  getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: ADMIN_EMAIL,
    subject: `OpaBiz Alerts: 🆕 NUEVA ORDEN PAGADA — Servicios (${fbfc})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#7c3aed;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">🆕 Nueva Orden Pagada — Servicios à la carte</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Cliente</td><td style="padding:6px 0;font-weight:600">${order.firstName} ${order.lastName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Email</td><td style="padding:6px 4px"><a href="mailto:${order.email}" style="color:#2563eb">${order.email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Empresa</td><td style="padding:6px 0;font-weight:600">${order.companyName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Número</td><td style="padding:6px 4px;font-weight:700;color:#7c3aed">${fbfc}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Servicios</td><td style="padding:6px 0">${servicesPlain}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Total</td><td style="padding:6px 4px;font-weight:700">$${amountPaid.toFixed(2)} USD</td></tr>
          </table>
          <div style="text-align:center;margin:18px 0 4px">
            <a href="https://opabiz.com/admin/orders/${order.id}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Abrir en el panel admin →</a>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] services admin alert error (non-fatal):', err))

  return NextResponse.json({ received: true, orderId, fbfc })
}
