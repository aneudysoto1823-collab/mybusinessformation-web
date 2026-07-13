import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { pickBestEmployee } from '@/lib/opabiz-assignment'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST /api/opabiz/orders/[id]/auto-assign — asignación AUTOMÁTICA vía el
// motor de asignación (pickBestEmployee, lib/opabiz-assignment.ts). Por ahora
// requiere sesión admin igual que la asignación manual (app/api/opabiz/orders/
// [id]/assign) — todavía no está conectado a ningún disparador automático
// (ej. el webhook de pago de mybusinessformation-web), eso queda para otra
// sesión cuando se decida esa integración.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: ordenId } = await params
  const supabase = getSupabaseAdmin()

  const { data: orden, error: ordenErr } = await supabase
    .from('ordenes_opabiz')
    .select('id, tipo_servicio, es_urgente')
    .eq('id', ordenId)
    .maybeSingle()

  if (ordenErr || !orden) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const elegido = await pickBestEmployee(supabase, {
    tipoServicio: orden.tipo_servicio,
    esUrgente: orden.es_urgente ?? false,
  })

  if (!elegido) {
    return NextResponse.json({ error: 'No hay ningún empleado disponible elegible para esta orden' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: ordenActualizada, error: updateErr } = await supabase
    .from('ordenes_opabiz')
    .update({ empleado_id: elegido.empleadosId, estado: 'asignada', fecha_asignacion: now })
    .eq('id', ordenId)
    .select()
    .single()

  if (updateErr || !ordenActualizada) {
    return NextResponse.json({ error: 'No se pudo actualizar la orden' }, { status: 500 })
  }

  await supabase.from('historial_actividad').insert({
    usuario_id: elegido.usuarioId,
    order_id: ordenId,
    tipo_evento: 'asignacion_automatica',
    detalle: 'Asignada automáticamente por el motor de asignación.',
  })

  return NextResponse.json({ orden: ordenActualizada })
}
