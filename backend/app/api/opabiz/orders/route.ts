import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { findOrCreateClienteUsuario } from '@/lib/opabiz-clientes'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// GET /api/opabiz/orders?appointmentId=... — listado liviano, hoy solo se usa
// desde /admin/citas para saber si una cita ya tiene una orden vinculada (evita
// crear duplicados). Sin appointmentId, no filtra (no se usa así todavía).
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appointmentId = req.nextUrl.searchParams.get('appointmentId')
  const supabase = getSupabaseAdmin()

  let query = supabase.from('ordenes_opabiz').select('id, appointment_id, estado')
  if (appointmentId) query = query.eq('appointment_id', appointmentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ordenes: data ?? [] })
}

// POST /api/opabiz/orders — el admin crea una orden de OpaBiz Connect a mano
// (hoy el único origen: el botón "Crear orden OpaBiz Connect" en /admin/citas).
// `empleadoUsuarioId` es OBLIGATORIO — ordenes_opabiz.empleado_id es NOT NULL
// en la base real (confirmado 2026-07-14), así que no existe la posibilidad
// de crear una orden "sin asignar". Esto además calza con la decisión del
// founder: por ahora asignan todo a mano desde el panel, evaluando primero el
// desempeño de los agentes antes de automatizar quién recibe qué (el motor
// pickBestEmployee sigue existiendo para más adelante, no se dispara acá).
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    clienteEmail, clienteNombre, clienteTelefono,
    tipoServicio, esUrgente, fechaHoraCita, notas,
    appointmentId, empleadoUsuarioId,
  } = await req.json().catch(() => ({}))

  if (!clienteEmail || !clienteNombre || !tipoServicio || !empleadoUsuarioId) {
    return NextResponse.json(
      { error: 'clienteEmail, clienteNombre, tipoServicio y empleadoUsuarioId son requeridos' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()

  let clienteId: string
  try {
    clienteId = await findOrCreateClienteUsuario(supabase, {
      email: clienteEmail, nombre: clienteNombre, telefono: clienteTelefono,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: empleadoRow } = await supabase
    .from('EMPLEADOS')
    .select('id')
    .eq('usuario_id', empleadoUsuarioId)
    .maybeSingle()
  if (!empleadoRow) {
    return NextResponse.json({ error: 'No existe registro de EMPLEADOS para ese usuario' }, { status: 404 })
  }
  const empleadoId = empleadoRow.id

  const now = new Date().toISOString()
  const { data: orden, error: ordenErr } = await supabase
    .from('ordenes_opabiz')
    .insert({
      cliente_id: clienteId,
      empleado_id: empleadoId,
      tipo_servicio: tipoServicio,
      estado: 'asignada',
      es_urgente: !!esUrgente,
      fecha_hora_cita: fechaHoraCita || null,
      notas: notas || null,
      appointment_id: appointmentId || null,
      fecha_asignacion: now,
    })
    .select()
    .single()

  if (ordenErr || !orden) {
    return NextResponse.json({ error: ordenErr?.message ?? 'No se pudo crear la orden' }, { status: 500 })
  }

  await supabase.from('historial_actividad').insert({
    usuario_id: empleadoUsuarioId,
    order_id: orden.id,
    tipo_evento: 'asignacion_manual',
    detalle: 'Orden creada y asignada manualmente por un administrador desde el panel.',
  })

  return NextResponse.json({ orden }, { status: 201 })
}
