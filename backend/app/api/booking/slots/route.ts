import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Slots: 9:00am – 7:00pm, cada 40 min (30 cita + 10 buffer) = 15 slots
const ALL_SLOTS = [
  '09:00','09:40','10:20','11:00','11:40',
  '12:20','13:00','13:40','14:20','15:00',
  '15:40','16:20','17:00','17:40','18:20',
]

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  // Validar que no sea domingo (0) — Lun-Sáb permitidos
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  if (dayOfWeek === 0) return NextResponse.json({ slots: [] })

  const supabase = getSupabaseAdmin()

  // Citas ya reservadas en esa fecha
  const { data: booked } = await supabase
    .from('appointments')
    .select('time')
    .eq('date', date)
    .neq('status', 'cancelled')

  const bookedTimes = new Set((booked ?? []).map((a: { time: string }) => a.time))

  // Slots bloqueados en esa fecha
  const { data: blocked } = await supabase
    .from('blocked_slots')
    .select('time')
    .eq('date', date)

  const blockedTimes = new Set((blocked ?? []).map((b: { time: string | null }) => b.time))
  const fullDayBlocked = (blocked ?? []).some((b: { time: string | null }) => b.time === null)

  if (fullDayBlocked) return NextResponse.json({ slots: [] })

  // No mostrar slots que ya pasaron hoy
  const now = new Date()
  const isToday = date === now.toISOString().split('T')[0]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const available = ALL_SLOTS.filter(slot => {
    if (bookedTimes.has(slot)) return false
    if (blockedTimes.has(slot)) return false
    if (isToday) {
      const [h, m] = slot.split(':').map(Number)
      if (h * 60 + m <= currentMinutes + 60) return false // al menos 1h de anticipación
    }
    return true
  })

  return NextResponse.json({ slots: available })
}
