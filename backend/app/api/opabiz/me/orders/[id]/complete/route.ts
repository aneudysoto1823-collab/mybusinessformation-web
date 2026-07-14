import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { registrarPuntaje } from '@/lib/opabiz-empleados'

export const dynamic = 'force-dynamic'

// Puntos otorgados por completar una orden — mismo lugar que cualquier otro
// ajuste de puntaje (ver lib/opabiz-empleados.ts, registrarPuntaje).
const PUNTOS_ORDEN_COMPLETADA = 10

// POST /api/opabiz/me/orders/[id]/complete — pasa de 'en_progreso' a
// 'completada', guarda fecha_completada y suma puntaje al empleado.
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
  if (orden.estado !== 'en_progreso') {
    return NextResponse.json({ error: `No se puede completar una orden en estado '${orden.estado}'` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: actualizada, error } = await supabase
    .from('ordenes_opabiz')
    .update({ estado: 'completada', fecha_completada: now })
    .eq('id', id)
    .select()
    .single()

  if (error || !actualizada) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo actualizar la orden' }, { status: 500 })
  }

  await registrarPuntaje(supabase, session.empleadosId, PUNTOS_ORDEN_COMPLETADA, 'orden_completada')

  await supabase.from('historial_actividad').insert({
    usuario_id: session.usuarioId,
    order_id: id,
    tipo_evento: 'orden_completada',
    detalle: 'El empleado marcó la orden como completada.',
  })

  return NextResponse.json({ orden: actualizada })
}
