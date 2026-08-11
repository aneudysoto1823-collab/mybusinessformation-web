import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

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
      const { error: orderError } = await supabase.from('Order').insert({
        id: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        firstName, lastName,
        email: (email ?? '').toLowerCase().trim(),
        companyName: companyName.trim().toUpperCase(),
        entityType: 'llc',
        package: 'addon',
        addons: meta.selected_services ? meta.selected_services.split(',') : [],
        amount: (session.amount_total ?? 0) / 100,
        currency: 'USD',
        paymentStatus: 'paid',
        status: 'in_review',
        speed: 'standard',
        registeredAgent: 'us',
        stripePaymentId: (session.payment_intent as string) ?? null,
      })
      out.replayResult = orderError ? { ok: false, error: orderError } : { ok: true, orderId }
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
