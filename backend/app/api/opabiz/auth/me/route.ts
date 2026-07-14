import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { getTierForScore } from '@/lib/opabiz-empleados'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/auth/me — bootstrap de la PWA: datos del empleado logueado.
export async function GET(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, email')
    .eq('id', session.usuarioId)
    .maybeSingle()

  const { data: empleado } = await supabase
    .from('EMPLEADOS')
    .select('nivel, puntaje_actual, estado_disponibilidad')
    .eq('id', session.empleadosId)
    .maybeSingle()

  if (!usuario || !empleado) {
    return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  }

  const tier = await getTierForScore(supabase, empleado.puntaje_actual ?? 0)

  return NextResponse.json({
    nombre: usuario.nombre,
    email: usuario.email,
    nivel: empleado.nivel,
    puntajeActual: empleado.puntaje_actual ?? 0,
    estadoDisponibilidad: empleado.estado_disponibilidad,
    tier,
  })
}
