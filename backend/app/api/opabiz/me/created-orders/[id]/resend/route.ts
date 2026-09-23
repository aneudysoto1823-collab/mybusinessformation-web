import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { sendContinueApplicationEmail } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/created-orders/[id]/resend — reenvía al cliente el
// email "Continue My Application" (normalmente solo se manda una vez, al
// crear el borrador) — para cuando el agente corrigió un dato y el cliente
// necesita el link de nuevo.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('Order')
    .select('id, assistedByEmpleadosId, isDraft, notes, email, firstName, lastName, companyName')
    .eq('id', id)
    .maybeSingle()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.assistedByEmpleadosId !== session.empleadosId) {
    return NextResponse.json({ error: 'Esta orden no te pertenece' }, { status: 403 })
  }
  if (!order.isDraft) {
    return NextResponse.json({ error: 'El cliente ya inició o completó el pago. No se puede reenviar desde acá.' }, { status: 409 })
  }

  sendContinueApplicationEmail({
    id: order.id, email: order.email, firstName: order.firstName, lastName: order.lastName, companyName: order.companyName,
  })

  const { data: usuario } = await supabase.from('usuarios').select('nombre').eq('id', session.usuarioId).maybeSingle()
  const nota = `[Agente] Reenviado el link "Continue My Application" al cliente por ${usuario?.nombre ?? session.usuarioId} (${new Date().toLocaleString('es-ES')})`
  await supabase.from('Order').update({
    notes: order.notes ? `${order.notes}\n${nota}` : nota,
    updatedAt: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ success: true })
}
