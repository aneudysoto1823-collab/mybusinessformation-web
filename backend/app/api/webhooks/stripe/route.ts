import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { nameCheckHtmlLine, NameCheckResult } from '@/lib/sunbiz-namecheck'
import { SERVICES_CATALOG, SERVICE_BUNDLES } from '@/lib/services-pricing'
import { FORMATION_ADDON_NAMES } from '@/lib/order-items'
import { PACKAGE_SERVICES } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getResend = () => new Resend(process.env.RESEND_API_KEY)
// Webhook envía 2 emails: confirmación al cliente + alerta interna al admin.
// FROM y Reply-To centralizados en env vars (mismo patrón que lib/notifications.ts).
// ADMIN_EMAIL ahora va al buzón admin@opabiz.com de Zoho (configurable).
const FROM          = process.env.RESEND_FROM_TRANSACTIONAL || 'onboarding@resend.dev'
const REPLY_TO      = process.env.RESEND_REPLY_TO || 'info@opabiz.com'
const PORTAL        = 'https://opabiz.com/client-portal'
// El login real hoy vive en el home (popover), no en /client-portal (ver
// CLAUDE.md "Login del cliente en el home") — los links "Track My Order"
// deben mandar aquí, no al landing viejo.
const PORTAL_HOME   = 'https://opabiz.com'
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

  // ── Reembolsos y chargebacks ────────────────────────────────────────────
  // Antes esto no se manejaba en absoluto: un reembolso hecho a mano en el
  // Dashboard de Stripe (o un chargeback abierto por el banco del cliente)
  // nunca se reflejaba en la orden ni en la contabilidad interna.
  if (event.type === 'charge.refunded') {
    return handleChargeRefunded(event.data.object as Stripe.Charge)
  }
  if (event.type === 'charge.dispute.created') {
    return handleDisputeCreated(event.data.object as Stripe.Dispute)
  }
  if (event.type === 'charge.dispute.closed') {
    return handleDisputeClosed(event.data.object as Stripe.Dispute)
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
    stripePaymentId: (session.payment_intent as string) ?? null,
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
              <strong>${isEs ? 'Número de orden' : 'Order Number'}:</strong>
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

  const now = new Date().toISOString()
  const { data: order, error } = await supabase
    .from('Order')
    .update({
      paymentStatus:   'paid',
      status:          'in_review',
      amount:          amountPaid,
      stripePaymentId: (session.payment_intent as string) ?? null,
      // paidAt: fecha exacta del pago, usada por el cron de auto-envío de
      // "Orden Procesada" en órdenes Priority (updatedAt no sirve para esto,
      // se pisa con cualquier otra edición de la orden más adelante).
      paidAt:          now,
      updatedAt:       now,
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

  // Confirmación al cliente (pago confirmado) — NO incluye name-check.
  // Mismas convenciones del rediseño 2026-07-09 (ver notifications.ts /
  // handleServicesPaid más abajo): header blanco + logo OB, "Order Number"
  // en su caja propia, nombre completo, detalle real del paquete comprado
  // (PACKAGE_SERVICES), sin prometer plazos que no controlamos.
  // ⚠️ Este email todavía no tiene rama de idioma (isEs) — Order (formación)
  // no guarda el idioma del cliente en ningún campo hoy. Queda en inglés
  // hasta que se decida cómo persistir ese dato en el flujo del home.
  const formationAddons = (order.addons ?? {}) as Record<string, boolean>
  const addonNames = Object.entries(formationAddons)
    .filter(([, v]) => !!v)
    .map(([k]) => FORMATION_ADDON_NAMES[k]?.en ?? k)
  const hasAddons = addonNames.length > 0
  const packageKey = (order.package ?? '').toLowerCase().trim()
  const packageItems = PACKAGE_SERVICES[packageKey] ?? []
  const speedLabel = order.speed === 'expedited' ? 'Expedited (1-3 business days)' : 'Standard (7-14 business days)'

  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: ✅ Payment confirmed — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">Payment Confirmed</p>
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">Your payment is confirmed, ${order.firstName} ${order.lastName}! 🎉</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">Order Number</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
              <p style="margin:6px 0;font-size:14px"><strong>Entity Type:</strong> ${(order.entityType ?? 'llc').toUpperCase()}</p>
              ${order.package ? `
              <p style="margin:6px 0 4px;font-size:14px"><strong>Package:</strong> ${order.package}</p>
              ${packageItems.length ? `<table style="width:100%;border-collapse:collapse;margin:0 0 10px">${packageItems.map(item => `<tr><td style="padding:2px 8px 2px 0;vertical-align:top;width:10px;font-size:12.5px;color:#94a3b8;font-weight:800">·</td><td style="padding:2px 0;font-size:12.5px;color:#64748b;line-height:1.6">${item.en}</td></tr>`).join('')}</table>` : ''}
              ` : ''}
              <p style="margin:6px 0;font-size:14px"><strong>Filing Speed:</strong> ${speedLabel}</p>
              ${hasAddons ? `<p style="margin:6px 0 0;font-size:14px"><strong>Additional Services:</strong> ${addonNames.join(', ')}</p>` : ''}
              <p style="margin:12px 0 0;font-size:14px"><strong>Total paid:</strong> $${amountPaid.toFixed(2)} USD</p>
            </div>
            <p style="color:#475569;line-height:1.7">
              Our team is now reviewing your information and will verify name availability with the Florida Division of Corporations. We'll notify you by email as soon as your filing is submitted.
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                Track My Order
              </a>
            </div>
            <p style="color:#475569;line-height:1.7">
              Questions? Reach us on <a href="https://wa.me/13528377755" style="color:#059669">WhatsApp</a> or reply to this email.
            </p>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              This is a transactional email. We are a document preparation service, not a law firm.
            </p>
          </div>
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
      paymentStatus:   'paid',
      status:          'in_review',
      amount:          amountPaid,
      stripePaymentId: (session.payment_intent as string) ?? null,
      updatedAt:       new Date().toISOString(),
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
  const addons = (order.addons ?? {}) as { services?: string[]; bundles?: string[]; lines?: { label: string; amount: number }[]; lang?: string }
  const serviceLines = Array.isArray(addons.lines) ? addons.lines : []
  const servicesPlain = (addons.services ?? []).join(', ')

  // Idioma en el que el cliente hizo la orden (guardado en addons.lang desde
  // /api/checkout/embedded-services). Si no está (órdenes viejas), default EN.
  const isEs = addons.lang === 'es'

  // "What's included" — expande los bundles a sus servicios reales + los
  // comprados sueltos, sin duplicar, y trae la descripción de 1 línea de cada
  // uno desde el catálogo compartido (lib/services-pricing.ts). No incluye
  // tarifas estatales ni Expedited: no son "servicios" que el cliente reciba.
  const includedIds = Array.from(new Set([
    ...(addons.bundles ?? []).flatMap(bid => SERVICE_BUNDLES[bid]?.services ?? []),
    ...(addons.services ?? []),
  ]))
  const includedHtml = includedIds
    .map(id => SERVICES_CATALOG[id])
    .filter((svc): svc is NonNullable<typeof svc> => !!svc)
    .map(svc => `<tr><td style="padding:6px 8px 6px 0;vertical-align:top;width:14px;font-size:13.5px;color:#2563EB;font-weight:800">·</td><td style="padding:6px 0;font-size:13.5px;color:#475569;line-height:1.6"><strong style="color:#1e293b">${isEs ? svc.name_es : svc.name_en}</strong> — ${isEs ? svc.desc_es : svc.desc_en}</td></tr>`)
    .join('')

  // Confirmación al cliente. Los labels de servicesRowsHtml ya vienen en el
  // idioma correcto (addons.lines se guardó localizado desde computeServicesTotal).
  const servicesRowsHtml = serviceLines
    .map(l => `<tr><td style="padding:5px 0;font-size:14px;color:#475569">${l.label}</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;white-space:nowrap">$${l.amount}</td></tr>`)
    .join('') || '<tr><td style="padding:5px 0;font-size:14px;color:#475569">—</td><td></td></tr>'
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: isEs ? `OpaBiz: ✅ Pago confirmado — ${fbfc}` : `OpaBiz: ✅ Payment confirmed — ${fbfc}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `¡Gracias por su compra, ${order.firstName} ${order.lastName}!` : `Thank you for your purchase, ${order.firstName} ${order.lastName}!`}</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? 'Aquí tiene el resumen de los servicios que ordenó:' : "Here's a summary of the services you ordered:"}
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse">${servicesRowsHtml}
                <tr><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b">${isEs ? 'Total pagado' : 'Total paid'}</td><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;white-space:nowrap">$${amountPaid.toFixed(2)} USD</td></tr>
              </table>
            </div>
            ${includedHtml ? `
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">${isEs ? 'Qué incluye su compra' : "What's included"}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">${includedHtml}</table>
            ` : ''}
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px">${isEs ? 'Qué sigue' : 'What happens next'}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">1</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Revisamos su orden y verificamos todos los detalles' : 'We review your order and verify all details'}</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">2</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Preparamos y presentamos sus documentos' : 'We prepare and file your paperwork'}</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 0 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">3</div></td>
                <td style="font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Le avisaremos en cuanto quede procesada ante el Estado de Florida' : "We'll notify you as soon as it's processed with the State of Florida"}</td>
              </tr>
            </table>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? 'Para dar seguimiento a su orden cuando quiera, haga clic abajo e inicie sesión con su correo y el número de orden de arriba.' : 'To follow up on your order anytime, click below and log in with your email and the order number above.'}
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                ${isEs ? 'Rastrear Mi Orden' : 'Track My Order'}
              </a>
            </div>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              ${isEs ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.' : 'This is a transactional email. We are a document preparation service, not a law firm.'}
            </p>
          </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Reembolsos (`charge.refunded`). La orden se busca por `stripePaymentId`
// (= payment_intent), guardado al marcar la orden como pagada más arriba —
// órdenes pagadas ANTES de que existiera ese campo no se pueden emparejar.
// Se recalcula siempre desde los montos ACUMULADOS de Stripe (charge.amount /
// charge.amount_refunded), nunca por incremento — así es seguro si Stripe
// reintenta el mismo evento (idempotente).
// ─────────────────────────────────────────────────────────────────────────────
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = getSupabaseAdmin()
  const paymentIntentId = (charge.payment_intent as string) ?? null
  if (!paymentIntentId) return NextResponse.json({ received: true, skipped: 'no_payment_intent' })

  const { data: order } = await supabase
    .from('Order')
    .select('id, notes')
    .eq('stripePaymentId', paymentIntentId)
    .maybeSingle()

  if (!order) {
    console.error('[stripe-webhook] refund: no order found for payment_intent', paymentIntentId)
    return NextResponse.json({ received: true, skipped: 'no_order' })
  }

  const isFull  = charge.amount_refunded >= charge.amount
  const netPaid = (charge.amount - charge.amount_refunded) / 100
  const refundedAmount = charge.amount_refunded / 100

  if (isFull) {
    await supabase.from('Order').update({ paymentStatus: 'refunded', updatedAt: new Date().toISOString() }).eq('id', order.id)
  } else {
    const note = `[${new Date().toISOString().slice(0, 10)}] Reembolso parcial de $${refundedAmount.toFixed(2)} aplicado en Stripe (queda neto $${netPaid.toFixed(2)}).`
    await supabase.from('Order').update({ notes: order.notes ? `${order.notes}\n${note}` : note, updatedAt: new Date().toISOString() }).eq('id', order.id)
  }

  await supabase.from('accounting_income')
    .update({
      payment_status: isFull ? 'refunded' : 'partial',
      amount_paid:    netPaid,
      updated_at:     new Date().toISOString(),
    })
    .eq('order_id', order.id)

  return NextResponse.json({ received: true, orderId: order.id, full: isFull, refunded: refundedAmount })
}

// ─────────────────────────────────────────────────────────────────────────────
// Chargebacks — el cliente reclamó el cargo ante su banco (no algo que
// nosotros iniciamos, a diferencia del reembolso). `charge.dispute.created`
// solo marca la orden como "En disputa" y avisa por email — NO toca todavía
// la contabilidad, porque el resultado de la disputa aún no se sabe (evita
// ajustar dos veces si la ganamos). Stripe da un plazo corto para responder
// con evidencia, por eso el aviso — antes nadie se enteraba de que existía.
// ─────────────────────────────────────────────────────────────────────────────
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const supabase = getSupabaseAdmin()
  const paymentIntentId = (dispute.payment_intent as string) ?? null
  if (!paymentIntentId) return NextResponse.json({ received: true, skipped: 'no_payment_intent' })

  const { data: order } = await supabase
    .from('Order')
    .select('id, firstName, lastName, email, companyName')
    .eq('stripePaymentId', paymentIntentId)
    .maybeSingle()

  if (!order) {
    console.error('[stripe-webhook] dispute: no order found for payment_intent', paymentIntentId)
    return NextResponse.json({ received: true, skipped: 'no_order' })
  }

  await supabase.from('Order').update({ paymentStatus: 'disputed', updatedAt: new Date().toISOString() }).eq('id', order.id)

  const disputeAmount = dispute.amount / 100
  // Awaited (a diferencia de otros emails de este archivo): es la única alerta
  // de chargeback que existe, sin botón de reenvío manual como el A1 — si el
  // contenedor de Vercel se mata antes de que Resend termine (fire-and-forget),
  // el email se pierde sin rastro.
  await getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: ADMIN_EMAIL,
    subject: `OpaBiz Alerts: ⚠️ Chargeback abierto — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#9f1239;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">⚠️ Cliente abrió un chargeback</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Empresa</td><td style="padding:6px 0;font-weight:600">${order.companyName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Cliente</td><td style="padding:6px 4px;font-weight:600">${order.firstName} ${order.lastName}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${order.email}" style="color:#2563eb">${order.email}</a></td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Monto en disputa</td><td style="padding:6px 4px;font-weight:700">$${disputeAmount.toFixed(2)} USD</td></tr>
          </table>
          <div style="margin-top:16px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:13px;color:#991b1b">
            Stripe da un plazo corto para responder con evidencia (Dashboard → Payments → Disputes). Si no se responde a tiempo, se pierde automáticamente.
          </div>
          <div style="text-align:center;margin:18px 0 4px">
            <a href="https://opabiz.com/admin/orders/${order.id}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Abrir en el panel admin →</a>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] dispute alert error (non-fatal):', err))

  return NextResponse.json({ received: true, orderId: order.id })
}

// `charge.dispute.closed` — se resolvió. 'lost' se trata igual que un
// reembolso total (la plata ya no está); cualquier otro resultado ('won',
// 'warning_closed', etc.) vuelve la orden a 'paid'.
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const supabase = getSupabaseAdmin()
  const paymentIntentId = (dispute.payment_intent as string) ?? null
  if (!paymentIntentId) return NextResponse.json({ received: true, skipped: 'no_payment_intent' })

  const { data: order } = await supabase
    .from('Order')
    .select('id, notes')
    .eq('stripePaymentId', paymentIntentId)
    .maybeSingle()

  if (!order) {
    console.error('[stripe-webhook] dispute closed: no order found for payment_intent', paymentIntentId)
    return NextResponse.json({ received: true, skipped: 'no_order' })
  }

  const lost = dispute.status === 'lost'
  const note = `[${new Date().toISOString().slice(0, 10)}] Chargeback ${lost ? 'perdido' : 'resuelto a favor'} (Stripe status: ${dispute.status}).`

  await supabase.from('Order').update({
    paymentStatus: lost ? 'refunded' : 'paid',
    notes:         order.notes ? `${order.notes}\n${note}` : note,
    updatedAt:     new Date().toISOString(),
  }).eq('id', order.id)

  if (lost) {
    await supabase.from('accounting_income')
      .update({ payment_status: 'refunded', amount_paid: 0, updated_at: new Date().toISOString() })
      .eq('order_id', order.id)
  }

  return NextResponse.json({ received: true, orderId: order.id, lost })
}
