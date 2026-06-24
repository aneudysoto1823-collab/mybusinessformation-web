// GET /api/sunbiz/name-check?q=<nombre>
//
// Chequeo de disponibilidad de nombre de empresa contra opabiz-sunbiz-search
// (3.9M LLC/Corp ACTIVE de Florida con columna name_normalized).
//
// Llamado desde el form de checkout (debounce 300ms en el input #inp-bizname).
//
// Patron del request:
//   GET /api/sunbiz/name-check?q=Joes%20Pizza
//
// Respuesta JSON (minima, NO expone document_number ni listas completas):
//   { ok:true, tooShort?:true } si q < 3 chars
//   { ok:true, available, exactCount, similarCount, example? }
//   { ok:false } si la DB falla (degradacion silenciosa, NO bloquea el form)
//
// Politica:
//   - "available" = no existe ninguna ACTIVE con name_normalized exactamente igual
//   - "example" = un solo entity_name de muestra cuando taken (para mostrar al user)
//   - "similarCount" = matches FTS5 parciales (info, no bloquea)
//
// Rate limit: 60 req/min/IP (sliding window con Upstash) — generoso para typing
// con debounce 300ms (~10-20 req/min real) y mata scrapers.
//
// Ver: lib/sunbiz-normalize.ts (espejo del Python que pobló name_normalized).

import { NextRequest, NextResponse } from 'next/server'
import { getTurso } from '@/lib/turso'
import { normalizeName, ftsSanitize } from '@/lib/sunbiz-normalize'
import { checkNameSearchRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MIN_CHARS = 3

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim()

  if (q.length < MIN_CHARS) {
    return NextResponse.json({ ok: true, tooShort: true })
  }

  // Rate limit
  const ip = getClientIp(request)
  const rl = await checkNameSearchRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const normalized = normalizeName(q)
  if (!normalized) {
    return NextResponse.json({ ok: true, tooShort: true })
  }

  try {
    const db = getTurso()

    // Query 1 — disponibilidad: matches exactos sobre name_normalized + ACTIVE
    const exactRes = await db.execute({
      sql: "SELECT entity_name FROM sunbiz_corps WHERE name_normalized = ? AND status = 'A' LIMIT 5",
      args: [normalized],
    })
    const exactCount = exactRes.rows.length
    const example = exactCount > 0 ? String(exactRes.rows[0].entity_name) : undefined

    // Query 2 — similares con FTS5 (info, no bloquea)
    let similarCount = 0
    const ftsQuery = ftsSanitize(q)
    if (ftsQuery) {
      const simRes = await db.execute({
        sql: 'SELECT 1 FROM sunbiz_fts WHERE sunbiz_fts MATCH ? LIMIT 6',
        args: [ftsQuery],
      })
      similarCount = simRes.rows.length
    }

    return NextResponse.json({
      ok: true,
      available: exactCount === 0,
      exactCount,
      example,
      similarCount,
    })
  } catch (err) {
    console.error('[name-check] DB error:', err)
    return NextResponse.json({ ok: false, reason: 'db_error' })
  }
}
