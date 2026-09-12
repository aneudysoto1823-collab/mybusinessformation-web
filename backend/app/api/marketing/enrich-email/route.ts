// Endpoint del Bloque 3.5 (doc 31): buscar email/telefono de N leads con
// Enformion (EnformionGO — Contact Enrichment API). Corre DESPUES del Bloque 3
// de direccion (/api/marketing/enrich) — mismo principio de "barato antes que
// caro": solo se busca email en leads que YA tienen address_validated=1
// (nunca se paga por buscar el email de un lead con direccion mala/descartada).
//
// Recibe: { n: 300, score: 'A' }
// Hace en orden:
//   1. SELECT N leads en marketing_leads con:
//      - score = X (default 'A')
//      - descartada = 0
//      - address_validated = 1 (el Bloque 3 de direccion ya corrio y aprobo)
//      - email IS NULL (no enriquecidos todavia)
//      - ORDER BY filing_date DESC (regla de oro: los mas nuevos primero)
//   2. Para cada uno, extrae el primer officer tipo persona (P) de officers_json
//      y llama Enformion Contact Enrichment con nombre + target address.
//   3. UPDATE: email, email_is_business, email_validated, phone,
//      identity_score, email_enriched_at, enrichment_email_cost_usd.
//   4. LOG en block_runs (block='enrich_email').
//
// Devuelve: { enriched, found_count, not_found_count, elapsed_ms, run_id }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { enrichContact, ENFORMION_COST_PER_LEAD_USD } from '@/lib/enformion'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_N = 500

type OfficerRecord = { first_name?: string; last_name?: string; type?: string }

// Primer officer tipo persona (P) — mismo criterio que firstPersonOfficerName()
// en send-to-letters/route.ts, pero acá necesitamos first_name/last_name
// separados (Enformion los pide como campos distintos, no un nombre combinado).
function firstPersonOfficer(officersJson: string | null): { firstName: string; lastName: string } | null {
  if (!officersJson) return null
  try {
    const officers = JSON.parse(officersJson) as OfficerRecord[]
    const p = officers.find(o => o.type === 'P' && o.first_name && o.last_name)
    if (!p || !p.first_name || !p.last_name) return null
    return { firstName: p.first_name, lastName: p.last_name }
  } catch {
    return null
  }
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: Request) {
  const started = Date.now()

  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  let body: { n?: number; score?: string }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  const n = Number(body.n)
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
    return jsonError(400, `n debe ser un entero entre 1 y ${MAX_N}`)
  }
  const score = ['A', 'B', 'C'].includes(String(body.score)) ? String(body.score) : 'A'

  let marketing
  try {
    marketing = getMarketingClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'config invalida: ' + msg)
  }

  const runIns = await marketing.execute({
    sql: `INSERT INTO block_runs (block, n_requested, status) VALUES ('enrich_email', ?, 'running')`,
    args: [n],
  })
  const runId = Number(runIns.lastInsertRowid)

  const candidatesRes = await marketing.execute({
    sql: `SELECT document_number, officers_json, target_addr1, target_city, target_state
          FROM marketing_leads
          WHERE score = ?
            AND descartada = 0
            AND address_validated = 1
            AND email IS NULL
            AND officers_json IS NOT NULL
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [score, n],
  })

  if (candidatesRes.rows.length === 0) {
    await marketing.execute({
      sql: `UPDATE block_runs SET n_processed = 0, status = 'ok', finished_at = datetime('now'),
            result_summary = ? WHERE id = ?`,
      args: [JSON.stringify({ note: 'no candidates', score }), runId],
    })
    return NextResponse.json({
      enriched: 0, found_count: 0, not_found_count: 0,
      elapsed_ms: Date.now() - started, run_id: runId,
      note: `no hay leads score=${score} con direccion validada y sin email`,
    })
  }

  let found = 0
  let notFound = 0
  let apiErrorCount = 0
  let lastApiError: string | null = null
  let skippedNoOfficer = 0

  for (const row of candidatesRes.rows) {
    const officer = firstPersonOfficer(row.officers_json as string | null)
    if (!officer) { skippedNoOfficer += 1; continue }

    const result = await enrichContact({
      firstName: officer.firstName,
      lastName: officer.lastName,
      addr1: row.target_addr1 as string | null,
      // Enformion espera "Ciudad, Estado" en addressLine2 (ver ejemplo oficial
      // de la doc: "1234 Q Street" / "Sacramento, CA") — no es la misma
      // semantica que target_addr2 (apt/unit) que usa Google Address.
      addr2: [row.target_city, row.target_state].filter(Boolean).join(', ') || null,
    })

    if (result.error) {
      apiErrorCount += 1
      lastApiError = result.error
    }
    if (result.found) found += 1; else notFound += 1

    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET email = ?,
                email_is_business = ?,
                email_validated = ?,
                email_validation_source = ?,
                phone = ?,
                identity_score = ?,
                email_enriched_at = datetime('now'),
                enrichment_email_cost_usd = ?
            WHERE document_number = ?`,
      args: [
        result.email,
        result.email_is_business === null ? null : (result.email_is_business ? 1 : 0),
        result.email_validated === null ? null : (result.email_validated ? 1 : 0),
        // email_validation_source: columna que ya existia en el diseño original
        // de la tabla (planeada para Enformion/ZeroBounce) — solo se setea
        // cuando de verdad se encontro un email, para no pisarla con 'enformion'
        // en un intento fallido.
        result.email ? 'enformion' : null,
        result.phone,
        result.identity_score,
        ENFORMION_COST_PER_LEAD_USD,
        row.document_number as string,
      ],
    })
  }

  const enriched = candidatesRes.rows.length - skippedNoOfficer
  await marketing.execute({
    sql: `UPDATE block_runs SET n_processed = ?, status = ?, finished_at = datetime('now'),
          result_summary = ?, error_message = ? WHERE id = ?`,
    args: [
      enriched,
      apiErrorCount === enriched && enriched > 0 ? 'error' : 'ok',
      JSON.stringify({ enriched, found, not_found: notFound, skipped_no_officer: skippedNoOfficer, score, api_errors: apiErrorCount }),
      lastApiError,
      runId,
    ],
  })

  return NextResponse.json({
    enriched,
    found_count: found,
    not_found_count: notFound,
    skipped_no_officer: skippedNoOfficer,
    api_error_count: apiErrorCount,
    last_api_error: lastApiError,
    elapsed_ms: Date.now() - started,
    run_id: runId,
  })
}

