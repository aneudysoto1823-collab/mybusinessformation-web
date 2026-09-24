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
//   4. Si el email se encontró Y esta LLC ya estaba en Campaigns & Letters
//      (Supabase prospective_companies, enviada antes solo con la carta —
//      las cartas no necesitan email), sincroniza el email ahí mismo, sin
//      que el staff tenga que "reenviar" nada. Nunca pisa un email que ya
//      estuviera cargado a mano. (feedback founder 2026-09-12: a esta
//      escala no hay forma de llevar la cuenta de a cuáles ya se les
//      mandó carta para "reenviarles" el email después.)
//   5. LOG en block_runs (block='enrich_email').
//
// Devuelve: { enriched, found_count, not_found_count, elapsed_ms, run_id }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enrichContact, firstPersonOfficer, ENFORMION_COST_PER_LEAD_USD } from '@/lib/enformion'
import { validateEnformionEmail } from '@/lib/zerobounce'

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

  let body: { n?: number; score?: string; date_from?: string; date_to?: string; min_score?: number }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  const n = Number(body.n)
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
    return jsonError(400, `n debe ser un entero entre 1 y ${MAX_N}`)
  }
  const score = ['A', 'B', 'C'].includes(String(body.score)) ? String(body.score) : 'A'

  // % Precisión — obligatorio, sin default a propósito (decisión founder
  // 2026-09-14): Enformion no permite pedir esto de antemano en el request
  // (confirmado contra su documentación), así que el gate es nuestro y debe
  // estar siempre presente antes de gastar en una búsqueda real.
  const minScore = Number(body.min_score)
  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
    return jsonError(400, 'min_score (% Precisión) es requerido: un número entre 0 y 100')
  }
  const dateFrom = typeof body.date_from === 'string' && body.date_from ? body.date_from : null
  const dateTo   = typeof body.date_to === 'string' && body.date_to ? body.date_to : null

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

  // email_enriched_at IS NULL es lo que evita pagarle a Enformion DOS VECES
  // por el mismo lead — antes solo se chequeaba email IS NULL, así que un
  // lead sin match (email sigue null, pero YA se intentó) volvía a
  // ofrecerse en la próxima corrida y se re-cobraba (bug real 2026-09-12).
  const dateFilterSql = [
    dateFrom ? 'AND filing_date >= ?' : '',
    dateTo   ? 'AND filing_date <= ?' : '',
  ].filter(Boolean).join(' ')
  const dateFilterArgs = [dateFrom, dateTo].filter((v): v is string => v !== null)

  // target_addr1 IS NOT NULL (+ TRIM != '') es el mismo guard que ya usa
  // /api/marketing/enrich (Bloque 3, dirección) — sin esto, leads viejas con
  // address_validated=1 pero target_addr1 en NULL (datos inconsistentes de
  // pruebas anteriores) pasaban el filtro y reventaban adentro de
  // enrichContact() con "faltan datos minimos" (bug real 2026-09-12, 27 de
  // 36 en un batch real).
  const candidatesRes = await marketing.execute({
    sql: `SELECT document_number, officers_json, target_addr1, target_city, target_state
          FROM marketing_leads
          WHERE score = ?
            AND descartada = 0
            AND address_validated = 1
            AND email IS NULL
            AND email_enriched_at IS NULL
            AND officers_json IS NOT NULL
            AND target_addr1 IS NOT NULL AND TRIM(target_addr1) != ''
            ${dateFilterSql}
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [score, ...dateFilterArgs, n],
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
  let belowThreshold = 0
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

    // % Precisión — cambio 2026-09-14 (misma noche): ya NO gatea si se
    // guarda o se sincroniza el match, solo el conteo de reporte
    // (found vs belowThreshold) que se ve en este panel. Un match débil se
    // guarda igual (con su identity_score real) — la decisión de a quién
    // emailear vs a quién imprimirle la carta se toma después en Campaigns &
    // Letters, con su propio filtro de precisión independiente. Decisión
    // founder: "no importa que tengan email, si el rating es bajo quiero
    // poder mandarles la carta igual".
    const meetsReportThreshold = result.found && typeof result.identity_score === 'number' && result.identity_score >= minScore
    if (result.found && !meetsReportThreshold) belowThreshold += 1
    if (meetsReportThreshold) found += 1; else if (!result.found) notFound += 1

    // ZeroBounce (auditoría 2026-09-13/14, punto 2): valida de verdad el
    // buzón que Enformion encontró (MX+SMTP probe) — no es lo mismo que el
    // isValidated que Enformion reporta sobre sí mismo. Si ZeroBounce está
    // dormido, cae al dato de Enformion (cero cambio de comportamiento).
    let emailValidated = result.email_validated
    let emailValidationSource: 'zerobounce' | 'enformion' | null = result.email ? 'enformion' : null
    if (result.email) {
      const zb = await validateEnformionEmail(result.email, result.email_validated)
      emailValidated = zb.validated
      emailValidationSource = zb.source
    }

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
        emailValidated === null ? null : (emailValidated ? 1 : 0),
        emailValidationSource,
        result.phone,
        result.identity_score,
        ENFORMION_COST_PER_LEAD_USD,
        row.document_number as string,
      ],
    })

    // Sincroniza el email + identity_score a Campaigns & Letters SI esa
    // empresa ya está ahí (se le mandó carta antes, sin email porque las
    // cartas no lo necesitan). Nunca crea una fila nueva acá — eso lo sigue
    // haciendo send-to-letters cuando corresponda. Nunca pisa un email ya
    // cargado (a mano o de una corrida anterior). Best-effort: si Supabase
    // falla, no aborta el resto de la corrida (el email ya quedó guardado en
    // Turso de todas formas). Siempre, sin importar el % de precisión.
    //
    // email_deliverable solo se manda cuando la fuente es 'zerobounce' de
    // verdad (una prueba real) — si quedó en 'enformion' (ZeroBounce
    // dormido), no escribimos nada acá, para no hacerle creer a Campaigns &
    // Letters que hubo una validación real cuando no la hubo.
    if (result.email) {
      try {
        const payload: Record<string, unknown> = { email: result.email, identity_score: result.identity_score }
        if (emailValidationSource === 'zerobounce') payload.email_deliverable = emailValidated
        await getSupabaseAdmin()
          .from('prospective_companies')
          .update(payload)
          .eq('document_id', (row.document_number as string).toUpperCase())
          .is('email', null)
      } catch (e) {
        console.error('[enrich-email] sync a prospective_companies fallo (no fatal):', e)
      }
    }
  }

  const enriched = candidatesRes.rows.length - skippedNoOfficer
  await marketing.execute({
    sql: `UPDATE block_runs SET n_processed = ?, status = ?, finished_at = datetime('now'),
          result_summary = ?, error_message = ? WHERE id = ?`,
    args: [
      enriched,
      apiErrorCount === enriched && enriched > 0 ? 'error' : 'ok',
      JSON.stringify({ enriched, found, not_found: notFound, below_threshold: belowThreshold, min_score: minScore, skipped_no_officer: skippedNoOfficer, score, api_errors: apiErrorCount }),
      lastApiError,
      runId,
    ],
  })

  return NextResponse.json({
    enriched,
    found_count: found,
    not_found_count: notFound,
    below_threshold_count: belowThreshold,
    min_score: minScore,
    skipped_no_officer: skippedNoOfficer,
    api_error_count: apiErrorCount,
    last_api_error: lastApiError,
    elapsed_ms: Date.now() - started,
    run_id: runId,
  })
}

// GET: stats para el panel del Bloque 3.5. Con ?date_from=&date_to= el conteo
// de "pendientes" respeta el mismo rango de fecha que se va a usar al
// disparar la búsqueda (para que el número mostrado sea el real). Para ver
// el LISTADO real de leads (no solo el numero), usar
// GET /api/marketing/leads?view=validated — el explorador general del panel.
export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('date_from') || null
  const dateTo   = searchParams.get('date_to') || null
  const dateFilterSql = [
    dateFrom ? 'AND filing_date >= ?' : '',
    dateTo   ? 'AND filing_date <= ?' : '',
  ].filter(Boolean).join(' ')
  const dateFilterArgs = [dateFrom, dateTo].filter((v): v is string => v !== null)

  try {
    const [pendingByScore, lastRun, totals] = await Promise.all([
      marketing.execute({
        sql: `SELECT score, COUNT(*) as n FROM marketing_leads
              WHERE score IS NOT NULL AND address_validated = 1
              AND descartada = 0 AND email IS NULL AND email_enriched_at IS NULL
              AND target_addr1 IS NOT NULL AND TRIM(target_addr1) != ''
              ${dateFilterSql}
              GROUP BY score`,
        args: dateFilterArgs,
      }),
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
