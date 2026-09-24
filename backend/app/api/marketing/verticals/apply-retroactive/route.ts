// POST /api/marketing/verticals/apply-retroactive
//
// Resuelve el hallazgo de la auditoría de marketing 2026-09-13/14: apagar un
// vertical o un score en /admin/marketing marca descartada=1 a los leads
// clasificados desde ese momento — pero volver a PRENDERLO no revive a los
// que quedaron descartados en el medio (ver comentario en
// app/api/marketing/verticals/route.ts). Este endpoint es la forma de
// revertir eso, a demanda.
//
// A propósito NO es automático ni corre solo al togglear — decisión founder
// 2026-09-24: la regla de oro del sistema es "data fresca vale" (mismo
// criterio que el auto-descarte de pendientes viejas en /classify), así que
// recuperar TODO lo descartado desde que se apagó el vertical podría traer
// leads de hace meses sin valor real para contactar. En cambio, el admin
// elige un vertical + un rango de fechas puntual (ej. "las últimas 2
// semanas") y decide caso a caso.
//
// Nunca toca leads descartados por otro motivo (dirección expirada, un
// futuro descarte manual, etc.) — el WHERE exige que la razón actual sea
// EXACTAMENTE una de las 3 que escribe /api/marketing/classify al descartar
// por vertical/score inactivo.
//
// Recibe: { vertical: VerticalKey, date_from: 'YYYY-MM-DD', date_to: 'YYYY-MM-DD', dry_run?: boolean }
// dry_run:true solo cuenta (no escribe nada) — lo usa el panel para mostrar
// "cuántos se recuperarían" antes de que el admin confirme.
//
// Por cada candidato se recalcula el descarte con la MISMA lógica que usa
// /api/marketing/classify (isVerticalActive/isScoreActive contra los
// settings actuales) — no es un simple "descartada=0" a lo bruto: si el
// vertical ya está activo pero el score de esa fila puntual sigue apagado,
// la fila se queda descartada (con la razón actualizada a solo "score
// inactivo: X"), nunca se recupera a medias.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { isValidVertical, type VerticalKey } from '@/lib/marketing-verticals'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  let body: { vertical?: string; date_from?: string; date_to?: string; dry_run?: boolean }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  if (!isValidVertical(body.vertical)) return jsonError(400, 'vertical invalido')
  if (!body.date_from || !body.date_to) return jsonError(400, 'date_from y date_to son requeridos (YYYY-MM-DD)')

  const vertical: VerticalKey = body.vertical
  const dateFrom = body.date_from
  const dateTo = body.date_to
  const dryRun = body.dry_run === true

  let marketing
  try {
    marketing = getMarketingClient()
  } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }

  const runIns = await marketing.execute({
    sql: `INSERT INTO block_runs (block, n_requested, status) VALUES ('apply_retroactive', 0, 'running')`,
  })
  const runId = Number(runIns.lastInsertRowid)

  try {
    // Mismos settings y misma lógica de isVerticalActive/isScoreActive que
    // /api/marketing/classify — para que un lead recalculado acá dé
    // exactamente el mismo resultado que si se clasificara hoy desde cero.
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

    const candidatesRes = await marketing.execute({
      sql: `SELECT document_number, score, descarte_razon
            FROM marketing_leads
            WHERE vertical = ? AND descartada = 1
              AND filing_date >= ? AND filing_date <= ?
              AND (descarte_razon LIKE 'vertical inactivo:%'
                   OR descarte_razon LIKE 'score inactivo:%'
                   OR descarte_razon LIKE 'vertical y score inactivos:%')`,
      args: [vertical, dateFrom, dateTo],
    })

    let recovered = 0
    let stillDiscarded = 0
    let reasonUpdated = 0

    for (const row of candidatesRes.rows) {
      const rowScore = String(row.score ?? '')
      const vInactive = !isVerticalActive(vertical)
      const sInactive = !isScoreActive(rowScore)
      const shouldDiscard = vInactive || sInactive
      const newReason = vInactive && sInactive
        ? `vertical y score inactivos: ${vertical}, ${rowScore}`
        : vInactive
          ? `vertical inactivo: ${vertical}`
          : sInactive
            ? `score inactivo: ${rowScore}`
            : null

      if (!shouldDiscard) {
        recovered += 1
        if (!dryRun) {
          await marketing.execute({
            sql: `UPDATE marketing_leads SET descartada = 0, descarte_razon = NULL WHERE document_number = ?`,
            args: [row.document_number as string],
          })
        }
      } else {
        stillDiscarded += 1
        if (newReason !== (row.descarte_razon ?? null)) {
          reasonUpdated += 1
          if (!dryRun) {
            await marketing.execute({
              sql: `UPDATE marketing_leads SET descarte_razon = ? WHERE document_number = ?`,
              args: [newReason, row.document_number as string],
            })
          }
        }
      }
    }

    const summary = {
      vertical, date_from: dateFrom, date_to: dateTo, dry_run: dryRun,
      candidates: candidatesRes.rows.length, recovered, still_discarded: stillDiscarded, reason_updated: reasonUpdated,
    }
    await marketing.execute({
      sql: `UPDATE block_runs SET n_requested = ?, n_processed = ?, status = 'ok', finished_at = datetime('now'), result_summary = ? WHERE id = ?`,
      args: [candidatesRes.rows.length, dryRun ? 0 : recovered, JSON.stringify(summary), runId],
    })

    return NextResponse.json({
      dry_run: dryRun,
      candidates: candidatesRes.rows.length,
      recovered,
      still_discarded: stillDiscarded,
      reason_updated: reasonUpdated,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await marketing.execute({
      sql: `UPDATE block_runs SET status = 'error', error_message = ?, finished_at = datetime('now') WHERE id = ?`,
      args: [msg.slice(0, 500), runId],
    })
    return jsonError(500, 'db error: ' + msg)
  }
}
