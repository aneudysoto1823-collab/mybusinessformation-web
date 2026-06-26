// Cron nocturno Sunbiz — Bloque 1 doc 31.
//
// Que hace:
//   1. Descarga el archivo daily YYYYMMDDc.txt del SFTP publico de Florida.
//   2. Parsea el record fixed-width 1440 chars (incluye officers offset 668).
//   3. UPSERT a sunbiz_corps con TODA la data cruda + name_normalized + procesada=0.
//   4. Los triggers FTS5 mantienen el indice de busqueda al dia solos.
//
// Que NO hace:
//   - NO clasifica (Bloque 2).
//   - NO enriquece direccion/email (Bloque 3).
//   - NO deriva owner/MGR del JSON officers (Bloque 2).
//
// Disparo:
//   - Automatico via Vercel Cron (vercel.json): `0 6 * * *` UTC.
//   - Manual: curl con header Authorization: Bearer ${CRON_SECRET}.
//   - Catch-up: query param ?date=YYYYMMDD para procesar un dia especifico.

import { NextRequest, NextResponse } from 'next/server'
import { downloadDailyFile } from '@/lib/sunbiz-cron/sftp'
import { parseFile, RECORD_LEN } from '@/lib/sunbiz-cron/parser'
import { upsertBatch } from '@/lib/sunbiz-cron/upsert'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // segundos. Hobby max=60, Pro max=300. ~1500 records caben en <30s.

const ALERT_FROM = process.env.RESEND_FROM_TRANSACTIONAL || 'noreply@opabiz.com'
const ALERT_TO = process.env.INTERNAL_ALERT_EMAIL || 'alert@opabiz.com'

async function sendAlert(subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[sunbiz-daily] RESEND_API_KEY missing — alerta no enviada:', subject)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: `OpaBiz Alerts <${ALERT_FROM}>`,
        to: [ALERT_TO],
        subject: `OpaBiz Cron Sunbiz: ${subject}`,
        text: body,
      }),
    })
    if (!res.ok) console.warn('[sunbiz-daily] Resend alert fail:', res.status, await res.text())
  } catch (e) {
    console.warn('[sunbiz-daily] sendAlert exception:', e instanceof Error ? e.message : e)
  }
}

function yesterdayUtcYYYYMMDD(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const y = d.getUTCFullYear().toString().padStart(4, '0')
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = d.getUTCDate().toString().padStart(2, '0')
  return `${y}${m}${day}`
}

export async function GET(req: NextRequest) {
  const t0 = Date.now()

  // Auth: Vercel Cron agrega Authorization: Bearer ${CRON_SECRET} automatico
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dateParam = url.searchParams.get('date') || ''
  const date = dateParam || yesterdayUtcYYYYMMDD()
  if (!/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: `Invalid date format ${date}, expected YYYYMMDD` }, { status: 400 })
  }

  try {
    // Paso 1: SFTP download
    console.log(`[sunbiz-daily] downloading ${date}c.txt...`)
    const content = await downloadDailyFile(date)
    console.log(`[sunbiz-daily] downloaded ${content.length} chars (${Math.round(content.length / RECORD_LEN)} records aprox)`)

    // Paso 2: Parse
    const records = parseFile(content)
    console.log(`[sunbiz-daily] parsed ${records.length} records`)

    // Paso 3: UPSERT batch a sunbiz_corps
    const upsertResult = await upsertBatch(records)
    console.log(`[sunbiz-daily] upserted ${upsertResult.inserted} (failed: ${upsertResult.failed})`)

    const durationMs = Date.now() - t0
    const summary = {
      date,
      processed: records.length,
      inserted: upsertResult.inserted,
      failed: upsertResult.failed,
      durationMs,
      failedExamples: upsertResult.failedExamples,
    }

    if (upsertResult.failed > 0) {
      await sendAlert(
        `Parciales en ${date}: ${upsertResult.failed} fallaron`,
        `Date: ${date}\nProcessed: ${records.length}\nInserted: ${upsertResult.inserted}\nFailed: ${upsertResult.failed}\n\nExamples:\n${JSON.stringify(upsertResult.failedExamples, null, 2)}`,
      )
    }

    return NextResponse.json(summary)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error(`[sunbiz-daily] FATAL ${date}:`, err.message)
    await sendAlert(
      `FATAL al procesar ${date}`,
      `Date: ${date}\nError: ${err.message}\n\n${err.stack || ''}`,
    )
    return NextResponse.json(
      { error: err.message, date, durationMs: Date.now() - t0 },
      { status: 500 },
    )
  }
}
