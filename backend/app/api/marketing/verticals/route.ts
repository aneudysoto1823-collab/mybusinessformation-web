// Endpoints de configuracion de verticales activos (doc 31, refinamiento 2026-07-16).
//
// GET  /api/marketing/verticals -> lista con { vertical, active, lead_count }
// PATCH /api/marketing/verticals -> { vertical, active } toggle
//
// El estado active=0 hace que el Bloque 2 marque los leads clasificados en ese
// vertical como descartada=1 (excluidos del Bloque 3 y siguientes).
//
// Cambiar el toggle NO afecta retroactivamente los leads ya clasificados —
// para eso ver /api/marketing/verticals/apply-retroactive (por implementar).

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'
import { VERTICALS, isValidVertical, type VerticalKey } from '@/lib/marketing-verticals'

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
      marketing.execute('SELECT vertical, active FROM marketing_vertical_settings'),
      marketing.execute(`SELECT vertical, COUNT(*) as n,
                           SUM(CASE WHEN descartada = 1 THEN 1 ELSE 0 END) as descartadas,
                           SUM(CASE WHEN address_validated = 1 THEN 1 ELSE 0 END) as validated
                         FROM marketing_leads WHERE vertical IS NOT NULL GROUP BY vertical`),
    ])
    const activeMap = new Map<string, boolean>()
    settings.rows.forEach(r => activeMap.set(String(r.vertical), Number(r.active) === 1))
    const countsMap = new Map<string, { n: number; descartadas: number; validated: number }>()
    counts.rows.forEach(r => countsMap.set(String(r.vertical), {
      n: Number(r.n),
      descartadas: Number(r.descartadas),
      validated: Number(r.validated),
    }))

    // Devolver en el orden canonico de prioridad definido en VERTICALS
    const list = VERTICALS.map(v => {
      const c = countsMap.get(v.key) ?? { n: 0, descartadas: 0, validated: 0 }
      return {
        vertical: v.key,
        label: v.label,
        priority: v.priority,
        active: activeMap.has(v.key) ? activeMap.get(v.key)! : true,
        lead_count: c.n,
        descartadas: c.descartadas,
        validated: c.validated,
      }
    })
    return NextResponse.json({ verticals: list })
  } catch (e) {
    return jsonError(500, 'db error: ' + (e instanceof Error ? e.message : String(e)))
  }
}

export async function PATCH(req: Request) {
  if (!(await authCheck())) return jsonError(401, 'unauthorized')

  let body: { vertical?: string; active?: boolean }
  try { body = await req.json() } catch { return jsonError(400, 'body no es JSON valido') }

  if (!isValidVertical(body.vertical)) return jsonError(400, 'vertical invalido')
  if (typeof body.active !== 'boolean') return jsonError(400, 'active debe ser boolean')

  let marketing
  try { marketing = getMarketingClient() } catch (e) {
    return jsonError(500, 'config invalida: ' + (e instanceof Error ? e.message : String(e)))
  }

  const vertical: VerticalKey = body.vertical
  const active = body.active ? 1 : 0

  try {
    // UPSERT
    await marketing.execute({
      sql: `INSERT INTO marketing_vertical_settings (vertical, active) VALUES (?, ?)
            ON CONFLICT(vertical) DO UPDATE SET active = excluded.active, updated_at = datetime('now')`,
      args: [vertical, active],
    })
    return NextResponse.json({ ok: true, vertical, active: active === 1 })
  } catch (e) {
    return jsonError(500, 'db error: ' + (e instanceof Error ? e.message : String(e)))
  }
}
