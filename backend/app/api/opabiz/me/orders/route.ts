import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/me/orders — órdenes asignadas al empleado logueado.
// Solo devuelve lo que le pertenece (empleado_id = EMPLEADOS.id de la sesión).
export async function GET(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('ordenes_opabiz')
    .select('id, tipo_servicio, estado, es_urgente, fecha_hora_cita, fecha_creacion, fecha_asignacion, usuarios(nombre, email, telefono)')
    .eq('empleado_id', session.empleadosId)
    .order('fecha_asignacion', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ordenes: data ?? [] })
}
