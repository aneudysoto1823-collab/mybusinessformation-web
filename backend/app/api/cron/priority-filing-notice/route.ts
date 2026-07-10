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
// Regla de horario (decisión founder 2026-07-09): no mandar a las 24h EXACTAS
// si eso cae de noche.
//   1. objetivo = paidAt + 24h
//   2. si el objetivo cae en horario diurno (9am–6pm hora de Florida) ->
//      se adelanta 1 hora (para que no sea siempre un patrón exacto de 24h)
//   3. si el objetivo cae fuera de ese horario (noche/madrugada) -> se manda
//      a las 6pm hora de Florida del mismo día calendario del objetivo, en
//      vez de esperar a la hora nocturna exacta.
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

function localHour(at: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, hour: '2-digit' }).format(at),
    10
  ) % 24
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

// Calcula el momento exacto de envío según la regla de horario de arriba.
function computeSendTime(paidAt: Date): Date {
  const naiveTarget = new Date(paidAt.getTime() + 24 * 60 * 60 * 1000)
  const hour = localHour(naiveTarget)

  if (hour >= DAY_START_HOUR && hour < DAY_END_HOUR) {
    return new Date(naiveTarget.getTime() - 60 * 60 * 1000)
  }

  // Cae de noche/madrugada: entregar a las 6pm hora de FL del mismo día
  // calendario que el objetivo (no el día en que corre el cron).
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(naiveTarget)
  const [y, m, d] = ymd.split('-').map(Number)
  const offset = tzOffsetHours(naiveTarget)
  return new Date(Date.UTC(y, m - 1, d, DAY_END_HOUR - offset, 0, 0))
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
