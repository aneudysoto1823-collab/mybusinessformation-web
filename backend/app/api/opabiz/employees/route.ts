import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { readTrainingStatus } from '@/lib/opabiz-training'
import { NIVEL_ORDEN, type NivelEmpleado, createEmployeeAccount } from '@/lib/opabiz-empleados'
import { createInviteToken, sendInviteEmail } from '@/lib/opabiz-invite'

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
    .select('id, email, nombre, telefono, estado, fecha_creacion, password_hash, EMPLEADOS(id, nivel, puntaje_actual, estado_disponibilidad, inactividades_totales)')
    .eq('rol', 'empleado')
    .order('fecha_creacion', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // No exponer el hash en sí al cliente — solo si existe, para que el panel
  // sepa cuándo mostrar "Reenviar invitación".
  // Estado del entrenamiento (2026-10-07): vive en empleado_perfil.datos_extra_json.
  // Consulta aparte (no anidada) para no depender de cómo Supabase resuelve la
  // relación EMPLEADOS↔empleado_perfil.
  const empleadosIds = (data ?? []).flatMap(u => {
    const e = u.EMPLEADOS as { id: string } | { id: string }[] | null
    return (Array.isArray(e) ? e : e ? [e] : []).map(x => x.id)
  })
  const { data: perfiles } = empleadosIds.length
    ? await supabase.from('empleado_perfil').select('empleado_id, datos_extra_json').in('empleado_id', empleadosIds)
    : { data: [] as { empleado_id: string; datos_extra_json: unknown }[] }
  const trainingBy = new Map((perfiles ?? []).map(p => [p.empleado_id as string, readTrainingStatus(p.datos_extra_json)]))

  const empleados = (data ?? []).map(({ password_hash, ...rest }) => {
    const e = rest.EMPLEADOS as { id: string } | { id: string }[] | null
    const empId = (Array.isArray(e) ? e[0] : e)?.id
    return {
      ...rest,
      tieneClave: !!password_hash,
      entrenamiento: (empId && trainingBy.get(empId)) || { completado: false, aceptadoAt: null },
    }
  })

  return NextResponse.json({ empleados })
}

// POST /api/opabiz/employees — el admin crea un empleado nuevo. Crea las 3
// filas relacionadas (usuarios + empleado_perfil + EMPLEADOS) en un solo paso,
// `password_hash` queda en null, y dispara el email de invitación (token en
// Redis, 72h) para que el empleado cree su propia contraseña en
// /opabiz/invite/[token] — ver lib/opabiz-invite.ts.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nombre, email, telefono, nivel } = await req.json().catch(() => ({}))

  if (!nombre || !email || !telefono) {
    return NextResponse.json({ error: 'nombre, email y telefono son requeridos' }, { status: 400 })
  }
  const nivelFinal: NivelEmpleado = NIVEL_ORDEN.includes(nivel) ? nivel : 'basico'

  const supabase = getSupabaseAdmin()

  let account: { usuarioId: string; empleadosId: string; isNew: boolean }
  try {
    account = await createEmployeeAccount(supabase, { nombre, email, telefono, nivel: nivelFinal })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo crear el empleado' }, { status: 409 })
  }
  if (!account.isNew) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  try {
    const token = await createInviteToken(account.usuarioId)
    await sendInviteEmail({ email, nombre, token })
  } catch (err) {
    // No falla la creación del empleado por un error de email — el admin
    // puede reenviar la invitación después desde el panel.
    console.error('[opabiz/employees] invite email error:', err)
  }

  return NextResponse.json({ usuarioId: account.usuarioId, empleadosId: account.empleadosId }, { status: 201 })
}
