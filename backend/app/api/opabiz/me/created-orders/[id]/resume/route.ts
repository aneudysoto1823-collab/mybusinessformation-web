import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/created-orders/[id]/resume — un agente reabre, para
// editar, una orden que él mismo generó vía intake asistida y que el
// cliente todavía no empezó a pagar (isDraft:true). Setea la cookie
// client_session (mismas opciones que setSession() en
// app/api/client-auth/route.ts) apuntando a esa orden, así que al abrir
// /?resume=1 en el navegador del agente, fmFetchAndRestoreDraft()
// (app/page.tsx) restaura el formulario público real exactamente donde el
// cliente lo dejaría — sin ?agent=1, así que se comporta como el form normal
// del cliente (pago visible si se llega hasta ahí), no como modo intake.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('Order')
    .select('id, assistedByEmpleadosId, isDraft, notes')
    .eq('id', id)
    .maybeSingle()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.assistedByEmpleadosId !== session.empleadosId) {
    return NextResponse.json({ error: 'Esta orden no te pertenece' }, { status: 403 })
  }
  if (!order.isDraft) {
    return NextResponse.json({ error: 'El cliente ya inició o completó el pago — no se puede editar desde acá.' }, { status: 409 })
  }

  const { data: usuario } = await supabase.from('usuarios').select('nombre').eq('id', session.usuarioId).maybeSingle()
  const nota = `[Agente] Orden reabierta para edición por ${usuario?.nombre ?? session.usuarioId} — ${new Date().toLocaleString('es-ES')}`
  await supabase.from('Order').update({
    notes: order.notes ? `${order.notes}\n${nota}` : nota,
    updatedAt: new Date().toISOString(),
  }).eq('id', id)

  const response = NextResponse.json({ success: true })
  response.cookies.set('client_session', id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}
