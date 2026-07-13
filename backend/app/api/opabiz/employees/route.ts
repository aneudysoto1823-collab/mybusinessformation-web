import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NIVEL_ORDEN, type NivelEmpleado } from '@/lib/opabiz-empleados'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// GET /api/opabiz/employees — lista de empleados para el panel admin.
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nombre, telefono, estado, fecha_creacion, EMPLEADOS(nivel, puntaje_actual, estado_disponibilidad, inactividades_totales)')
    .eq('rol', 'empleado')
    .order('fecha_creacion', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ empleados: data ?? [] })
}

// POST /api/opabiz/employees — el admin crea un empleado nuevo. Crea las 3
// filas relacionadas (usuarios + empleado_perfil + EMPLEADOS) en un solo paso.
// `password_hash` queda en null — el login del empleado (invitación por email
// + que defina su propia contraseña) es la Etapa 4, todavía no construida.
// Mientras tanto, el empleado queda creado pero sin poder loguearse.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nombre, email, telefono, nivel } = await req.json().catch(() => ({}))

  if (!nombre || !email || !telefono) {
    return NextResponse.json({ error: 'nombre, email y telefono son requeridos' }, { status: 400 })
  }
  const nivelFinal: NivelEmpleado = NIVEL_ORDEN.includes(nivel) ? nivel : 'basico'

  const supabase = getSupabaseAdmin()

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const { data: usuario, error: usuarioErr } = await supabase
    .from('usuarios')
    .insert({ nombre, email, telefono, rol: 'empleado', estado: 'activo' })
    .select('id')
    .single()

  if (usuarioErr || !usuario) {
    return NextResponse.json({ error: usuarioErr?.message ?? 'No se pudo crear el usuario' }, { status: 500 })
  }

  // EMPLEADOS.id (no usuarios.id) es la clave que usan empleado_perfil,
  // ordenes_opabiz, puntajes e inactividades — hay que crear esta fila antes
  // y usar el id que devuelve, no el de usuarios.
  const { data: empleadoRow, error: empleadosErr } = await supabase
    .from('EMPLEADOS')
    .insert({
      usuario_id: usuario.id,
      nivel: nivelFinal,
      puntaje_actual: 0,
      tiempo_respuesta_promedio: 0,
      inactividades_totales: 0,
      estado_disponibilidad: 'no_disponible',
      fecha_ultimo_cambio: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (empleadosErr || !empleadoRow) {
    return NextResponse.json({ error: empleadosErr?.message ?? 'No se pudo crear el registro de EMPLEADOS' }, { status: 500 })
  }

  await supabase.from('empleado_perfil').insert({ empleado_id: empleadoRow.id })

  return NextResponse.json({ usuarioId: usuario.id, empleadosId: empleadoRow.id }, { status: 201 })
}
