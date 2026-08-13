import { NextRequest, NextResponse, after } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { nameCheckHtmlLine, NameCheckResult } from '@/lib/sunbiz-namecheck'
import { SERVICES_CATALOG, SERVICE_BUNDLES } from '@/lib/services-pricing'
import { PACKAGE_SERVICES } from '@/lib/notifications'
import { computeFormationTotal, withBasicDisplayLine } from '@/lib/pricing'
import { getOrderItemLabel } from '@/lib/order-items'
import { hasReceivedGuide, recordGuideSent, getGuideAttachments, buildGuideBonusHtml, type GuideKey } from '@/lib/guides'
import { REPLY_TO, INTERNAL_ALERT_EMAIL as ADMIN_EMAIL, FROM_OPABIZ, FROM_OPABIZ_ALERTS } from '@/lib/email-constants'
import { provisionRaForOrder } from '@/lib/ra-provisioning'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const getResend = () => new Resend(process.env.RESEND_API_KEY)
// El login real hoy vive en el home (popover), no en /client-portal (ver
// CLAUDE.md "Login del cliente en el home") — los links "Track My Order"
// deben mandar aquí, no al landing viejo.
// ?login=1 abre el popover de login directo al cargar el home (ver
// fmCheckResumeParam en page.tsx) — antes "Track My Order" dejaba al cliente
// en el landing teniendo que encontrar el botón "Login" de nuevo.
const PORTAL_HOME   = 'https://opabiz.com/?login=1'

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
    // NOT NULL en la tabla Order — faltaba acá y hacía fallar el insert
    // completo (bug encontrado 2026-08-11: el checkout de /new-business
    // pagaba en Stripe pero la orden nunca se creaba, sin email ni número).
    country:         session.customer_details?.address?.country || 'US',
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

  // Desglose itemizado real (label + precio) desde los line_items de Stripe —
  // misma técnica que /api/sunbiz/checkout/status, evita duplicar precios acá.
  // Si el expand falla por algún motivo, degrada a la lista simple de labels
  // sin precio (nunca bloquea el envío del email).
  let orderLines: { label: string; amount: number }[] = []
  try {
    const full = await getStripe().checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
    orderLines = (full.line_items?.data ?? []).map(li => ({
      label:  li.description ?? '',
      amount: (li.amount_total ?? 0) / 100,
    }))
  } catch (e) {
    console.error('[stripe-webhook] line_items expand error (non-fatal):', e)
  }
  const servicesRowsHtml = orderLines.length > 0
    ? orderLines.map(l => `<tr><td style="padding:5px 0;font-size:14px;color:#475569">✓ ${l.label}</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;white-space:nowrap">$${l.amount.toFixed(2)}</td></tr>`).join('')
    : selectedServices.map(s => `<tr><td style="padding:5px 0;font-size:14px;color:#475569">✓ ${getOrderItemLabel(`mkt:${s}`, { lang })}</td><td></td></tr>`).join('')

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: email,
    subject: isEs
      ? `OpaBiz: ✅ Orden confirmada — ${companyName}`
      : `OpaBiz: ✅ Order confirmed — ${companyName}`,
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
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">
              ${isEs ? `¡Gracias por su orden, ${firstName} ${lastName}!` : `Thank you for your order, ${firstName} ${lastName}!`}
            </h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfcNumber}</div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:0 0 10px;font-size:14px"><strong>${isEs ? 'Empresa' : 'Company'}:</strong> ${companyName}</p>
              ${documentId ? `<p style="margin:0;font-size:14px"><strong>Document ID:</strong> ${documentId}</p>` : ''}
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse">${servicesRowsHtml}
                <tr><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b">${isEs ? 'Total pagado' : 'Total paid'}</td><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;white-space:nowrap">$${amountPaid.toFixed(2)} USD</td></tr>
              </table>
            </div>

            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px">${isEs ? 'Qué sigue' : 'What happens next'}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">1</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Revisamos su orden y comenzamos a preparar los servicios que adquirió' : 'We review your order and begin preparing the services you purchased'}</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">2</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Tramitamos cada servicio ante la agencia correspondiente' : 'We process each service with the corresponding agency'}</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 0 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">3</div></td>
                <td style="font-size:13.5px;color:#475569;line-height:1.6">${isEs ? 'Le enviaremos sus documentos y le avisaremos en cuanto todo esté listo' : "We'll send you your documents and let you know as soon as everything is ready"}</td>
              </tr>
            </table>

            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? `Para dar seguimiento a su orden cuando quiera, haga clic abajo e inicie sesión con su correo y el número de orden de arriba.`
                : `To follow up on your order anytime, click below and log in with your email and the order number above.`}
            </p>

            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                ${isEs ? 'Rastrear Mi Orden' : 'Track My Order'}
              </a>
            </div>

            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              ${isEs
                ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.'
                : 'This is a transactional email. We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] email error (non-fatal):', err))

  // Notify admin of new New Business Letter order
  const adminServicesHtml = orderLines.length > 0
    ? orderLines.map(l => `${l.label} ($${l.amount.toFixed(2)})`).join(', ')
    : selectedServices.map(s => getOrderItemLabel(`mkt:${s}`, { lang: 'es' })).join(', ')

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
            <tr><td style="padding:6px 0;color:#64748b">Servicios</td><td style="padding:6px 0">${adminServicesHtml}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Total</td><td style="padding:6px 4px;font-weight:700">$${amountPaid.toFixed(2)} USD</td></tr>
          </table>
          <div style="margin-top:16px;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;color:#9a3412">
            Procesar los servicios adquiridos y actualizar el estado de la orden cuando estén listos.
          </div>
          <div style="text-align:center;margin:18px 0 4px">
            <a href="https://opabiz.com/admin/orders/${orderId}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Abrir en el panel admin →</a>
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
  // UPDATE conditional (.eq('paymentStatus','pending')) — guarda anti-race
  // cuando 2 webhooks llegan casi simultaneos (reenvios manuales de Stripe,
  // redelivery post-incident). Ambos leen 'pending' arriba, pero solo UNO
  // pasa el filtro del update; el segundo recibe updated=[] y sale sin
  // repetir emails ni RA provisioning.
  const { data: updated, error } = await supabase
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
    .eq('paymentStatus', 'pending')  // ← guarda anti-race
    .select()

  if (error) {
    console.error('[stripe-webhook] formation order update failed:', orderId, error)
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    // Otro webhook simultaneo ya marco esta orden como paid en el intervalo
    // entre nuestro SELECT y este UPDATE. Salimos sin repetir la cadena.
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }
  const order = updated[0]

  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

  // Pre-computar la linea HTML del name-check (solo se usa en el email
  // del admin de mas abajo). Try/catch para que NUNCA pueda romper el
  // procesamiento del pago si nameCheckHtmlLine throw por algun motivo.
  let nameCheckHtml = ''
  try { nameCheckHtml = nameCheckHtmlLine((order.nameCheck as NameCheckResult | null) ?? null) }
  catch (e) { console.error('[stripe-webhook] nameCheckHtmlLine error (non-fatal):', e) }

  // Confirmación al cliente (pago confirmado) — NO incluye name-check.
  // Espeja handleServicesPaid() (más abajo) para que ambos emails de "pago
  // confirmado" se vean/lean igual, punto por punto (2026-07-10, ajustado
  // 2026-07-12): mismo saludo sin eyebrow ni emoji, tabla de precios
  // itemizada (computeFormationTotal — misma fuente que /order/complete),
  // 3 pasos numerados de "What happens next", mismo cierre. Las inclusiones
  // del paquete van anidadas bajo su propia línea de precio (no en una
  // sección "What's included" aparte — quedaba repitiendo los addons que ya
  // se ven arriba con precio).
  // ⚠️ Este email todavía no tiene rama de idioma (isEs) — Order (formación)
  // no guarda el idioma del cliente en ningún campo hoy. Queda en inglés
  // hasta que se decida cómo persistir ese dato en el flujo del home.
  const packageKey = (order.package ?? '').toLowerCase().trim()
  const packageItems = PACKAGE_SERVICES[packageKey] ?? []
  const formationAddons = (order.addons ?? {}) as Record<string, boolean>

  // computeFormationTotal ahora lanza si `package` no es basic/standard/premium
  // (antes caía en silencio a 'standard' — ver lib/pricing.ts). El pago y el
  // marcado paid+in_review de arriba YA se hicieron, así que si esto falla por
  // una orden con datos corruptos, no debe tumbar el webhook entero (Stripe
  // reintentaría sin efecto, ver guard de duplicate arriba) — solo se salta el
  // email de confirmación (mismo criterio que nameCheckHtmlLine más arriba).
  let formationRowsHtml = ''
  try {
    const { lines: rawFormationLines } = computeFormationTotal({
      package: order.package, entityType: order.entityType, speed: order.speed, addons: formationAddons,
    })
    const formationLines = withBasicDisplayLine(order.package, rawFormationLines)
    const packageInclHtml = packageItems.map(i => `<div>${i.en}</div>`).join('')
    formationRowsHtml = formationLines
      .map(l => {
        const priceRow = `<tr><td style="padding:5px 0;font-size:14px;color:#475569">${l.label}</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;white-space:nowrap">${l.amount < 0 ? '-$' + Math.abs(l.amount) : '$' + l.amount}</td></tr>`
        const isPackageRow = l.label.endsWith('Formation Package')
        const inclRow = isPackageRow && packageInclHtml
          ? `<tr><td colspan="2" style="padding:0 0 8px;font-size:12.5px;color:#64748b;line-height:1.6">${packageInclHtml}</td></tr>`
          : ''
        return priceRow + inclRow
      })
      .join('')
  } catch (e) {
    console.error('[stripe-webhook] computeFormationTotal error (order paid, email skipped):', orderId, e)
    return NextResponse.json({ received: true, orderId, fbfc, warning: 'pricing_error_email_skipped' })
  }

  // Regalo de Guía I y/o II — solo se manda la I si este email todavía no la
  // recibió por ningún canal (ver backend/lib/guides.ts). La II siempre se
  // manda acá, es exclusiva de la confirmación de pago de formación.
  let guidesToSend: GuideKey[] = []
  let guideAttachments: { filename: string; content: Buffer }[] = []
  let guideBonusHtml = ''
  try {
    const guide1AlreadySent = await hasReceivedGuide(order.email, 'guide1')
    guidesToSend = guide1AlreadySent ? ['guide2'] : ['guide1', 'guide2']
    guideAttachments = await getGuideAttachments(guidesToSend)
    guideBonusHtml = buildGuideBonusHtml(guidesToSend, 'en')
  } catch (e) {
    console.error('[stripe-webhook] guide attachments error (non-fatal, email sent without guides):', e)
    guidesToSend = []
    guideAttachments = []
    guideBonusHtml = ''
  }

  // after() de Next.js mantiene la lambda de Vercel viva hasta que estas
  // tareas post-response terminen. Sin after(), el .then/.catch de fire-and-
  // forget puede quedar a medias cuando Vercel congela/mata la funcion tras
  // el HTTP 200. Con volumen y lambdas reciclandose, casos como "el cliente
  // pago pero no recibio email" o "orden pagada sin direccion RA guardada"
  // empiezan a aparecer sin esta proteccion.
  after(async () => {
   try {
    await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: ✅ Order confirmed — ${order.companyName}`,
    attachments: guideAttachments,
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
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">Thank you for your order, ${order.firstName} ${order.lastName}!</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">Order Number</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <p style="color:#475569;line-height:1.7">
              Here's a summary of your order:
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
              <p style="margin:6px 0 0;font-size:14px"><strong>Entity Type:</strong> ${(order.entityType ?? 'llc').toUpperCase()}</p>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse">${formationRowsHtml}
                <tr><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b">Total paid</td><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;white-space:nowrap">$${amountPaid.toFixed(2)} USD</td></tr>
              </table>
            </div>
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px">What happens next</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">1</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">We review your information and verify your company name with the Florida Division of Corporations</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 14px 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">2</div></td>
                <td style="padding:0 0 14px;font-size:13.5px;color:#475569;line-height:1.6">We prepare and file your paperwork</td>
              </tr>
              <tr>
                <td style="width:26px;vertical-align:top;padding:2px 10px 0 0"><div style="width:20px;height:20px;background:#EFF6FF;color:#2563EB;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800">3</div></td>
                <td style="font-size:13.5px;color:#475569;line-height:1.6">We'll notify you as soon as your business is approved by the State of Florida</td>
              </tr>
            </table>
            <p style="color:#475569;line-height:1.7">
              To follow up on your order anytime, click below and log in with your email and the order number above.
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                Track My Order
              </a>
            </div>
            ${guideBonusHtml}
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              This is a transactional email. We are a document preparation service, not a law firm.
            </p>
          </div>
        </div>
      </div>
    `,
    })
    if (guidesToSend.length > 0) {
      await Promise.all(guidesToSend.map(g => recordGuideSent(order.email, g, 'order', `${order.firstName} ${order.lastName}`)))
    }
   } catch (err) {
    console.error('[stripe-webhook] formation email error (non-fatal):', err)
   }
  })

  // Alerta interna (orden pagada) — after() igual que el A1 arriba.
  after(async () => {
   try {
    await getResend().emails.send({
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
    })
   } catch (err) {
    console.error('[stripe-webhook] formation admin alert error (non-fatal):', err)
   }
  })

  // Provisioning de Registered Agent — envuelto en after() para que Vercel
  // no mate la lambda antes de que la cadena (POST /companies + POST /services
  // + GET /invoices + sendRaAddressReady) termine. Es el mas lento de los 3
  // fire-and-forget (3-8 seg tipico), el mas expuesto a ser cortado. Chequea
  // internamente si la orden
  // tiene addons.ra=true — si no, hace no-op. Si algo falla, manda alerta a
  // alert@opabiz.com y deja la orden lista para retry manual desde el panel
  // admin. Idempotente: safe si el webhook se reintenta (guard por
  // raProvisionedAt en la cadena).
  after(async () => {
    try {
      await provisionRaForOrder(order.id)
    } catch (err) {
      console.error('[stripe-webhook] ra-provision error (non-fatal):', err)
    }
  })

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

  // Descripción de 1 línea por servicio (catálogo compartido, lib/services-pricing.ts),
  // anidada bajo la fila de precio correspondiente en vez de repetida en una
  // sección aparte "What's included" (quedaba duplicado — el mismo ítem una
  // vez con precio y otra vez sin precio). Para un bundle, se listan las
  // descripciones de cada servicio que incluye bajo la fila del combo.
  const descByLabel = new Map<string, string>()
  for (const bid of (addons.bundles ?? [])) {
    const b = SERVICE_BUNDLES[bid]
    if (!b) continue
    const html = b.services
      .map(sid => SERVICES_CATALOG[sid])
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(svc => `<div><strong style="color:#1e293b">${isEs ? svc.name_es : svc.name_en}</strong> — ${isEs ? svc.desc_es : svc.desc_en}</div>`)
      .join('')
    descByLabel.set(isEs ? b.name_es : b.name_en, html)
  }
  for (const sid of (addons.services ?? [])) {
    const svc = SERVICES_CATALOG[sid]
    if (!svc) continue
    const label = isEs ? svc.name_es : svc.name_en
    if (!descByLabel.has(label)) descByLabel.set(label, `<div>${isEs ? svc.desc_es : svc.desc_en}</div>`)
  }

  // Confirmación al cliente. Los labels de servicesRowsHtml ya vienen en el
  // idioma correcto (addons.lines se guardó localizado desde computeServicesTotal).
  const servicesRowsHtml = serviceLines
    .map(l => {
      const priceRow = `<tr><td style="padding:5px 0;font-size:14px;color:#475569">${l.label}</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;white-space:nowrap">$${l.amount}</td></tr>`
      const desc = descByLabel.get(l.label)
      const descRow = desc ? `<tr><td colspan="2" style="padding:0 0 8px;font-size:12.5px;color:#64748b;line-height:1.5">${desc}</td></tr>` : ''
      return priceRow + descRow
    })
    .join('') || '<tr><td style="padding:5px 0;font-size:14px;color:#475569">—</td><td></td></tr>'
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: isEs ? `OpaBiz: ✅ Orden confirmada — ${fbfc}` : `OpaBiz: ✅ Order confirmed — ${fbfc}`,
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
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `¡Gracias por su orden, ${order.firstName} ${order.lastName}!` : `Thank you for your order, ${order.firstName} ${order.lastName}!`}</h2>
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
