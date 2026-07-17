// Endpoint del Bloque 3 (doc 31): enriquecer N leads clase A con Google Address Validation.
//
// Recibe: { n: 300, score: 'A' }
// Hace en orden:
//   1. SELECT N leads en marketing_leads con:
//      - score = X (default 'A')
//      - address_validated IS NULL (no enriquecidos todavia)
//      - has_good_address IS NULL or has_good_address = 1 (los que Haiku vio con direccion completa)
//      - ORDER BY filing_date DESC (regla de oro: los mas nuevos primero)
//   2. Para cada uno, llama Google Address Validation. Actualiza:
//      - address_validated (0/1)
//      - address_validation_json (respuesta cruda)
//      - address_type (sobreescribe el de Haiku con el de Google, mas confiable)
//      - enriched_at, enrichment_cost_usd
//   3. LOG en block_runs.
//
// Devuelve: { enriched, validated_count, invalid_count, elapsed_ms, run_id }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { validateAddress, GOOGLE_ADDR_COST_PER_LEAD_USD, type ValidationResult } from '@/lib/google-address'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_N = 500

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

  // Log de corrida inicia — trazabilidad aunque falle
  const runIns = await marketing.execute({
    sql: `INSERT INTO block_runs (block, n_requested, status) VALUES ('enrich', ?, 'running')`,
    args: [n],
  })
  const runId = Number(runIns.lastInsertRowid)

  // Traer los N candidatos: score=X, address_validated IS NULL, NO descartados, has_good_address ok
  const candidatesRes = await marketing.execute({
    sql: `SELECT document_number, entity_name,
                 principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country
          FROM marketing_leads
          WHERE score = ?
            AND descartada = 0
            AND address_validated IS NULL
            AND (has_good_address IS NULL OR has_good_address = 1)
            AND principal_addr1 IS NOT NULL
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
      enriched: 0, validated_count: 0, invalid_count: 0,
      elapsed_ms: Date.now() - started, run_id: runId,
      note: `no hay leads score=${score} sin enriquecer`,
    })
  }

  let validated = 0
  let invalid = 0
  const addressTypeDist = {} as Record<string, number>
  let apiErrorCount = 0
  let lastApiError: string | null = null

  for (const row of candidatesRes.rows) {
    let result: ValidationResult
    try {
      result = await validateAddress({
        addr1: row.principal_addr1 as string | null,
        addr2: row.principal_addr2 as string | null,
        city: row.principal_city as string | null,
        state: row.principal_state as string | null,
        zip: row.principal_zip as string | null,
        country: row.principal_country as string | null,
      })
    } catch (e) {
      result = {
        is_valid: false, address_type: 'unknown', granularity: null,
        address_complete: false, has_unconfirmed: false, has_inferred: false,
        raw: null, error: e instanceof Error ? e.message : String(e),
      }
    }

    if (result.error) {
      apiErrorCount += 1
      lastApiError = result.error
    }
    if (result.is_valid) validated += 1; else invalid += 1
    addressTypeDist[result.address_type] = (addressTypeDist[result.address_type] || 0) + 1

    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET address_validated = ?,
                address_validation_json = ?,
                address_type = ?,
                enriched_at = datetime('now'),
                enrichment_cost_usd = ?
            WHERE document_number = ?`,
      args: [
        result.is_valid ? 1 : 0,
        JSON.stringify(result),
        result.address_type,
        GOOGLE_ADDR_COST_PER_LEAD_USD,
        row.document_number as string,
      ],
    })
  }

  const enriched = candidatesRes.rows.length
  await marketing.execute({
    sql: `UPDATE block_runs SET n_processed = ?, status = ?, finished_at = datetime('now'),
          result_summary = ?, error_message = ? WHERE id = ?`,
    args: [
      enriched,
      apiErrorCount === enriched ? 'error' : 'ok',
      JSON.stringify({ enriched, validated, invalid, address_types: addressTypeDist, score, api_errors: apiErrorCount }),
      lastApiError,
      runId,
    ],
  })

  return NextResponse.json({
    enriched,
    validated_count: validated,
    invalid_count: invalid,
    address_type_distribution: addressTypeDist,
    api_error_count: apiErrorCount,
    last_api_error: lastApiError,
    elapsed_ms: Date.now() - started,
    run_id: runId,
  })
}

// GET: stats para el panel del Bloque 3
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
                          WHERE score IS NOT NULL AND address_validated IS NULL
                          AND descartada = 0
                          AND (has_good_address IS NULL OR has_good_address = 1)
                          AND principal_addr1 IS NOT NULL
                          GROUP BY score`),
      marketing.execute(`SELECT * FROM block_runs WHERE block = 'enrich' ORDER BY started_at DESC LIMIT 1`),
      marketing.execute(`SELECT
        SUM(CASE WHEN address_validated IS NOT NULL THEN 1 ELSE 0 END) as enriched,
        SUM(CASE WHEN address_validated = 1 THEN 1 ELSE 0 END) as valid_addresses,
        SUM(CASE WHEN address_validated = 0 THEN 1 ELSE 0 END) as invalid_addresses,
        SUM(CASE WHEN address_type = 'residential' THEN 1 ELSE 0 END) as residential,
        SUM(CASE WHEN address_type = 'commercial' THEN 1 ELSE 0 END) as commercial,
        SUM(CASE WHEN address_type = 'poBox' THEN 1 ELSE 0 END) as pobox,
        SUM(CASE WHEN address_type = 'virtual' THEN 1 ELSE 0 END) as virtual
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
        enriched: Number(totals.rows[0]?.enriched ?? 0),
        valid_addresses: Number(totals.rows[0]?.valid_addresses ?? 0),
        invalid_addresses: Number(totals.rows[0]?.invalid_addresses ?? 0),
        residential: Number(totals.rows[0]?.residential ?? 0),
        commercial: Number(totals.rows[0]?.commercial ?? 0),
        pobox: Number(totals.rows[0]?.pobox ?? 0),
        virtual: Number(totals.rows[0]?.virtual ?? 0),
      },
      last_run: lastRun.rows[0] ?? null,
      max_n: MAX_N,
      cost_per_lead_usd: GOOGLE_ADDR_COST_PER_LEAD_USD,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'db error: ' + msg)
  }
}
