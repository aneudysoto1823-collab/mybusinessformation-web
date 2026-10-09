import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cancelOrderSubscription, VALID_CANCEL_FEEDBACK } from '@/lib/subscription-cancel'

export const dynamic = 'force-dynamic'

// Cancela UNA suscripción (Registered Agent / Virtual Address / Annual Report)
// sin sacar al cliente del sitio. Desde 2026-10-09 el cliente elige entre dos
// tipos ('renewal' = cancelar la renovación, 'service' = cancelar el servicio
// ahora con margen), ver lib/subscription-cancel-policy.ts. La lógica (Stripe,
// email de confirmación, alerta interna) vive en lib/subscription-cancel.ts,
// compartida con el panel admin. Acá solo va la autenticación del cliente.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string, stripeSubscriptionId: string, type: 'renewal' | 'service' | null, reason: string | undefined, comment: string | undefined
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
    type = body?.type === 'renewal' || body?.type === 'service' ? body.type : null
    reason = (typeof body?.reason === 'string' && VALID_CANCEL_FEEDBACK.has(body.reason)) ? body.reason : undefined
    comment = (typeof body?.comment === 'string' && body.comment.trim()) ? body.comment.trim().slice(0, 500) : undefined
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) {
    return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })
  }
  if (!type) {
    return NextResponse.json({ error: 'Falta elegir el tipo de cancelación' }, { status: 400 })
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
    .select('id, email')
    .eq('id', orderId)
    .maybeSingle()
  if (!targetOrder || targetOrder.email !== sessionOrder.email) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const result = await cancelOrderSubscription({
    orderId: targetOrder.id, stripeSubscriptionId, type, actor: 'client', reason, comment, notifyClient: true,
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: result.status })
  }
  return NextResponse.json({ success: true, type, endsAt: result.endsAt })
}
