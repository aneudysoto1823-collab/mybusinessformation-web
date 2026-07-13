import type { getSupabaseAdmin } from './supabase'
import { NIVEL_ORDEN, type NivelEmpleado } from './opabiz-empleados'

// ─────────────────────────────────────────────────────────────────────────────
// Motor de asignación de OPABIZ — decide qué empleado recibe cada orden nueva.
//
// Algoritmo (mismo patrón que usan sistemas de dispatch reales: ACD de call
// centers, matching de Uber/Lyft, omni-channel routing de Zendesk/Salesforce):
//
//   1. Elegibilidad: estado_disponibilidad='disponible' + nivel jerárquico
//      suficiente para el tipo_servicio de la orden.
//   2. Entre los elegibles, ordenar por:
//        a) mayor puntaje_actual primero (mejor desempeño histórico)
//        b) menos inactividades_totales como desempate
//        c) menor tiempo_respuesta_promedio como desempate
//        d) más tiempo sin cambios (fecha_ultimo_cambio) como desempate final
//   3. Órdenes con es_urgente=true se filtran primero al nivel jerárquico más
//      alto disponible, y de ahí se aplica el mismo orden.
//
// Lee todo desde EMPLEADOS (tabla resumen ya mantenida al día por
// registrarPuntaje()/registrarInactividad() en lib/opabiz-empleados.ts) — no
// se calcula nada en vivo desde las bitácoras `puntajes`/`inactividades`.
//
// Devuelve tanto `empleadosId` (EMPLEADOS.id — para ordenes_opabiz.empleado_id,
// puntajes, inactividades) como `usuarioId` (usuarios.id — para
// historial_actividad.usuario_id) porque son dos ids distintos (ver
// lib/opabiz-empleados.ts para el detalle de por qué).
// ─────────────────────────────────────────────────────────────────────────────

type Supabase = ReturnType<typeof getSupabaseAdmin>

// Nivel mínimo requerido por tipo de servicio. Ajustar según las reglas reales
// del negocio — por defecto no restringe (cualquier nivel puede tomarlo).
const NIVEL_MINIMO_POR_SERVICIO: Record<string, NivelEmpleado> = {}

function nivelAlcanza(nivelEmpleado: string, nivelRequerido: NivelEmpleado): boolean {
  return NIVEL_ORDEN.indexOf(nivelEmpleado as NivelEmpleado) >= NIVEL_ORDEN.indexOf(nivelRequerido)
}

export interface EmpleadoElegido {
  empleadosId: string
  usuarioId: string
}

interface CandidatoEmpleado extends EmpleadoElegido {
  nivel: string
  puntajeActual: number
  inactividadesTotales: number
  tiempoRespuestaPromedio: number
  fechaUltimoCambio: string | null
}

/**
 * Elige el mejor empleado disponible para una orden nueva. `excluirEmpleadosIds`
 * son EMPLEADOS.id (no usuarios.id). Devuelve null si no hay nadie elegible.
 */
export async function pickBestEmployee(
  supabase: Supabase,
  orden: { tipoServicio: string; esUrgente: boolean },
  opts: { excluirEmpleadosIds?: string[] } = {},
): Promise<EmpleadoElegido | null> {
  const nivelRequerido = NIVEL_MINIMO_POR_SERVICIO[orden.tipoServicio] ?? 'basico'
  const excluir = new Set(opts.excluirEmpleadosIds ?? [])

  const { data } = await supabase
    .from('EMPLEADOS')
    .select('id, usuario_id, nivel, puntaje_actual, inactividades_totales, tiempo_respuesta_promedio, fecha_ultimo_cambio')
    .eq('estado_disponibilidad', 'disponible')

  if (!data || data.length === 0) return null

  let candidatos: CandidatoEmpleado[] = data
    .filter(row => !excluir.has(row.id))
    .filter(row => nivelAlcanza(row.nivel, nivelRequerido))
    .map(row => ({
      empleadosId: row.id,
      usuarioId: row.usuario_id,
      nivel: row.nivel,
      puntajeActual: row.puntaje_actual ?? 0,
      inactividadesTotales: row.inactividades_totales ?? 0,
      tiempoRespuestaPromedio: row.tiempo_respuesta_promedio ?? 0,
      fechaUltimoCambio: row.fecha_ultimo_cambio,
    }))

  if (candidatos.length === 0) return null

  // Urgente: nos quedamos solo con los del nivel jerárquico más alto presente
  // entre los candidatos, y de ahí elegimos por el mismo criterio de siempre.
  if (orden.esUrgente) {
    const nivelMax = candidatos.reduce(
      (max, c) => (NIVEL_ORDEN.indexOf(c.nivel as NivelEmpleado) > NIVEL_ORDEN.indexOf(max as NivelEmpleado) ? c.nivel : max),
      candidatos[0].nivel,
    )
    candidatos = candidatos.filter(c => c.nivel === nivelMax)
  }

  candidatos.sort((a, b) => {
    if (a.puntajeActual !== b.puntajeActual) return b.puntajeActual - a.puntajeActual
    if (a.inactividadesTotales !== b.inactividadesTotales) return a.inactividadesTotales - b.inactividadesTotales
    if (a.tiempoRespuestaPromedio !== b.tiempoRespuestaPromedio) return a.tiempoRespuestaPromedio - b.tiempoRespuestaPromedio
    const aTime = a.fechaUltimoCambio ? new Date(a.fechaUltimoCambio).getTime() : 0
    const bTime = b.fechaUltimoCambio ? new Date(b.fechaUltimoCambio).getTime() : 0
    return aTime - bTime // más viejo (o sin cambios, 0) primero
  })

  return { empleadosId: candidatos[0].empleadosId, usuarioId: candidatos[0].usuarioId }
}
