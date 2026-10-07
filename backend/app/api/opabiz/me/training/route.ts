import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, pgErrorMessage } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { TRAINING_VERSION, TRAINING_QUIZ, readTrainingStatus } from '@/lib/opabiz-training'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/training — el agente confirma que leyó el entrenamiento.
// Se guarda dentro de empleado_perfil.datos_extra_json (ver lib/opabiz-training.ts),
// mezclando con lo que ya hubiera en ese JSON para no pisar otros datos.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || body.aceptado !== true) {
    return NextResponse.json({ error: 'Falta confirmar la lectura' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: perfil, error: readErr } = await supabase
    .from('empleado_perfil')
    .select('id, datos_extra_json')
    .eq('empleado_id', session.empleadosId)
    .maybeSingle()
  if (readErr) return NextResponse.json({ error: pgErrorMessage(readErr) }, { status: 500 })

  const prev = perfil?.datos_extra_json && typeof perfil.datos_extra_json === 'object' ? perfil.datos_extra_json as Record<string, unknown> : {}
  if (readTrainingStatus(prev).completado) {
    return NextResponse.json({ ok: true, alreadyCompleted: true })
  }
  // Las respuestas se corrigen acá, no se confía en un puntaje calculado en
  // el navegador. `respuestas` = índice elegido por pregunta, en orden.
  const total = TRAINING_QUIZ.es.length
  const respuestas: unknown[] = Array.isArray(body.respuestas) ? body.respuestas : []
  if (respuestas.length !== total) {
    return NextResponse.json({ error: 'Faltan respuestas' }, { status: 400 })
  }
  const correctas = TRAINING_QUIZ.es.filter((q, i) => Number(respuestas[i]) === q.correcta).length
  const datos = { ...prev, entrenamiento: { version: TRAINING_VERSION, aceptadoAt: new Date().toISOString(), quiz: { correctas, total } } }

  const { error } = perfil
    ? await supabase.from('empleado_perfil').update({ datos_extra_json: datos }).eq('id', perfil.id)
    : await supabase.from('empleado_perfil').insert({ empleado_id: session.empleadosId, datos_extra_json: datos })
  if (error) return NextResponse.json({ error: pgErrorMessage(error) }, { status: 500 })

  return NextResponse.json({ ok: true })
}
