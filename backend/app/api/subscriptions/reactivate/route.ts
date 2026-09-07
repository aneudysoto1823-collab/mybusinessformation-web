import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Deshace una cancelación programada (equivalente a "Don't cancel
// subscription" del Billing Portal de Stripe) — solo funciona mientras la
// Subscription sigue viva (cancel_at_period_end:true pero todavía no llegó
// la fecha real de fin). Una vez que Stripe la borra de verdad
// (customer.subscription.deleted ya disparó, status:'canceled' en nuestra
// DB), no se puede "revivir" — hay que ordenar el servicio de nuevo desde
// cero (el dashboard ofrece un link a /servicios para ese caso, no este
// endpoint). Mismo patrón de auth que /api/subscriptions/cancel.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string, stripeSubscriptionId: string
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) {
    return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: sessionOrder } = await supabase
    .from('Order')
    .select('email')
    .eq('id', sessionOrderId)
    .maybeSingle()
  if (!sessionOrder) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: targetOrder } = await supabase
    .from('Order')
    .select('id, email, subscriptions')
    .eq('id', orderId)
    .maybeSingle()
  if (!targetOrder || targetOrder.email !== sessionOrder.email) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const subscriptions = Array.isArray(targetOrder.subscriptions) ? targetOrder.subscriptions as { stripeSubscriptionId: string; status: string }[] : []
  const entry = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscriptionId)
  if (!entry) {
    return NextResponse.json({ error: 'Suscripción no encontrada en esta orden' }, { status: 404 })
  }
  if (entry.status === 'canceled') {
    return NextResponse.json({ error: 'Esta suscripción ya terminó — hay que ordenar el servicio de nuevo.' }, { status: 409 })
  }

  try {
    await getStripe().subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscriptions/reactivate]', msg)
    return NextResponse.json({ error: 'No se pudo reactivar la suscripción', detail: msg }, { status: 500 })
  }
}
