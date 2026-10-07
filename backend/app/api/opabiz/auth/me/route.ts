import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { readTrainingStatus } from '@/lib/opabiz-training'

export const dynamic = 'force-dynamic'

// `usuarios.telefono` es NOT NULL y se crea con 'N/A' cuando el admin no lo
// cargó — para el panel eso es "sin teléfono".
function cleanTelefono(t: string | null | undefined): string {
  return t && t !== 'N/A' ? t : ''
}

// GET /api/opabiz/auth/me — bootstrap de la PWA: datos del empleado logueado,
// su perfil editable, progreso de nivel y (si es agente) comisiones.
export async function GET(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  const [{ data: usuario }, { data: empleado }, perfilRes, { data: niveles }, { data: afiliado }, { data: extra }] = await Promise.all([
    supabase.from('usuarios').select('nombre, email, telefono').eq('id', session.usuarioId).maybeSingle(),
    supabase.from('EMPLEADOS')
      .select('nivel, puntaje_actual, estado_disponibilidad, tiempo_respuesta_promedio')
      .eq('id', session.empleadosId).maybeSingle(),
    // Si la migración de perfil todavía no corrió, estas columnas no existen:
    // el panel sigue funcionando, solo sin foto/dirección.
    supabase.from('empleado_perfil')
      .select('foto_url, direccion_calle, direccion_ciudad, direccion_estado, direccion_zip, idiomas')
      .eq('empleado_id', session.empleadosId).maybeSingle(),
    supabase.from('niveles').select('nombre, rango_min, rango_max').order('rango_min', { ascending: true }),
    supabase.from('affiliates')
      .select('total_commission_owed, total_commission_paid')
      .eq('empleados_id', session.empleadosId).eq('status', 'approved').maybeSingle(),
    // Aparte del select de perfil de arriba a propósito: datos_extra_json
    // existe desde siempre, así que el estado del entrenamiento se lee
    // aunque la migración de perfil no haya corrido.
    supabase.from('empleado_perfil').select('datos_extra_json').eq('empleado_id', session.empleadosId).maybeSingle(),
  ])

  if (!usuario || !empleado) {
    return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  }

  const puntaje = empleado.puntaje_actual ?? 0
  const tiers = niveles ?? []
  const actual = tiers.find(t => puntaje >= t.rango_min && puntaje <= t.rango_max) ?? null
  const siguiente = tiers.find(t => t.rango_min > puntaje) ?? null
  const perfil = perfilRes.error ? null : perfilRes.data

  return NextResponse.json({
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: cleanTelefono(usuario.telefono),
    nivel: empleado.nivel,
    puntajeActual: puntaje,
    estadoDisponibilidad: empleado.estado_disponibilidad,
    tiempoRespuestaPromedio: empleado.tiempo_respuesta_promedio ?? null,
    tier: actual?.nombre ?? null,
    tierProgreso: actual ? { desde: actual.rango_min, hasta: actual.rango_max } : null,
    siguienteTier: siguiente ? { nombre: siguiente.nombre, desde: siguiente.rango_min } : null,
    perfil: {
      fotoUrl: perfil?.foto_url ?? null,
      direccionCalle: perfil?.direccion_calle ?? '',
      direccionCiudad: perfil?.direccion_ciudad ?? '',
      direccionEstado: perfil?.direccion_estado ?? '',
      direccionZip: perfil?.direccion_zip ?? '',
      idiomas: perfil?.idiomas ?? [],
    },
    perfilDisponible: !perfilRes.error,
    entrenamiento: readTrainingStatus(extra?.datos_extra_json),
    comisiones: afiliado
      ? { pendiente: Number(afiliado.total_commission_owed ?? 0), pagado: Number(afiliado.total_commission_paid ?? 0) }
      : null,
  })
}