// GET: stats para el panel del Bloque 3.5. Para ver el LISTADO real de leads
// (no solo el numero), usar GET /api/marketing/leads?view=validated — el
// explorador general de leads del panel, con filtros de fecha/score/estado.
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  let marketing
  try {
    marketing = getMarketingClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'config invalida: ' + msg)
  }

  try {
    const [pendingByScore, lastRun, totals] = await Promise.all([
      marketing.execute(`SELECT score, COUNT(*) as n FROM marketing_leads
                          WHERE score IS NOT NULL AND address_validated = 1
                          AND descartada = 0 AND email IS NULL
                          GROUP BY score`),
      marketing.execute(`SELECT * FROM block_runs WHERE block = 'enrich_email' ORDER BY started_at DESC LIMIT 1`),
      marketing.execute(`SELECT
        SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) as with_email,
        SUM(CASE WHEN email_enriched_at IS NOT NULL AND email IS NULL THEN 1 ELSE 0 END) as tried_not_found
        FROM marketing_leads`),
    ])

    const byScore = { A: 0, B: 0, C: 0 } as Record<string, number>
    for (const r of pendingByScore.rows) {
      const s = String(r.score ?? '')
      if (s in byScore) byScore[s] = Number(r.n)
    }

    return NextResponse.json({
      pending_by_score: byScore,
      totals: {
        with_email: Number(totals.rows[0]?.with_email ?? 0),
        tried_not_found: Number(totals.rows[0]?.tried_not_found ?? 0),
        // Total de busquedas REALES contra Enformion (encontro o no encontro
        // email, en ambos casos se cobra el request) — pedido founder
        // 2026-09-12 para poder cotejar contra lo que factura Enformion.
        total_searches: Number(totals.rows[0]?.with_email ?? 0) + Number(totals.rows[0]?.tried_not_found ?? 0),
      },
      last_run: lastRun.rows[0] ?? null,
      max_n: MAX_N,
      cost_per_lead_usd: ENFORMION_COST_PER_LEAD_USD,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'db error: ' + msg)
  }
}
