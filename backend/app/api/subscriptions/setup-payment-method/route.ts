import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Crea un SetupIntent para que el cliente guarde una tarjeta nueva SIN salir
// del sitio (Payment Element embebido en DashboardContent.tsx) — reemplaza el
// flujo anterior que redirigía a billing.stripe.com solo para esta acción
// (decisión founder 2026-09-07, ver memoria project_pendiente_payment_method_embebido).
// "off_session" porque el uso real es la renovación automática de la
// Subscription, no un cobro inmediato con el cliente presente.
//
// Mismo patrón de auth por cookie client_session que /api/billing-portal: la
// cookie da la orden de sesión, se verifica que la orden pedida comparta el
// mismo email antes de exponer/tocar su stripeCustomerId.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
  } catch {
    orderId = sessionOrderId
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
    const setupIntent = await getStripe().setupIntents.create({
      customer: targetOrder.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })
    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscriptions/setup-payment-method]', msg)
    return NextResponse.json({ error: 'No se pudo iniciar el cambio de tarjeta', detail: msg }, { status: 500 })
  }
}
