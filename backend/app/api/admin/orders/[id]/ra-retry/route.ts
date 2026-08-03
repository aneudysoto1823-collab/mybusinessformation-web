// Endpoint admin — retry manual del provisioning de RA para una orden.
//
// Solo lo llama el boton "Retry RA provisioning" en /admin/orders/[id].
// La cadena en si (provisionRaForOrder) es idempotente por default: solo
// re-ejecuta los pasos cuyo ID no este en la DB. Con force:true, ignora la
// guardia "already provisioned" y reintenta los pasos faltantes.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { logAdminAction } from '@/lib/audit-log'
import { provisionRaForOrder } from '@/lib/ra-provisioning'

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
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const result = await provisionRaForOrder(orderId, { force: true })

  await logAdminAction({
    action: 'ra.retry-provision',
    entity: 'Order',
    entityId: orderId,
    after: result,
    request,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
