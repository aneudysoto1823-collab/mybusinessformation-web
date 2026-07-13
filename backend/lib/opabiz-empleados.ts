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
