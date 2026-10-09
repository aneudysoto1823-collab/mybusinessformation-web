// Endpoint admin — cancelar una Subscription (Registered Agent / Virtual
// Address / Annual Report) desde /admin/orders/[id].
//
// Es el mismo botón para cualquier orden, sin importar de dónde vino (paquete
// de formación de opabiz.com, servicio suelto, o mybusinessformation.com): se
// cancela por el stripeSubscriptionId, que es único en Stripe.
//
// Dos modos:
//   - immediate: cancela ya. Además anula (void) las facturas abiertas de esa
//     Subscription, así Stripe deja de reintentar el cobro y se cortan las
//     alertas de "Subscription payment failed".
//   - period_end: el cliente conserva el servicio hasta la fecha ya pagada
//     (mismo comportamiento que el botón del portal del cliente).
//
// El reflejo en Order.subscriptions y los emails los maneja el webhook que ya
// existe (handleSubscriptionUpdated / handleSubscriptionDeleted). Para NO
// avisar al cliente, se marca cancelNoticeSent:true antes de llamar a Stripe:
// el webhook interpreta eso como "ya se le avisó" y no le manda email (la
// alerta interna a alert@ sí sale al terminar el servicio).

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAdminToken } from '@/lib/session'
import { logAdminAction } from '@/lib/audit-log'
import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertOrderSubscription, type OrderSubscriptionEntry } from '@/lib/order-subscriptions'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Mismas categorías que acepta Stripe en cancellation_details.feedback (y que
// usa el modal del portal del cliente).
const VALID_FEEDBACK = new Set([
  'customer_service', 'low_quality', 'missing_features', 'other',
  'switched_service', 'too_complex', 'too_expensive', 'unused',
])

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

  let stripeSubscriptionId: string, mode: 'immediate' | 'period_end', reason: string, comment: string, notifyClient: boolean
  try {
    const body = await request.json()
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
    mode = body?.mode === 'period_end' ? 'period_end' : 'immediate'
    reason = typeof body?.reason === 'string' && VALID_FEEDBACK.has(body.reason) ? body.reason : ''
    comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 500) : ''
    notifyClient = body?.notifyClient !== false
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })
  if (!reason) return NextResponse.json({ error: 'Falta el motivo de la cancelación' }, { status: 400 })

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
  if (entry.status === 'canceled') return NextResponse.json({ error: 'Esta suscripción ya está cancelada' }, { status: 409 })

  // Silenciar el email al cliente: ver comentario de arriba. Si Stripe falla,
  // se restaura el flag para no dejar bloqueado un aviso futuro legítimo.
  const silenced = !notifyClient && !entry.cancelNoticeSent
  if (silenced) await upsertOrderSubscription(orderId, { ...entry, cancelNoticeSent: true })

  const cancellation_details = {
    feedback: reason as Stripe.SubscriptionCancelParams.CancellationDetails['feedback'],
    comment: comment ? `[Admin] ${comment}` : '[Admin] Cancelada desde el panel',
  }

  const voidedInvoices: string[] = []
  try {
    const stripe = getStripe()
    if (mode === 'immediate') {
      await stripe.subscriptions.cancel(stripeSubscriptionId, { cancellation_details })
      // Anular facturas abiertas de esta Subscription para cortar los
      // reintentos de cobro (y sus alertas). No bloqueante.
      try {
        const open = await stripe.invoices.list({ subscription: stripeSubscriptionId, status: 'open', limit: 20 })
        for (const inv of open.data) {
          if (!inv.id) continue
          await stripe.invoices.voidInvoice(inv.id)
          voidedInvoices.push(inv.id)
        }
      } catch (e) {
        console.error('[admin/cancel-subscription] void open invoices (non-fatal):', e)
      }
    } else {
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true, cancellation_details })
    }
  } catch (err) {
    if (silenced) await upsertOrderSubscription(orderId, { ...entry, cancelNoticeSent: false }).catch(() => {})
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[admin/cancel-subscription]', msg)
    return NextResponse.json({ error: 'No se pudo cancelar en Stripe', detail: msg }, { status: 500 })
  }

  // Constancia en las notas de la orden (visible para el equipo).
  const stamp = new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })
  const line = `[${stamp}] Suscripción ${entry.service} cancelada por admin (${mode === 'immediate' ? 'inmediata' : 'al final del período'}). Motivo: ${reason}${comment ? ` — ${comment}` : ''}. Cliente ${notifyClient ? 'avisado' : 'NO avisado'} por email.`
  await supabase
    .from('Order')
    .update({ notes: order.notes ? `${order.notes}\n${line}` : line })
    .eq('id', orderId)

  await logAdminAction({
    action: 'subscription.cancel',
    entity: 'Order',
    entityId: orderId,
    before: entry,
    after: { stripeSubscriptionId, mode, reason, comment, notifyClient, voidedInvoices },
    request,
  })

  return NextResponse.json({ success: true, mode, voidedInvoices })
}
