import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/me/orders/[id] — detalle de una orden + documentos ya
// subidos. Nunca devuelve la orden si no pertenece al empleado logueado.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: orden, error } = await supabase
    .from('ordenes_opabiz')
    .select('id, tipo_servicio, estado, es_urgente, fecha_hora_cita, fecha_creacion, fecha_asignacion, fecha_inicio, fecha_completada, empleado_id, usuarios(nombre, email, telefono)')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!orden || orden.empleado_id !== session.empleadosId) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, tipo_documento, url_archivo, fecha_subida')
    .eq('order_id', id)
    .order('fecha_subida', { ascending: false })

  return NextResponse.json({ orden, documentos: documentos ?? [] })
}
