import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { pickBestEmployee } from '@/lib/opabiz-assignment'
import { registrarInactividad } from '@/lib/opabiz-empleados'
import { notifyEmployeeAssignment } from '@/lib/opabiz-notify'

export const dynamic = 'force-dynamic'

// Timer de aceptación: si un empleado no pasa la orden de 'asignada' a
// 'en_progreso' dentro de esta ventana, se penaliza y se reasigna al
// siguiente mejor candidato — mismo patrón que Uber/Lyft cuando un conductor
// no responde a tiempo.
const TIMEOUT_MINUTOS = 10

// GET /api/opabiz/cron/reassign-timeouts — correr cada pocos minutos (ver
// vercel.json). Protegido con CRON_SECRET, mismo patrón que el resto de los
// crons del proyecto (ver app/api/cron/priority-filing-notice).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const limite = new Date(Date.now() - TIMEOUT_MINUTOS * 60 * 1000).toISOString()

  // orden.empleado_id acá es EMPLEADOS.id (esa es la FK real de
  // ordenes_opabiz.empleado_id) — no usuarios.id.
  const { data: vencidas, error } = await supabase
    .from('ordenes_opabiz')
    .select('id, empleado_id, tipo_servicio, es_urgente')
    .eq('estado', 'asignada')
    .lt('fecha_asignacion', limite)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!vencidas || vencidas.length === 0) {
    return NextResponse.json({ procesadas: 0 })
  }

  let reasignadas = 0
  let sinCandidato = 0

  for (const orden of vencidas) {
    const empleadosIdAnterior = orden.empleado_id as string

    // Para historial_actividad necesitamos el usuarios.id del empleado
    // anterior, no su EMPLEADOS.id (son FKs distintas).
    const { data: empAnterior } = await supabase
      .from('EMPLEADOS')
      .select('usuario_id')
      .eq('id', empleadosIdAnterior)
      .maybeSingle()
    const usuarioIdAnterior = empAnterior?.usuario_id ?? null

    await registrarInactividad(supabase, empleadosIdAnterior, orden.id, 'no_acepto_a_tiempo')

    const siguiente = await pickBestEmployee(
      supabase,
      { tipoServicio: orden.tipo_servicio, esUrgente: orden.es_urgente ?? false },
      { excluirEmpleadosIds: [empleadosIdAnterior] },
    )

    const now = new Date().toISOString()

    if (siguiente) {
      await supabase
        .from('ordenes_opabiz')
        .update({ empleado_id: siguiente.empleadosId, estado: 'asignada', fecha_asignacion: now })
        .eq('id', orden.id)

      await supabase.from('historial_actividad').insert({
        usuario_id: siguiente.usuarioId,
        order_id: orden.id,
        tipo_evento: 'reasignacion_automatica',
        detalle: `Reasignada tras ${TIMEOUT_MINUTOS} min sin respuesta del empleado anterior.`,
      })
      await notifyEmployeeAssignment(supabase, siguiente.empleadosId, orden.id)
      reasignadas++
    } else {
      // No hay nadie más disponible. ordenes_opabiz.empleado_id es NOT NULL,
      // así que no se puede vaciar — se deja el último empleado conocido (ya
      // penalizado arriba) y solo cambia `estado`, lo que la saca del filtro
      // `estado='asignada'` del cron y frena el loop de inactividades
      // repetidas cada 5 min. Queda pendiente de que un admin la reasigne a
      // mano o que alguien se marque disponible y se vuelva a intentar.
      const { error: liberarErr } = await supabase
        .from('ordenes_opabiz')
        .update({ estado: 'pendiente' })
        .eq('id', orden.id)

      if (liberarErr) {
        console.error('[opabiz/cron/reassign-timeouts] error al liberar orden sin candidato:', liberarErr.message)
      }

      if (usuarioIdAnterior) {
        await supabase.from('historial_actividad').insert({
          usuario_id: usuarioIdAnterior,
          order_id: orden.id,
          tipo_evento: 'sin_reasignar',
          detalle: `Sin respuesta tras ${TIMEOUT_MINUTOS} min y no hay otro empleado disponible elegible.`,
        })
      }
      sinCandidato++
    }
  }

  return NextResponse.json({ procesadas: vencidas.length, reasignadas, sinCandidato })
}
