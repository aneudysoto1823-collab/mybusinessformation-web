import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Confirma el SetupIntent creado por /api/subscriptions/setup-payment-method
// y lo fija como default_payment_method del customer, para que la próxima
// renovación de cada Subscription lo use. Nunca confía en un paymentMethodId
// suelto del body — siempre relee el SetupIntent desde Stripe y verifica que
// su `customer` sea el mismo stripeCustomerId de la orden autenticada, para
// que nadie pueda reusar un setupIntentId ajeno.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string, setupIntentId: string
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
    setupIntentId = typeof body?.setupIntentId === 'string' ? body.setupIntentId : ''
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!setupIntentId) {
    return NextResponse.json({ error: 'Falta setupIntentId' }, { status: 400 })
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
    .select('id, email, stripeCustomerId')
    .eq('id', orderId)
    .maybeSingle()
  if (!targetOrder || targetOrder.email !== sessionOrder.email) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (!targetOrder.stripeCustomerId) {
    return NextResponse.json({ error: 'Esta orden no tiene servicios recurrentes activos' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.customer !== targetOrder.stripeCustomerId) {
      return NextResponse.json({ error: 'SetupIntent no corresponde a esta orden' }, { status: 403 })
    }
    if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
      return NextResponse.json({ error: 'El método de pago no se confirmó' }, { status: 400 })
    }
    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method.id

    await stripe.customers.update(targetOrder.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Cada Subscription tiene su propio default_payment_method (lo fija
    // createRecurringSubscriptionsForOrder desde 2026-10-07), y ese le gana al
    // del customer. Sin actualizarlo acá, la tarjeta nueva nunca se usaba en
    // las renovaciones.
    const subs = await stripe.subscriptions.list({ customer: targetOrder.stripeCustomerId, status: 'all', limit: 100 })
    const liveSubs = subs.data.filter(s => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status))
    for (const sub of liveSubs) {
      await stripe.subscriptions.update(sub.id, { default_payment_method: paymentMethodId })
    }

    // Si hay una renovación impaga (el cliente llega desde el email de pago
    // fallido), la cobramos ya con la tarjeta nueva en vez de esperar al
    // próximo reintento de Stripe. invoice.paid del webhook hace el resto.
    // No bloqueante: si el cobro falla, la tarjeta igual quedó guardada.
    let paidInvoices = 0
    let failedInvoices = 0
    const liveSubIds = new Set(liveSubs.map(s => s.id))
    const openInvoices = await stripe.invoices.list({ customer: targetOrder.stripeCustomerId, status: 'open', limit: 100 })
    for (const inv of openInvoices.data) {
      const subRef = inv.parent?.subscription_details?.subscription
      const subId = typeof subRef === 'string' ? subRef : subRef?.id
      if (!subId || !liveSubIds.has(subId) || !inv.id) continue
      try {
        await stripe.invoices.pay(inv.id, { payment_method: paymentMethodId })
        paidInvoices++
      } catch (e) {
        failedInvoices++
        console.error('[subscriptions/confirm-payment-method] retry invoice failed:', inv.id, e instanceof Error ? e.message : e)
      }
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    return NextResponse.json({
      success: true,
      card: pm.card ? { brand: pm.card.brand, last4: pm.card.last4 } : null,
      paidInvoices,
      failedInvoices,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscriptions/confirm-payment-method]', msg)
    return NextResponse.json({ error: 'No se pudo guardar la tarjeta', detail: msg }, { status: 500 })
  }
}
