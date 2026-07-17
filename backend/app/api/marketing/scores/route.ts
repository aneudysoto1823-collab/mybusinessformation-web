// Endpoints de configuracion de scores activos.
// Espeja el patron de /api/marketing/verticals para consistencia.
//
// GET  /api/marketing/scores -> lista { score, active, lead_count, descartadas }
// PATCH /api/marketing/scores -> { score: 'A'|'B'|'C', active: boolean }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'

export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

async function authCheck(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  return token ? await verifyAdminToken(token) : false
}

export async function GET() {
  if (!(await authCheck())) return jsonError(401, 'unauthorized')

  let marketing
  try { marketing = getMarketingClient() } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }

  try {
    const [settings, counts] = await Promise.all([
      marketing.execute('SELECT score, active FROM marketing_score_settings'),
      marketing.execute(`SELECT score,
                           SUM(CASE WHEN descartada = 0 THEN 1 ELSE 0 END) as active_count,
                           SUM(CASE WHEN descartada = 1 THEN 1 ELSE 0 END) as descartadas
                         FROM marketing_leads WHERE score IS NOT NULL GROUP BY score`),
    ])
    const activeMap = new Map<string, boolean>()
    settings.rows.forEach(r => activeMap.set(String(r.score), Number(r.active) === 1))
    const countsMap = new Map<string, { active_count: number; descartadas: number }>()
    counts.rows.forEach(r => countsMap.set(String(r.score), {
      active_count: Number(r.active_count),
      descartadas: Number(r.descartadas),
    }))

    const list = (['A', 'B', 'C'] as const).map(s => {
      const c = countsMap.get(s) ?? { active_count: 0, descartadas: 0 }
      return {
        score: s,
        active: activeMap.has(s) ? activeMap.get(s)! : true,
        lead_count: c.active_count,
        descartadas: c.descartadas,
      }
    })
    return NextResponse.json({ scores: list })
  } catch (e) {
    return jsonError(500, 'db error: ' + (e instanceof Error ? e.message : String(e)))
  }
}

export async function PATCH(req: Request) {
  if (!(await authCheck())) return jsonError(401, 'unauthorized')

  let body: { score?: string; active?: boolean }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  if (!['A', 'B', 'C'].includes(String(body.score))) return jsonError(400, 'score debe ser A, B o C')
  if (typeof body.active !== 'boolean') return jsonError(400, 'active debe ser boolean')

  let marketing
  try { marketing = getMarketingClient() } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }

  const score = body.score as 'A' | 'B' | 'C'
  const active = body.active ? 1 : 0

  try {
    await marketing.execute({
      sql: `INSERT INTO marketing_score_settings (score, active) VALUES (?, ?)
            ON CONFLICT(score) DO UPDATE SET active = excluded.active, updated_at = datetime('now')`,
      args: [score, active],
    })
    return NextResponse.json({ ok: true, score, active: active === 1 })
  } catch (e) {
    return jsonError(500, 'db error: ' + (e instanceof Error ? e.message : String(e)))
  }
}
