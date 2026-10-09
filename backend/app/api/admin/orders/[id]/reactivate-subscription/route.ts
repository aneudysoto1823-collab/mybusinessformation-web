// Endpoint admin — deshacer una cancelación programada desde /admin/orders/[id]
// (equivalente al botón "Reactivar" del portal del cliente, pero con sesión de
// admin). Solo sirve mientras la Subscription sigue viva: una vez terminada
// (status 'canceled') hay que ordenar el servicio de nuevo.
//
// Stripe puede marcar la cancelación programada con cancel_at_period_end o con
// cancel_at según cómo se canceló (portal del cliente, Billing Portal, panel de
// Stripe), así que se lee la Subscription y se limpia el campo que esté puesto.
// Se limpia cancelNoticeSent/cancelType de la orden en el momento (sin email
// al cliente). Solo aplica a "cancelar la renovación": una baja del servicio
// ('service') ya se le avisa al proveedor y no se reactiva.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAdminToken } from '@/lib/session'
import { logAdminAction } from '@/lib/audit-log'
import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertOrderSubscription, type OrderSubscriptionEntry } from '@/lib/order-subscriptions'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: orderId } = await params

  let stripeSubscriptionId: string
  try {
    const body = await request.json()
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: order } = await supabase
    .from('Order')
    .select('id, notes, subscriptions')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  const subscriptions: OrderSubscriptionEntry[] = Array.isArray(order.subscriptions) ? order.subscriptions : []
  const entry = subscriptions.find(s => s.stripeSubscriptionId === stripeSubscriptionId)
  if (!entry) return NextResponse.json({ error: 'Suscripción no encontrada en esta orden' }, { status: 404 })
  if (entry.status === 'canceled') {
    return NextResponse.json({ error: 'Esta suscripción ya terminó. Hay que ordenar el servicio de nuevo.' }, { status: 409 })
  }

  // Una baja del servicio ('service') ya se le avisó al proveedor: no se
  // reactiva. Solo se puede deshacer "cancelar la renovación".
  if (entry.cancelType === 'service') {
    return NextResponse.json({ error: 'El servicio ya está en proceso de baja (se le avisa al proveedor). No se puede reactivar.' }, { status: 409 })
  }

  try {
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    if (sub.status === 'canceled') {
      return NextResponse.json({ error: 'Esta suscripción ya terminó en Stripe. Hay que ordenar el servicio de nuevo.' }, { status: 409 })
    }
    if (sub.cancel_at_period_end) {
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false })
    } else if (sub.cancel_at != null) {
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at: '' })
    }
    await upsertOrderSubscription(orderId, { ...entry, cancelNoticeSent: false, cancelType: undefined, serviceEndsAt: undefined })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/reactivate-subscription]', msg)
    return NextResponse.json({ error: 'No se pudo reactivar en Stripe', detail: msg }, { status: 500 })
  }

  const stamp = new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })
  const line = `[${stamp}] Suscripción ${entry.service} reactivada por admin (se quitó la cancelación programada).`
  await supabase
    .from('Order')
    .update({ notes: order.notes ? `${order.notes}\n${line}` : line })
    .eq('id', orderId)

  await logAdminAction({
    action: 'subscription.reactivate',
    entity: 'Order',
    entityId: orderId,
    before: entry,
    after: { stripeSubscriptionId },
    request,
  })

  return NextResponse.json({ success: true })
}
