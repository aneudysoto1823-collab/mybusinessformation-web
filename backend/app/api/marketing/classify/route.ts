// Endpoint del Bloque 2 (doc 31): clasificar N leads con Claude Haiku.
//
// Recibe: { n: 500 }
// Hace en orden:
//   1. SYNC: pull de Base A (sunbiz_corps) -> INSERT OR IGNORE en Base B (marketing_leads)
//      Trae las mas nuevas por filing_date que no existan ya en Base B.
//   2. CLASSIFY: SELECT N leads de Base B con procesada=0 (FIFO por filing_date DESC),
//      llama Haiku en batches de 20, UPDATE fila por fila con los campos de clasificacion + procesada=1.
//   3. LOG: escribe una fila en block_runs con el resumen (n_processed, distribucion score, costo est).
//
// Devuelve: { processed, distribution, elapsed_ms, run_id }

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { getTurso } from '@/lib/turso'
import { classifyLeadsWithHaiku, type LeadInput } from '@/lib/marketing-classify'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_N = 500 // Techo por corrida — pedidos mayores requieren varias corridas
const SYNC_MULTIPLIER = 2 // Trae 2x lo pedido de Base A para asegurar N nuevos en Base B despues de INSERT OR IGNORE
const MAX_STALE_DAYS = 3 // Auto-descartar pendientes con filing_date mas viejo que esto (regla de oro: data fresca vale)

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: Request) {
  const started = Date.now()

  // Auth admin
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  let body: { n?: number }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  const n = Number(body.n)
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
    return jsonError(400, `n debe ser un entero entre 1 y ${MAX_N}`)
  }

  let marketing, sunbiz
  try {
    marketing = getMarketingClient()
    sunbiz = getTurso()
    // (getTurso apunta a Base A `opabiz-sunbiz-search` via TURSO_DATABASE_URL)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'config invalida: ' + msg)
  }

  // ===== 0) EXPIRAR PENDIENTES VIEJAS =====
  // Antes de traer nuevas, marcar como descartadas las pendientes con filing_date > MAX_STALE_DAYS.
  // Coherente con la regla de oro "data fresca vale" (doc 31): una LLC vieja no sirve para marketing
  // de "LLC nueva". Sin este paso las pendientes se acumulan como basura en Base B.
  const expireRes = await marketing.execute({
    sql: `UPDATE marketing_leads
          SET descartada = 1,
              descarte_razon = 'expirada (>' || ? || ' dias desde filing)'
          WHERE procesada = 0
            AND descartada = 0
            AND filing_date IS NOT NULL
            AND filing_date < date('now', '-' || ? || ' days')`,
    args: [MAX_STALE_DAYS, MAX_STALE_DAYS],
  })
  const expired = Number(expireRes.rowsAffected || 0)

  // ===== 1) SYNC de Base A -> Base B =====
  // Traigo las 2N mas nuevas de sunbiz_corps y hago INSERT OR IGNORE en marketing_leads.
  // INSERT OR IGNORE es seguro aca porque document_number es UNIQUE en Base B.
  const sunbizRows = await sunbiz.execute({
    sql: `SELECT document_number, entity_name, entity_type, status, filing_date,
                 principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
                 mail_addr1, mail_addr2, mail_city, mail_state, mail_zip, mail_country,
                 registered_agent_name, registered_agent_type,
                 registered_agent_address, registered_agent_city, registered_agent_state, registered_agent_zip,
                 officers, fei, last_tx_date
          FROM sunbiz_corps
          WHERE filing_date IS NOT NULL
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [n * SYNC_MULTIPLIER],
  })

  let inserted = 0
  for (const row of sunbizRows.rows) {
    const r = await marketing.execute({
      sql: `INSERT OR IGNORE INTO marketing_leads (
              document_number, entity_name, entity_type, status, filing_date,
              principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
              mailing_addr1, mailing_addr2, mailing_city, mailing_state, mailing_zip, mailing_country,
              agent_name, agent_type, agent_addr1, agent_city, agent_state, agent_zip,
              officers_json, fei_number, last_tx_date, procesada
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        String(row.document_number), String(row.entity_name),
        row.entity_type ?? null, row.status ?? null, row.filing_date ?? null,
        row.principal_addr1 ?? null, row.principal_addr2 ?? null,
        row.principal_city ?? null, row.principal_state ?? null, row.principal_zip ?? null, row.principal_country ?? null,
        row.mail_addr1 ?? null, row.mail_addr2 ?? null,
        row.mail_city ?? null, row.mail_state ?? null, row.mail_zip ?? null, row.mail_country ?? null,
        row.registered_agent_name ?? null, row.registered_agent_type ?? null,
        row.registered_agent_address ?? null, row.registered_agent_city ?? null,
        row.registered_agent_state ?? null, row.registered_agent_zip ?? null,
        row.officers ?? null, row.fei ?? null, row.last_tx_date ?? null,
      ],
    })
    if (r.rowsAffected > 0) inserted += 1
  }

  // ===== 2) SELECT N leads pendientes de Base B =====
  const pendingRes = await marketing.execute({
    sql: `SELECT document_number, entity_name, entity_type,
                 principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
                 agent_name, agent_type, officers_json, fei_number
          FROM marketing_leads
          WHERE procesada = 0
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [n],
  })
  const pending: LeadInput[] = pendingRes.rows.map(r => ({
    document_number: String(r.document_number),
    entity_name: String(r.entity_name),
    entity_type: r.entity_type as string | null,
    principal_addr1: r.principal_addr1 as string | null,
    principal_addr2: r.principal_addr2 as string | null,
    principal_city: r.principal_city as string | null,
    principal_state: r.principal_state as string | null,
    principal_zip: r.principal_zip as string | null,
    principal_country: r.principal_country as string | null,
    agent_name: r.agent_name as string | null,
    agent_type: r.agent_type as string | null,
    officers_json: r.officers_json as string | null,
    fei_number: r.fei_number as string | null,
  }))

  // Log de corrida — arranca aunque haya 0 pendientes (para trazabilidad)
  const runIns = await marketing.execute({
    sql: `INSERT INTO block_runs (block, n_requested, status) VALUES ('classify', ?, 'running')`,
    args: [n],
  })
  const runId = Number(runIns.lastInsertRowid)

  if (pending.length === 0) {
    await marketing.execute({
      sql: `UPDATE block_runs SET n_processed = 0, status = 'ok', finished_at = datetime('now'),
            result_summary = ? WHERE id = ?`,
      args: [JSON.stringify({ sync_inserted: inserted, expired, note: 'no pending leads to classify' }), runId],
    })
    return NextResponse.json({
      processed: 0,
      sync_inserted: inserted,
      expired,
      distribution: {},
      elapsed_ms: Date.now() - started,
      run_id: runId,
    })
  }

  // ===== 3) CLASSIFY con Haiku =====
  let classifications: Awaited<ReturnType<typeof classifyLeadsWithHaiku>>
  try {
    classifications = await classifyLeadsWithHaiku(pending)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await marketing.execute({
      sql: `UPDATE block_runs SET status = 'error', error_message = ?, finished_at = datetime('now') WHERE id = ?`,
      args: [msg.slice(0, 500), runId],
    })
    return jsonError(500, 'haiku falló: ' + msg)
  }

  // ===== 3.5) Cargar settings de verticales + scores activos (default: activo si no existe row) =====
  const [vSettingsRes, sSettingsRes] = await Promise.all([
    marketing.execute('SELECT vertical, active FROM marketing_vertical_settings'),
    marketing.execute('SELECT score, active FROM marketing_score_settings'),
  ])
  const verticalActive = new Map<string, boolean>()
  vSettingsRes.rows.forEach(r => verticalActive.set(String(r.vertical), Number(r.active) === 1))
  const isVerticalActive = (v: string) => verticalActive.has(v) ? verticalActive.get(v)! : true
  const scoreActive = new Map<string, boolean>()
  sSettingsRes.rows.forEach(r => scoreActive.set(String(r.score), Number(r.active) === 1))
  const isScoreActive = (s: string) => scoreActive.has(s) ? scoreActive.get(s)! : true

  // ===== 4) UPDATE cada fila con su clasificacion + procesada=1 (+ descartada si vertical o score inactivo) =====
  const distribution = { A: 0, B: 0, C: 0 } as Record<string, number>
  const verticalDist = {} as Record<string, number>
  let discarded = 0
  for (const c of classifications) {
    const vInactive = !isVerticalActive(c.vertical)
    const sInactive = !isScoreActive(c.score)
    const shouldDiscard = vInactive || sInactive
    const reason = vInactive && sInactive
      ? `vertical y score inactivos: ${c.vertical}, ${c.score}`
      : vInactive
        ? `vertical inactivo: ${c.vertical}`
        : sInactive
          ? `score inactivo: ${c.score}`
          : null
    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET score = ?, vertical = ?, vertical_priority = ?,
                owner_profile = ?, address_type = ?, has_good_address = ?,
                classification_notes = ?, procesada = 1, fecha_procesada = datetime('now'),
                descartada = ?, descarte_razon = ?
            WHERE document_number = ?`,
      args: [
        c.score, c.vertical, c.vertical_priority,
        c.owner_profile, c.address_type, c.has_good_address ? 1 : 0,
        c.notes, shouldDiscard ? 1 : 0,
        reason,
        c.document_number,
      ],
    })
    distribution[c.score] = (distribution[c.score] || 0) + 1
    verticalDist[c.vertical] = (verticalDist[c.vertical] || 0) + 1
    if (shouldDiscard) discarded += 1
  }

  await marketing.execute({
    sql: `UPDATE block_runs SET n_processed = ?, status = 'ok', finished_at = datetime('now'),
          result_summary = ? WHERE id = ?`,
    args: [classifications.length, JSON.stringify({ sync_inserted: inserted, expired, score: distribution, vertical: verticalDist, discarded }), runId],
  })

  return NextResponse.json({
    processed: classifications.length,
    sync_inserted: inserted,
    expired,
    discarded,
    distribution,
    vertical_distribution: verticalDist,
    elapsed_ms: Date.now() - started,
    run_id: runId,
  })
}

