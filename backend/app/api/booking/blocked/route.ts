import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function isAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await getSupabaseAdmin()
    .from('blocked_slots')
    .select('*')
    .order('date', { ascending: true })
  return NextResponse.json(data ?? [])
}

// Body: { weekday, time?, reason? } para un bloqueo recurrente por día de la
// semana (0=domingo…6=sábado, date queda null) — "active" empieza en true y
// se apaga/prende desde el toggle del panel (PATCH [id]) sin borrar la regla.
// O: { dates: string[], time?, reason? } para una o varias fechas puntuales
// (el cliente ya expande el rango "desde/hasta" a fechas individuales antes
// de mandarlas, así un solo POST inserta todas de una vez).
export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const time = body.time || null
  const reason = body.reason || null

  if (typeof body.weekday === 'number') {
    if (body.weekday < 0 || body.weekday > 6) {
      return NextResponse.json({ error: 'weekday debe estar entre 0 y 6' }, { status: 400 })
    }
    const { data, error } = await getSupabaseAdmin()
      .from('blocked_slots')
      .insert({ date: null, weekday: body.weekday, time, reason, active: true })
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const dates: string[] = Array.isArray(body.dates) ? body.dates : []
  if (dates.length === 0) return NextResponse.json({ error: 'dates required' }, { status: 400 })

  const rows = dates.map((date: string) => ({ date, weekday: null, time, reason, active: true }))
  const { data, error } = await getSupabaseAdmin()
    .from('blocked_slots')
    .insert(rows)
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
