import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

const VALORES_VALIDOS = ['disponible', 'no_disponible'] as const

// POST /api/opabiz/me/disponibilidad { estado: 'disponible' | 'no_disponible' }
// El empleado controla su propia disponibilidad — es lo único que hace que el
// motor de asignación (pickBestEmployee) pueda encontrarlo como candidato.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { estado } = await req.json().catch(() => ({}))
  if (!VALORES_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: `estado debe ser uno de: ${VALORES_VALIDOS.join(', ')}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: actualizado, error } = await supabase
    .from('EMPLEADOS')
    .update({ estado_disponibilidad: estado, fecha_ultimo_cambio: new Date().toISOString() })
    .eq('id', session.empleadosId)
    .select('estado_disponibilidad')
    .single()

  if (error || !actualizado) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo actualizar la disponibilidad' }, { status: 500 })
  }

  // No se loguea en historial_actividad: order_id es NOT NULL en esa tabla y
  // un cambio de disponibilidad no está atado a ninguna orden.

  return NextResponse.json({ estadoDisponibilidad: actualizado.estado_disponibilidad })
}