// GET: devuelve stats para el panel (cuantos pendientes en Base B + ultima corrida)
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
    const [pending, lastRun, totals] = await Promise.all([
      marketing.execute(`SELECT COUNT(*) as n FROM marketing_leads WHERE procesada = 0`),
      marketing.execute(`SELECT * FROM block_runs WHERE block = 'classify' ORDER BY started_at DESC LIMIT 1`),
      marketing.execute(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN procesada = 1 THEN 1 ELSE 0 END) as classified,
        SUM(CASE WHEN descartada = 1 THEN 1 ELSE 0 END) as discarded,
        SUM(CASE WHEN score = 'A' AND descartada = 0 THEN 1 ELSE 0 END) as score_a,
        SUM(CASE WHEN score = 'B' AND descartada = 0 THEN 1 ELSE 0 END) as score_b,
        SUM(CASE WHEN score = 'C' AND descartada = 0 THEN 1 ELSE 0 END) as score_c
        FROM marketing_leads`),
    ])

    return NextResponse.json({
      pending: Number(pending.rows[0]?.n ?? 0),
      totals: {
        total: Number(totals.rows[0]?.total ?? 0),
        classified: Number(totals.rows[0]?.classified ?? 0),
        discarded: Number(totals.rows[0]?.discarded ?? 0),
        score_a: Number(totals.rows[0]?.score_a ?? 0),
        score_b: Number(totals.rows[0]?.score_b ?? 0),
        score_c: Number(totals.rows[0]?.score_c ?? 0),
      },
      last_run: lastRun.rows[0] ?? null,
      max_n: MAX_N,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'db error: ' + msg)
  }
}
