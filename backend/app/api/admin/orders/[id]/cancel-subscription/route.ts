// Endpoint admin — cancelar una suscripción (Registered Agent / Virtual
// Address / Annual Report) desde /admin/orders/[id].
//
// Mismo botón para cualquier orden, sin importar de dónde vino (paquete,
// servicio suelto, opabiz.com o mybusinessformation.com): se cancela por el
// stripeSubscriptionId. Mismo flujo que el portal del cliente, con dos tipos
// ('renewal' / 'service'), ver lib/subscription-cancel-policy.ts. La lógica
// vive en lib/subscription-cancel.ts; acá solo va el auth de admin, el motivo
// obligatorio y el registro de auditoría.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { logAdminAction } from '@/lib/audit-log'
import { cancelOrderSubscription, VALID_CANCEL_FEEDBACK } from '@/lib/subscription-cancel'

export const dynamic = 'force-dynamic'

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

  let stripeSubscriptionId: string, type: 'renewal' | 'service' | null, reason: string, comment: string, notifyClient: boolean
  try {
    const body = await request.json()
    stripeSubscriptionId = typeof body?.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : ''
    type = body?.type === 'renewal' || body?.type === 'service' ? body.type : null
    reason = typeof body?.reason === 'string' && VALID_CANCEL_FEEDBACK.has(body.reason) ? body.reason : ''
    comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 500) : ''
    notifyClient = body?.notifyClient !== false
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!stripeSubscriptionId) return NextResponse.json({ error: 'Falta stripeSubscriptionId' }, { status: 400 })
  if (!type) return NextResponse.json({ error: 'Falta elegir el tipo de cancelación' }, { status: 400 })
  if (!reason) return NextResponse.json({ error: 'Falta el motivo de la cancelación' }, { status: 400 })

  const result = await cancelOrderSubscription({
    orderId, stripeSubscriptionId, type, actor: 'admin', reason, comment, notifyClient,
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: result.status })
  }

  await logAdminAction({
    action: 'subscription.cancel',
    entity: 'Order',
    entityId: orderId,
    after: { stripeSubscriptionId, type, endsAt: result.endsAt, reason, comment, notifyClient },
    request,
  })

  return NextResponse.json({ success: true, type, endsAt: result.endsAt })
}
