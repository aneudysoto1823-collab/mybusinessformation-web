import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Categorías válidas de Stripe para cancellation_details.feedback — el
// selector de motivo del modal (DashboardContent.tsx) manda una de estas.
// Cualquier otro valor se ignora (defensa en profundidad, nunca confiar
// ciegamente en el body) en vez de romper la cancelación por un motivo raro.
const VALID_FEEDBACK = new Set([
  'customer_service', 'low_quality', 'missing_features', 'other',
  'switched_service', 'too_complex', 'too_expensive', 'unused',
])

// Cancela UNA Subscription de Registered Agent / Virtual Address / Annual
// Report sin sacar al cliente del sitio (decisión founder 2026-09-01, ver
// memoria project_pendiente_cancelar_suscripcion_in_app). Separado a
// propósito de "Gestionar mi suscripción" (/api/billing-portal, que sigue
// mandando a Stripe): cancelar no toca datos de tarjeta, así que no
// reintroduce el riesgo PCI que "cambiar tarjeta" sí tendría si lo
// hiciéramos nosotros mismos.
//
// Solo dispara la cancelación en Stripe (cancel_at_period_end:true, mismo
// comportamiento default que el botón "Cancel subscription" del Billing
// Portal) — el reflejo en Order.subscriptions y el email al cliente ya los
// maneja el webhook existente (customer.subscription.updated →
// handleSubscriptionUpdated, ver app/api/webhooks/stripe/route.ts). No se
// duplica esa lógica acá.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string, stripeSubscriptionId: string, feedback: string | undefined, comment: string | undefined
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
    feedback = (typeof body?.reason === 'string' && VALID_FEEDBACK.has(body.reason)) ? body.reason : undefined
    comment = (typeof body?.comment === 'string' && body.comment.trim()) ? body.comment.trim().slice(0, 500) : undefined
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) {
    return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Mismo patrón de agrupación por email que /api/billing-portal: la cookie
  // da la orden de sesión, se verifica que la orden objetivo comparta el
  // mismo email antes de tocar su Subscription — nunca confiar en un orderId
  // suelto del body sin esa verificación.
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
    return NextResponse.json({ error: 'Esta suscripción ya está cancelada' }, { status: 409 })
  }

  try {
    await getStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
      // El equipo lo ve reflejado en la alerta interna que ya manda
      // handleSubscriptionUpdated (webhooks/stripe/route.ts) — lee esto
      // directo del objeto Subscription actualizado, no se duplica acá.
      ...(feedback || comment ? { cancellation_details: { feedback: feedback as Stripe.SubscriptionUpdateParams.CancellationDetails['feedback'], comment } } : {}),
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscriptions/cancel]', msg)
    return NextResponse.json({ error: 'No se pudo cancelar la suscripción', detail: msg }, { status: 500 })
  }
}
