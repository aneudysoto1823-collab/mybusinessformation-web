import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST /api/opabiz/orders/[id]/assign — asignación MANUAL de una orden de
// OPABIZ a un empleado específico, elegido por el admin desde el panel. Pisa
// cualquier asignación previa (automática o manual anterior) — sirve tanto
// para la primera asignación como para reasignar. El motor automático
// (pickBestEmployee, lib/opabiz-assignment.ts) es un endpoint aparte — este
// siempre respeta la elección explícita del admin.
//
// El body recibe `usuarioId` (usuarios.id — el id que ve el admin en la lista
// de empleados) y, opcionalmente, `notas` (nota libre del admin sobre la
// asignación/reasignación, ej. instrucciones para el empleado — pisa la nota
// anterior si se manda). Internamente se resuelve el EMPLEADOS.id
// correspondiente, que es la clave real que usan
// ordenes_opabiz/puntajes/inactividades (ver lib/opabiz-empleados.ts para el
// detalle de por qué son dos ids distintos).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: ordenId } = await params
  const { usuarioId, notas } = await req.json().catch(() => ({}))

  if (!usuarioId || typeof usuarioId !== 'string') {
    return NextResponse.json({ error: 'usuarioId requerido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: usuario, error: usuarioErr } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', usuarioId)
    .eq('rol', 'empleado')
    .eq('estado', 'activo')
    .maybeSingle()

  if (usuarioErr || !usuario) {
    return NextResponse.json({ error: 'Empleado no encontrado o no activo' }, { status: 404 })
  }

  const { data: empleadoRow, error: empleadoErr } = await supabase
    .from('EMPLEADOS')
    .select('id')
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (empleadoErr || !empleadoRow) {
    return NextResponse.json({ error: 'No existe registro de EMPLEADOS para ese usuario' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const updatePayload: Record<string, unknown> = { empleado_id: empleadoRow.id, estado: 'asignada', fecha_asignacion: now }
  if (typeof notas === 'string') updatePayload.notas = notas || null

  const { data: orden, error: ordenErr } = await supabase
    .from('ordenes_opabiz')
    .update(updatePayload)
    .eq('id', ordenId)
    .select()
    .single()

  if (ordenErr || !orden) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  await supabase.from('historial_actividad').insert({
    usuario_id: usuarioId,
    order_id: ordenId,
    tipo_evento: 'asignacion_manual',
    detalle: 'Asignada manualmente por un administrador desde el panel.',
  })

  return NextResponse.json({ orden })
}
