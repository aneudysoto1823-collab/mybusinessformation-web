import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { notifyAppointmentReminder } from '@/lib/opabiz-notify'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/cron/appointment-reminders — correr cada 15 min (ver
// vercel.json). Protegido con CRON_SECRET, mismo patrón que el resto de los
// crons del proyecto (ver app/api/cron/priority-filing-notice y
// app/api/opabiz/cron/reassign-timeouts).
//
// Manda push+email al empleado asignado cuando su orden tiene una
// fecha_hora_cita dentro de la próxima hora. `recordatorio_enviado` evita
// mandarlo varias veces mientras la orden siga dentro de esa ventana entre
// corridas del cron (cada 15 min, la ventana de 1h se solapa 3-4 veces).
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
  const now = new Date()
  const enUnaHora = new Date(now.getTime() + 60 * 60 * 1000)

  const { data: proximas, error } = await supabase
    .from('ordenes_opabiz')
    .select('id, empleado_id')
    .in('estado', ['asignada', 'en_progreso'])
    .eq('recordatorio_enviado', false)
    .gte('fecha_hora_cita', now.toISOString())
    .lte('fecha_hora_cita', enUnaHora.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!proximas || proximas.length === 0) {
    return NextResponse.json({ procesadas: 0 })
  }

  for (const orden of proximas) {
    await notifyAppointmentReminder(supabase, orden.empleado_id as string, orden.id as string)
    await supabase.from('ordenes_opabiz').update({ recordatorio_enviado: true }).eq('id', orden.id)
  }

  return NextResponse.json({ procesadas: proximas.length })
}
