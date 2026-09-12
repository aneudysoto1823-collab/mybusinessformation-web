// GET /api/marketing/leads
// Explorador filtrable de marketing_leads (doc 31) para el panel /admin/marketing
// — antes solo se veían contadores agregados por bloque, sin poder ver ni
// filtrar las leads reales (feedback founder 2026-09-12: quería ver "las que
// ya se clasificaron y enviaron a Campaigns & Letters" y "las validadas" por
// separado, con filtro de fecha).
//
// Query params:
//   view: 'new' | 'classified' | 'validated' | 'sent' | 'all' (default 'all')
//     - new:        procesada = 0 (todavia no paso por el Bloque 2)
//     - classified: procesada = 1
//     - validated:  address_validated = 1
//     - sent:       fecha_contactada IS NOT NULL (ya viajo a Campaigns & Letters)
//   score: 'A' | 'B' | 'C' (opcional)
//   date_from / date_to: filtran filing_date (YYYY-MM-DD)
//   limit (default 50, max 200), offset (default 0)
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getMarketingClient } from '@/lib/turso-marketing'

export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

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
  const view = searchParams.get('view') ?? 'all'
  const score = searchParams.get('score')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200)
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

  const where: string[] = []
  const args: (string | number)[] = []

  if (view === 'new') where.push('procesada = 0')
  else if (view === 'classified') where.push('procesada = 1')
  else if (view === 'validated') where.push('address_validated = 1')
  else if (view === 'sent') where.push('fecha_contactada IS NOT NULL')

  if (score && ['A', 'B', 'C'].includes(score)) { where.push('score = ?'); args.push(score) }
  if (dateFrom) { where.push('filing_date >= ?'); args.push(dateFrom) }
  if (dateTo)   { where.push('filing_date <= ?'); args.push(dateTo) }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const [rowsRes, countRes] = await Promise.all([
      marketing.execute({
        sql: `SELECT document_number, entity_name, entity_type, filing_date, score, vertical,
                     procesada, address_validated, descartada, email, phone, identity_score,
                     fecha_contactada
              FROM marketing_leads
              ${whereSql}
              ORDER BY filing_date DESC
              LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      }),
      marketing.execute({
        sql: `SELECT COUNT(*) as n FROM marketing_leads ${whereSql}`,
        args,
      }),
    ])

    return NextResponse.json({
      leads: rowsRes.rows.map(r => ({
        document_number: String(r.document_number ?? ''),
        entity_name: String(r.entity_name ?? ''),
        entity_type: r.entity_type ? String(r.entity_type) : null,
        filing_date: r.filing_date ? String(r.filing_date) : null,
        score: r.score ? String(r.score) : null,
        vertical: r.vertical ? String(r.vertical) : null,
        procesada: Number(r.procesada) === 1,
        address_validated: r.address_validated === null ? null : Number(r.address_validated) === 1,
        descartada: Number(r.descartada) === 1,
        email: r.email ? String(r.email) : null,
        phone: r.phone ? String(r.phone) : null,
        identity_score: r.identity_score === null ? null : Number(r.identity_score),
        fecha_contactada: r.fecha_contactada ? String(r.fecha_contactada) : null,
      })),
      total: Number(countRes.rows[0]?.n ?? 0),
      limit,
      offset,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonError(500, 'db error: ' + msg)
  }
}
