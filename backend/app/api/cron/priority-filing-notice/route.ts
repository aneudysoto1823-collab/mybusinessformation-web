// Cron: auto-envía el email "Orden Procesada" (A5, sendOrderProcessed) para
// órdenes de formación con servicio Priority/Expedited, si el staff todavía no
// lo mandó manualmente (botón "Filed" del admin) dentro de las primeras ~24h.
//
// Por qué existe: para Standard, ese email sigue siendo 100% manual (el staff
// lo dispara al procesar la orden, sin apuro). Para Priority, el cliente pagó
// por velocidad — el compromiso interno es tener el filing listo en ~24h, así
// que si el staff se olvidó de marcar "Filed", el cliente igual debe enterarse
// de que su trámite avanzó, sin esperar a que alguien lo note.
//
// Reglas de día/horario (decisión founder 2026-07-09, extendidas 2026-07-12
// para considerar fines de semana y feriados — Sunbiz no procesa esos días):
//   1. objetivo naive = paidAt + 24h (día calendario siguiente al pago)
//   2. si ese día no es hábil (fin de semana o feriado del Estado de Florida),
//      se corre al próximo día hábil (ej. pagó viernes -> se manda el lunes;
//      pagó el día antes de un feriado -> se manda el siguiente día normal,
//      saltando el feriado).
//   3. CASO ESPECIAL: si el pago ocurrió EN un feriado y el día siguiente ya
//      es hábil, se entrega ese día siguiente pero al FINAL del día (4:00pm
//      hora de Florida) en vez de la hora que tocaría normalmente — le da al
//      staff casi todo ese día hábil de margen antes de que el cron dispare
//      solo (hay muy poco colchón porque el feriado es de un solo día).
//   4. Para el resto de los casos (día hábil normal, ya sea el naive u otro
//      corrido por la regla 2): si el horario resultante cae en horario
//      diurno (9am–6pm hora de Florida) se adelanta 1 hora; si cae de noche/
//      madrugada, se entrega a las 6pm hora de Florida de ese mismo día hábil.
//
// Feriados considerados: los 10 feriados oficiales del Estado de Florida
// (Florida Statute 110.117) — New Year's Day, MLK Day, Memorial Day,
// Juneteenth, Independence Day, Labor Day, Veterans Day, Thanksgiving Day +
// el viernes siguiente, Christmas Day. Calculados por regla (no fechas fijas
// hardcodeadas), así siguen siendo correctos en años futuros sin mantenimiento.
//
// Disparo: Vercel Cron (vercel.json) cada 30 min. Manual: curl con header
// Authorization: Bearer ${CRON_SECRET}.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendOrderProcessed } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const TZ = 'America/New_York'
const DAY_START_HOUR = 9
const DAY_END_HOUR = 18 // 6pm
const HOLIDAY_EOD_HOUR = 16 // 4pm — entrega de fin de día cuando se pagó un feriado

function localHour(at: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, hour: '2-digit' }).format(at),
    10
  ) % 24
}

function localMinute(at: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, minute: '2-digit' }).format(at),
    10
  )
}

// Offset de TZ respecto a UTC en horas (ej. -4 en horario de verano, -5 en invierno).
function tzOffsetHours(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
  const asIfUtc = Date.UTC(
    Number(get('year')), Number(get('month')) - 1, Number(get('day')),
    Number(get('hour')), Number(get('minute')), Number(get('second'))
  )
  return Math.round((asIfUtc - at.getTime()) / 3600000)
}

// ── Helpers de fecha calendario (YYYY-MM-DD, sin hora) en TZ ─────────────────
function ymdInTz(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=domingo .. 6=sábado
}

function isWeekend(ymd: string): boolean {
  const wd = weekdayOfYmd(ymd)
  return wd === 0 || wd === 6
}

// Construye el instante UTC correspondiente a una hora:minuto local (TZ) de un
// YYYY-MM-DD dado. Corrige el offset real de esa fecha (DST-safe).
function dateAtLocalTime(ymd: string, hour: number, minute: number): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  const approx = new Date(Date.UTC(y, m - 1, d, hour, minute, 0))
  const offset = tzOffsetHours(approx)
  return new Date(Date.UTC(y, m - 1, d, hour - offset, minute, 0))
}

