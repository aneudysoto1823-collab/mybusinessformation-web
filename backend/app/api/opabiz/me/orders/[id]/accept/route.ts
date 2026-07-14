import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/orders/[id]/accept — el empleado acepta una orden que le
// asignó el motor (o el admin). Pasa de 'asignada' a 'en_progreso' y guarda
// fecha_inicio — esto también la saca del radar del cron de timeout
// (/api/opabiz/cron/reassign-timeouts, que solo mira estado='asignada').
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: orden } = await supabase
    .from('ordenes_opabiz')
    .select('id, empleado_id, estado')
    .eq('id', id)
    .maybeSingle()

  if (!orden || orden.empleado_id !== session.empleadosId) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (orden.estado !== 'asignada') {
    return NextResponse.json({ error: `No se puede aceptar una orden en estado '${orden.estado}'` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: actualizada, error } = await supabase
    .from('ordenes_opabiz')
    .update({ estado: 'en_progreso', fecha_inicio: now })
    .eq('id', id)
    .select()
    .single()

  if (error || !actualizada) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo actualizar la orden' }, { status: 500 })
  }

  await supabase.from('historial_actividad').insert({
    usuario_id: session.usuarioId,
    order_id: id,
    tipo_evento: 'orden_aceptada',
    detalle: 'El empleado aceptó la orden.',
  })

  return NextResponse.json({ orden: actualizada })
}
