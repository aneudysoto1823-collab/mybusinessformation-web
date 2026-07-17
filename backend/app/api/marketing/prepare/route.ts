// Endpoint "loop-until-N" (doc 31, refinamiento 2026-07-17).
//
// Vos decis "quiero N leads LISTOS para carta" (validated + target ok + no contactados)
// y el sistema itera sync -> classify -> enrich hasta llegar o hasta un maximo de
// iteraciones (defensa anti-runaway).
//
// Ready = procesada=1, descartada=0, address_validated=1, fecha_contactada IS NULL,
//         score en (scores activos).

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { getTurso } from '@/lib/turso'
import {
  expireOldPending, syncFromSunbiz, classifyPending, enrichPending,
  countReadyLeads, getActiveScores,
} from '@/lib/marketing-pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Vercel Pro tope

const BATCH_SIZE_SYNC     = 100
const BATCH_SIZE_CLASSIFY = 100
const BATCH_SIZE_ENRICH   = 200
const MAX_ITERATIONS      = 6
const TARGET_MAX          = 500

interface IterationLog {
  iteration: number
  expired: number
  synced: number
  classified: number
  score_dist: Record<string, number>
  discarded_by_settings: number
  enriched_by_score: Record<string, { enriched: number; validated: number; invalid: number; api_errors: number }>
  ready_after: number
  gained: number
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

  let body: { target?: number }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  const target = Number(body.target)
  if (!Number.isInteger(target) || target < 1 || target > TARGET_MAX) {
    return jsonError(400, `target debe ser un entero entre 1 y ${TARGET_MAX}`)
  }

  let marketing, sunbiz
  try {
    marketing = getMarketingClient()
    sunbiz = getTurso()
  } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }

  // Log de corrida — un solo block_runs por prepare (con block='prepare')
  const runIns = await marketing.execute({
    sql: `INSERT INTO block_runs (block, n_requested, status) VALUES ('prepare', ?, 'running')`,
    args: [target],
  })
  const runId = Number(runIns.lastInsertRowid)

  try {
    const readyStart = await countReadyLeads(marketing)
    const iterations: IterationLog[] = []
    const activeScores = await getActiveScores(marketing)
    let ready = readyStart

    for (let i = 1; i <= MAX_ITERATIONS && ready < target; i++) {
      const iterStart = Date.now()

      // (a) Expirar viejas
      const expired = await expireOldPending(marketing)

      // (b) Sync nuevas desde Sunbiz
      const synced = await syncFromSunbiz(sunbiz, marketing, BATCH_SIZE_SYNC)

      // (c) Clasificar hasta BATCH_SIZE_CLASSIFY pendientes
      const clsRes = await classifyPending(marketing, BATCH_SIZE_CLASSIFY)

      // (d) Enriquecer los scores activos (paralelo cada score)
      const enrichedByScore: Record<string, { enriched: number; validated: number; invalid: number; api_errors: number }> = {}
      for (const sc of activeScores) {
        // Solo llamamos si faltan leads para llegar al target
        if (ready >= target) break
        const remaining = target - ready
        const nToEnrich = Math.min(BATCH_SIZE_ENRICH, remaining * 3) // sobreestimar 3x para compensar direcciones invalidas
        const enrichRes = await enrichPending(marketing, sc, nToEnrich)
        enrichedByScore[sc] = {
          enriched: enrichRes.enriched,
          validated: enrichRes.validated,
          invalid: enrichRes.invalid,
          api_errors: enrichRes.apiErrors,
        }
      }

      // (e) Recontar
      const readyAfter = await countReadyLeads(marketing)
      const gained = readyAfter - ready

      iterations.push({
        iteration: i,
        expired,
        synced,
        classified: clsRes.processed,
        score_dist: clsRes.dist,
        discarded_by_settings: clsRes.discarded,
        enriched_by_score: enrichedByScore,
        ready_after: readyAfter,
        gained,
      })

      ready = readyAfter

      // Safety break: si en 2 iteraciones no ganamos nada, cortar (Base A agotada o todos son C)
      if (i >= 2 && gained === 0 && iterations[i - 2].gained === 0) break

      // Timeout guard: dejar 30s de margen antes del maxDuration
      if (Date.now() - started > 270_000) break
    }

    const summary = {
      target,
      ready_start: readyStart,
      ready_end: ready,
      gained: ready - readyStart,
      iterations_used: iterations.length,
      elapsed_ms: Date.now() - started,
      completed: ready >= target,
    }

    await marketing.execute({
      sql: `UPDATE block_runs SET n_processed = ?, status = 'ok', finished_at = datetime('now'),
            result_summary = ? WHERE id = ?`,
      args: [ready, JSON.stringify({ summary, iterations }), runId],
    })

    return NextResponse.json({ ...summary, iterations, run_id: runId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await marketing.execute({
      sql: `UPDATE block_runs SET status = 'error', error_message = ?, finished_at = datetime('now') WHERE id = ?`,
      args: [msg.slice(0, 500), runId],
    })
    return jsonError(500, 'error en pipeline: ' + msg)
  }
}

// GET: solo devuelve cuantos leads listos hay ahora (para el badge del panel)
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  let marketing
  try { marketing = getMarketingClient() } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }
  try {
    const ready = await countReadyLeads(marketing)
    const lastRun = await marketing.execute(`SELECT * FROM block_runs WHERE block = 'prepare' ORDER BY started_at DESC LIMIT 1`)
    return NextResponse.json({
      ready,
      target_max: TARGET_MAX,
      max_iterations: MAX_ITERATIONS,
      last_run: lastRun.rows[0] ?? null,
    })
  } catch (e) {
    return jsonError(500, 'db error: ' + (e instanceof Error ? e.message : String(e)))
  }
}