// n-ésimo <weekday> (0=domingo..6=sábado) de un mes. month1 = 1-12.
function nthWeekdayYmd(year: number, month1: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month1 - 1, 1))
  const firstWeekday = first.getUTCDay()
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// último <weekday> de un mes.
function lastWeekdayYmd(year: number, month1: number, weekday: number): string {
  const lastDayNum = new Date(Date.UTC(year, month1, 0)).getUTCDate()
  const last = new Date(Date.UTC(year, month1 - 1, lastDayNum))
  const lastWeekday = last.getUTCDay()
  const day = lastDayNum - ((lastWeekday - weekday + 7) % 7)
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Feriados oficiales del Estado de Florida (Florida Statute 110.117). NO
// incluye Presidents Day ni Columbus Day — Florida no los observa.
function floridaHolidaysForYear(year: number): Set<string> {
  const h = new Set<string>()
  h.add(`${year}-01-01`) // New Year's Day
  h.add(nthWeekdayYmd(year, 1, 1, 3)) // MLK Day — 3er lunes de enero
  h.add(lastWeekdayYmd(year, 5, 1)) // Memorial Day — último lunes de mayo
  h.add(`${year}-06-19`) // Juneteenth
  h.add(`${year}-07-04`) // Independence Day
  h.add(nthWeekdayYmd(year, 9, 1, 1)) // Labor Day — 1er lunes de septiembre
  h.add(`${year}-11-11`) // Veterans Day
  const thanksgiving = nthWeekdayYmd(year, 11, 4, 4) // 4to jueves de noviembre
  h.add(thanksgiving)
  h.add(addDaysYmd(thanksgiving, 1)) // viernes siguiente a Thanksgiving
  h.add(`${year}-12-25`) // Christmas Day
  return h
}

function isFloridaHoliday(ymd: string): boolean {
  return floridaHolidaysForYear(Number(ymd.slice(0, 4))).has(ymd)
}

function isBusinessDay(ymd: string): boolean {
  return !isWeekend(ymd) && !isFloridaHoliday(ymd)
}

function nextBusinessDayYmd(ymd: string): string {
  let d = addDaysYmd(ymd, 1)
  while (!isBusinessDay(d)) d = addDaysYmd(d, 1)
  return d
}

// Calcula el momento exacto de envío según las reglas del comentario de arriba.
function computeSendTime(paidAt: Date): Date {
  const paidYmd = ymdInTz(paidAt)
  const targetYmd = nextBusinessDayYmd(paidYmd)

  // Caso especial: pagó UN feriado y el día siguiente ya es hábil -> entrega
  // de fin de día (4pm FL) en vez de la hora que tocaría normalmente.
  if (isFloridaHoliday(paidYmd) && targetYmd === addDaysYmd(paidYmd, 1)) {
    return dateAtLocalTime(targetYmd, HOLIDAY_EOD_HOUR, 0)
  }

  // Caso normal: mismo horario de siempre (adelanta 1h si el objetivo natural
  // +24h cae en horario diurno; si no, 6pm), anclado al día hábil que
  // corresponda (targetYmd) en vez del día calendario crudo de +24h.
  const naiveTarget = new Date(paidAt.getTime() + 24 * 60 * 60 * 1000)
  const hour = localHour(naiveTarget)

  if (hour >= DAY_START_HOUR && hour < DAY_END_HOUR) {
    return dateAtLocalTime(targetYmd, hour - 1, localMinute(naiveTarget))
  }
  return dateAtLocalTime(targetYmd, DAY_END_HOUR, 0)
}

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

  // Candidatas: formación (no 'services'), Priority/Expedited, ya pagadas,
  // sin el email de "Orden Procesada" enviado todavía, y que el staff aún no
  // haya avanzado el estado más allá de donde este email tiene sentido.
  const { data: candidates, error } = await supabase
    .from('Order')
    .select('id, firstName, lastName, email, companyName, entityType, package, speed, addons, paidAt, status, unsubscribed')
    .eq('speed', 'expedited')
    .neq('package', 'services')
    .not('paidAt', 'is', null)
    .is('orderProcessedEmailSentAt', null)
    .in('status', ['in_review', 'ready_to_file'])

  if (error) {
    console.error('[cron/priority-filing-notice] query error:', error)
    return NextResponse.json({ error: 'Query failed', detail: error.message }, { status: 500 })
  }

  const results: { id: string; sent: boolean; reason?: string }[] = []

  for (const order of candidates ?? []) {
    const paidAt = order.paidAt ? new Date(order.paidAt as string) : null
    if (!paidAt) { results.push({ id: order.id, sent: false, reason: 'no paidAt' }); continue }

    const sendAt = computeSendTime(paidAt)
    if (now < sendAt) { results.push({ id: order.id, sent: false, reason: 'not yet due' }); continue }

    try {
      await sendOrderProcessed({
        id: order.id,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        companyName: order.companyName,
        entityType: order.entityType ?? undefined,
        package: order.package,
        speed: order.speed ?? undefined,
        addons: (order.addons ?? null) as Record<string, boolean> | null,
        unsubscribed: order.unsubscribed ?? false,
        // Sin columna de idioma para órdenes de formación todavía -> default EN,
        // igual que el envío manual desde el admin hoy.
        lang: 'en',
      })
      await supabase.from('Order').update({ orderProcessedEmailSentAt: now.toISOString() }).eq('id', order.id)
      results.push({ id: order.id, sent: true })
    } catch (e) {
      console.error('[cron/priority-filing-notice] send error for', order.id, e)
      results.push({ id: order.id, sent: false, reason: 'send error' })
    }
  }

  return NextResponse.json({ checked: candidates?.length ?? 0, sent: results.filter(r => r.sent).length, results })
}
