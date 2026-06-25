// GET /api/sunbiz/name-check?q=<nombre>
//
// Chequeo de disponibilidad de nombre de empresa contra opabiz-sunbiz-search.
//
// Logica core en lib/sunbiz-namecheck.ts (reusada tambien desde
// /api/orders al crear la orden, para guardar el chequeo en Order.nameCheck
// y mostrarlo al admin en el email + panel).
//
// Decision de negocio 2026-06-25: este endpoint ya NO se llama desde el
// form del cliente (cero friccion, max conversion). Se mantiene para uso
// interno / debugging / posibles features futuras (admin panel, etc.).
//
// Respuesta JSON (minima, NO expone document_number ni listas completas):
//   { ok:true, tooShort?:true }  si q < 3 chars
//   { ok:true, available, exactCount, similarCount, example? }
//   { ok:false } si la DB falla
//
// Rate limit: 60 req/min/IP (Upstash sliding window).

import { NextRequest, NextResponse } from 'next/server'
import { checkNameAvailability, MIN_NAME_CHARS } from '@/lib/sunbiz-namecheck'
import { checkNameSearchRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim()

  if (q.length < MIN_NAME_CHARS) {
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

  const result = await checkNameAvailability(q)
  if (result.error === 'too_short') {
    return NextResponse.json({ ok: true, tooShort: true })
  }
  if (result.error) {
    return NextResponse.json({ ok: false, reason: 'db_error' })
  }

  return NextResponse.json({
    ok: true,
    available: result.available,
    exactCount: result.exactCount,
    example: result.example,
    similarCount: result.similarCount,
  })
}
