import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrderItemLabel } from '@/lib/order-items'
import { REPLY_TO, INTERNAL_ALERT_EMAIL as ADMIN_EMAIL, FROM_OPABIZ, FROM_OPABIZ_ALERTS } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  const out: Record<string, unknown> = {}

  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      out.session = {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
        customer_email: session.customer_email,
        metadata: session.metadata,
        amount_total: session.amount_total,
        ui_mode: session.ui_mode,
      }
    } catch (e) {
      out.sessionError = e instanceof Error ? e.message : String(e)
    }
  }

  try {
    const endpoints = await getStripe().webhookEndpoints.list({ limit: 10 })
    out.webhookEndpoints = endpoints.data.map(e => ({ id: e.id, url: e.url, status: e.status, enabled_events: e.enabled_events }))
  } catch (e) {
    out.webhookEndpointsError = e instanceof Error ? e.message : String(e)
  }

  try {
    const events = await getStripe().events.list({ type: 'checkout.session.completed', limit: 10 })
    out.recentEvents = events.data.map(ev => ({
      id: ev.id,
      created: new Date(ev.created * 1000).toISOString(),
      sessionId: (ev.data.object as { id?: string }).id,
    }))
  } catch (e) {
    out.eventsError = e instanceof Error ? e.message : String(e)
  }

  if (sessionId && req.nextUrl.searchParams.get('replay') === '1') {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      const meta = session.metadata ?? {}
      const email = session.customer_details?.email ?? null
      const name  = session.customer_details?.name ?? null
      const companyName = meta.company_name || 'Unknown Company'
      const supabase = getSupabaseAdmin()
      const nameParts = (name ?? companyName).trim().split(/\s+/)
      const firstName = nameParts[0] ?? 'Client'
      const lastName  = nameParts.slice(1).join(' ') || '-'
      const orderId = crypto.randomUUID()
      const fbfcNumber = `FBNB-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}`
      const selectedServices = meta.selected_services ? meta.selected_services.split(',') : []
      const amountPaid = (session.amount_total ?? 0) / 100
      const documentId = meta.document_id || null
      const { error: orderError } = await supabase.from('Order').insert({
        id: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        firstName, lastName,
        email: (email ?? '').toLowerCase().trim(),
        companyName: companyName.trim().toUpperCase(),
        country: session.customer_details?.address?.country || 'US',
        entityType: 'llc',
        package: 'addon',
        addons: selectedServices,
        amount: amountPaid,
        currency: 'USD',
        paymentStatus: 'paid',
        status: 'in_review',
        speed: 'standard',
        registeredAgent: 'us',
        stripePaymentId: (session.payment_intent as string) ?? null,
      })
      out.replayResult = orderError ? { ok: false, error: orderError } : { ok: true, orderId, fbfcNumber }

      // Recuperación manual — mismos emails que mandaría el webhook real
      // (ahora arreglado) para esta sesión de prueba puntual.
      if (!orderError && email) {
        const isEs = (meta.lang as string) === 'es'
        const servicesHtml = selectedServices
          .map(s => `<li style="margin:4px 0">${getOrderItemLabel(`mkt:${s}`, { lang: isEs ? 'es' : 'en' })}</li>`)
          .join('')
        await getResend().emails.send({
          from: FROM_OPABIZ,
          replyTo: REPLY_TO,
          to: email,
          subject: isEs ? `OpaBiz: ✅ Pago confirmado — ${companyName}` : `OpaBiz: ✅ Payment confirmed — ${companyName}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
              <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
                <h1 style="color:#fff;font-size:20px;margin:0">Florida Business Formation Center</h1>
              </div>
              <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
                <h2 style="color:#1C2E44;font-size:20px;margin-bottom:8px">
                  ${isEs ? `¡Hola ${firstName}! Tu pago fue confirmado 🎉` : `Hi ${firstName}, your payment is confirmed! 🎉`}
                </h2>
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
              </div>
            </div>
          `,
        })
        await getResend().emails.send({
          from: FROM_OPABIZ_ALERTS,
          replyTo: REPLY_TO,
          to: ADMIN_EMAIL,
          subject: `OpaBiz Alerts: 🆕 Nueva orden New Business Letter — ${companyName}`,
          html: `<p>Recuperación manual (bug de country arreglado) — Orden ${fbfcNumber}, ${companyName}, $${amountPaid.toFixed(2)} USD.</p>`,
        })
        out.emailsSent = true
      }
    } catch (e) {
      out.replayException = e instanceof Error ? { message: e.message, stack: e.stack } : String(e)
    }
  }

  const supabase = getSupabaseAdmin()
  const { data: orders } = await supabase
    .from('Order')
    .select('id, companyName, email, package, paymentStatus, stripePaymentId, createdAt')
    .eq('package', 'addon')
    .order('createdAt', { ascending: false })
    .limit(5)
  out.recentAddonOrders = orders

  return NextResponse.json(out)
}
