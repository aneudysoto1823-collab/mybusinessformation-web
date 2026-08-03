// Endpoint admin — desencripta el SSN/ITIN de la orden bajo demanda.
//
// El SSN/ITIN del responsible party del EIN se guarda encriptado en
// Order.einTaxIdEnc (via lib/ein-tax-id.ts). El PDF SS-4 pre-filled ya lo
// desencripta al generarse, pero el admin panel muestra el numero enmascarado
// por default (***-**-1234) para que quien vea la pantalla no lo lea sin
// querer. Este endpoint expone el numero completo bajo demanda + escribe
// admin_audit_log para saber quien lo revelo.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { logAdminAction } from '@/lib/audit-log'
import { getSupabaseAdmin } from '@/lib/supabase'
import { decryptEinTaxId, formatEinTaxId } from '@/lib/ein-tax-id'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: orderId } = await params

  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('einIdType, einTaxIdEnc')
    .eq('id', orderId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const taxId = decryptEinTaxId(data.einTaxIdEnc as string | null)
  if (!taxId) {
    return NextResponse.json({ error: 'No tax ID stored for this order' }, { status: 404 })
  }

  // Audit log — quien vio el SSN, cuando, desde que IP.
  await logAdminAction({
    action: 'order.ein-tax-id.reveal',
    entity: 'Order',
    entityId: orderId,
    after: { idType: data.einIdType },
    request,
  })

  return NextResponse.json({
    idType: data.einIdType,
    taxId: formatEinTaxId(taxId),
  })
}
