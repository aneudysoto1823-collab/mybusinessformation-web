import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })
const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'onboarding@resend.dev'
const PORTAL  = 'https://mybusinessformation.com/login'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] signature check failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session  = event.data.object as Stripe.Checkout.Session
  const meta     = session.metadata ?? {}
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
  const fbfcNumber = `FBFC-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}`

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
    status:          'processing',
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

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: isEs
      ? `✅ Pago confirmado — ${companyName}`
      : `✅ Payment confirmed — ${companyName}`,
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
            Florida Business Formation Center · mybusinessformation.com<br/>
            ${isEs
              ? 'Somos una empresa de preparación de documentos, no un bufete de abogados.'
              : 'We are a document preparation service, not a law firm.'}
          </p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[stripe-webhook] email error (non-fatal):', err))

  return NextResponse.json({ received: true, orderId, fbfcNumber })
}
