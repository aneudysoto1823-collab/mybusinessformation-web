import type { getSupabaseAdmin } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Estado "en vivo" de cada empleado de OPABIZ (tabla EMPLEADOS — creada en una
// sesión previa del proyecto, no en CONTEXTO.md). Es la tabla resumen que lee
// el motor de asignación (lib/opabiz-assignment.ts); `puntajes` e
// `inactividades` siguen siendo las bitácoras de auditoría (un evento por fila).
//
// ⚠️ Ojo con los dos ids distintos (confirmado 2026-07-13 vía foreign keys
// reales en la base — CONTEXTO.md nunca lo documentó):
//   - `usuarios.id`   → identidad de login (email/password/rol). Es lo que usa
//                       `historial_actividad.usuario_id`.
//   - `EMPLEADOS.id`  → registro operativo del empleado. Es lo que usan
//                       `empleado_perfil.empleado_id`, `ordenes_opabiz.empleado_id`,
//                       `puntajes.empleado_id`, `inactividades.empleado_id`.
// Las funciones de este archivo reciben siempre el `EMPLEADOS.id` (nunca
// `usuarios.id`) como `empleadosId`.
//
// Regla: NUNCA insertar directo en `puntajes` o `inactividades` desde otro
// lugar del código — siempre pasar por registrarPuntaje()/registrarInactividad()
// de este archivo, para que EMPLEADOS nunca quede desincronizada. Se eligió
// mantener esto en código de aplicación (no un trigger de Postgres) para seguir
// el mismo patrón que el resto del proyecto (numeración de facturas, emails,
// renovaciones — todo vive en lib/, nunca en triggers de base de datos).
// ─────────────────────────────────────────────────────────────────────────────

type Supabase = ReturnType<typeof getSupabaseAdmin>

export const NIVEL_ORDEN = ['basico', 'intermedio', 'avanzado', 'administrador'] as const
export type NivelEmpleado = (typeof NIVEL_ORDEN)[number]

export async function registrarPuntaje(
  supabase: Supabase,
  empleadosId: string,
  cambio: number,
  motivo: string,
): Promise<void> {
  await supabase.from('puntajes').insert({ empleado_id: empleadosId, puntaje_cambio: cambio, motivo })

  const { data: emp } = await supabase
    .from('EMPLEADOS')
    .select('puntaje_actual')
    .eq('id', empleadosId)
    .single()

  await supabase
    .from('EMPLEADOS')
    .update({
      puntaje_actual: (emp?.puntaje_actual ?? 0) + cambio,
      fecha_ultimo_cambio: new Date().toISOString(),
    })
    .eq('id', empleadosId)
}

export async function registrarInactividad(
  supabase: Supabase,
  empleadosId: string,
  orderId: string,
  tipoInactividad: string,
): Promise<void> {
  await supabase
    .from('inactividades')
    .insert({ empleado_id: empleadosId, order_id: orderId, tipo_inactividad: tipoInactividad })

  const { data: emp } = await supabase
    .from('EMPLEADOS')
    .select('inactividades_totales')
    .eq('id', empleadosId)
    .single()

  await supabase
    .from('EMPLEADOS')
    .update({
      inactividades_totales: (emp?.inactividades_totales ?? 0) + 1,
      fecha_ultimo_cambio: new Date().toISOString(),
    })
    .eq('id', empleadosId)
}

/**
 * Crea las 3 filas relacionadas de un empleado nuevo (usuarios + EMPLEADOS +
 * empleado_perfil) — extraído de POST /api/opabiz/employees para reusarlo
 * también en el alta automática al aprobar un agente
 * (app/api/admin/affiliates/[id]/route.ts). Si ya existe un usuario con ese
 * email y rol 'empleado', reusa esa cuenta en vez de duplicarla (`isNew:false`)
 * — cubre el caso de un agente cuyo email ya tenía cuenta de OpaBiz Connect
 * por otro motivo. Si el email existe con OTRO rol, lanza — nunca pisa una
 * cuenta de admin/cliente existente.
 */
export async function createEmployeeAccount(
  supabase: Supabase,
  data: { nombre: string; email: string; telefono?: string | null; nivel?: NivelEmpleado },
): Promise<{ usuarioId: string; empleadosId: string; isNew: boolean }> {
  const email = data.email.toLowerCase().trim()

  const { data: existente } = await supabase.from('usuarios').select('id, rol').eq('email', email).maybeSingle()
  if (existente) {
    if (existente.rol !== 'empleado') {
      throw new Error(`Ya existe un usuario con ese email (rol: ${existente.rol})`)
    }
    const { data: empleadoRow } = await supabase.from('EMPLEADOS').select('id').eq('usuario_id', existente.id).maybeSingle()
    if (!empleadoRow) throw new Error('Usuario empleado sin fila EMPLEADOS asociada (revisar a mano en Supabase)')
    return { usuarioId: existente.id, empleadosId: empleadoRow.id, isNew: false }
  }

  const nivelFinal: NivelEmpleado = data.nivel && NIVEL_ORDEN.includes(data.nivel) ? data.nivel : 'basico'

  const { data: usuario, error: usuarioErr } = await supabase
    .from('usuarios')
    .insert({ nombre: data.nombre, email, telefono: data.telefono || 'N/A', rol: 'empleado', estado: 'activo' })
    .select('id')
    .single()
  if (usuarioErr || !usuario) throw new Error(usuarioErr?.message ?? 'No se pudo crear el usuario')

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
  if (empleadosErr || !empleadoRow) throw new Error(empleadosErr?.message ?? 'No se pudo crear el registro de EMPLEADOS')

  await supabase.from('empleado_perfil').insert({ empleado_id: empleadoRow.id })

  return { usuarioId: usuario.id, empleadosId: empleadoRow.id, isNew: true }
}

/** Nombre del tier de desempeño (Oro/Plata/Bronce/Riesgo) para un puntaje dado. */
export async function getTierForScore(supabase: Supabase, puntaje: number): Promise<string | null> {
  const { data } = await supabase
    .from('niveles')
    .select('nombre')
    .lte('rango_min', puntaje)
    .gte('rango_max', puntaje)
    .maybeSingle()
  return data?.nombre ?? null
}
