// POST /api/marketing/send-to-letters
// Puente entre Marketing Saliente (Turso, marketing_leads — doc 31) y el
// panel de Campaigns & Letters (Supabase, prospective_companies). Bloque 4
// de Marketing Saliente ("Campañas") sigue sin construir (placeholder
// deshabilitado) — mientras tanto, esto toma los leads YA listos (procesados,
// clasificados, con dirección validada, no contactados) y los importa a
// prospective_companies, que sí tiene el flujo de carta física funcionando
// (generación de PDF, preview, descarga) desde 2026-06.
//
// No envía nada de por sí — solo copia los leads al panel donde el staff ya
// sabe generar/descargar la carta manualmente. Marca los leads copiados con
// fecha_contactada en Turso para que no se vuelvan a ofrecer en el próximo
// llamado (misma columna que ya usa countReadyLeads() para filtrar).
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getMarketingClient } from '@/lib/turso-marketing'
import { verifyAdminToken } from '@/lib/session'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

const MAX_BATCH = 300

// marketing_leads.entity_type viene normalizado como 'LLC'/'Corp'/'LP'/'LLP'/
// 'DBA'/'Other' (lib/sunbiz-cron/parser.ts). prospective_companies.company_type
// usa mayúsculas ('LLC'/'CORP') — mismo formato que ya escribe el "+ Add
// Company" manual y que espera entityLabel() en new-business-letter.ts.
function normalizeCompanyType(entityType: string | null): string {
  const t = (entityType || '').toUpperCase()
  if (t === 'CORP') return 'CORP'
  // 'LTD' matea la entrada del mapa de new-business-letter.ts:entityLabel()
  // ("Florida Limited Partnership") — sin esto una LP/LLP salía etiquetada
  // como "Florida LLC" en la carta, incorrecto.
  if (t === 'LP' || t === 'LLP') return 'LTD'
  return 'LLC'
}

type OfficerRecord = { name?: string; type?: string; title?: string }

// Mejor esfuerzo: primer officer tipo persona (P) como owner_name — mismo dato
// que ya se usa para personalizar marketing (ver CLAUDE.md, "Officers tipo P
// también se surfacean..."). Si no hay ninguno, queda null (igual que una
// fila agregada a mano sin ese campo).
function firstPersonOfficerName(officersJson: string | null): string | null {
  if (!officersJson) return null
  try {
    const officers = JSON.parse(officersJson) as OfficerRecord[]
    const person = officers.find(o => o.type === 'P' && o.name)
    return person?.name || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let limit = 100
  try {
    const body = await req.json()
    if (Number.isInteger(body?.limit) && body.limit > 0) limit = body.limit
  } catch {
    // body vacío es válido — usa el default
  }
  limit = Math.min(limit, MAX_BATCH)

  try {
    const marketing = getMarketingClient()

    // Mismo criterio que countReadyLeads() en lib/marketing-pipeline.ts —
    // procesado, no descartado, dirección validada, score activo, nunca
    // contactado todavía.
    const readyRes = await marketing.execute({
      sql: `SELECT document_number, entity_name, entity_type, filing_date, officers_json,
                   target_addr1, target_addr2, target_city, target_state, target_zip
            FROM marketing_leads
            WHERE procesada = 1 AND descartada = 0
              AND address_validated = 1
              AND target_addr_source IS NOT NULL AND target_addr_source != 'none'
              AND fecha_contactada IS NULL
              AND score IN (SELECT score FROM marketing_score_settings WHERE active = 1)
            ORDER BY filing_date DESC
            LIMIT ?`,
      args: [limit],
    })

    if (readyRes.rows.length === 0) {
      return NextResponse.json({ attempted: 0, inserted: 0, duplicates: 0, document_numbers: [] })
    }

    const rows = readyRes.rows.map(r => ({
      document_id:       String(r.document_number).trim().toUpperCase(),
      company_name:      String(r.entity_name).trim().toUpperCase(),
      company_type:      normalizeCompanyType(r.entity_type as string | null),
      owner_name:        firstPersonOfficerName(r.officers_json as string | null),
      address:           [r.target_addr1, r.target_addr2].filter(Boolean).join(', ') || null,
      city:               (r.target_city as string | null) || null,
      state:              (r.target_state as string | null) || 'FL',
      zip:                (r.target_zip as string | null) || null,
      email:              null,
      registration_date:  (r.filing_date as string | null) || null,
      status:             'new' as const,
      note:               'Importado de Marketing Saliente',
    }))
    const documentNumbers = readyRes.rows.map(r => String(r.document_number))

    // ignoreDuplicates: document_id ya es UNIQUE en prospective_companies —
    // un lead que ya se había agregado a mano (o de una corrida anterior con
    // fecha_contactada sin marcar por algún error) simplemente no se duplica.
    const supabase = getSupabaseAdmin()
    const { data: inserted, error } = await supabase
      .from('prospective_companies')
      .upsert(rows, { onConflict: 'document_id', ignoreDuplicates: true })
      .select('document_id')

    if (error) throw error

    // Marca TODOS los intentados (insertados o no) como contactados en Turso
    // — si ya existían en prospective_companies, tampoco tiene sentido
    // volver a ofrecerlos en la próxima corrida.
    const placeholders = documentNumbers.map(() => '?').join(',')
    await marketing.execute({
      sql: `UPDATE marketing_leads SET fecha_contactada = datetime('now') WHERE document_number IN (${placeholders})`,
      args: documentNumbers,
    })

    const insertedCount = inserted?.length ?? 0
    return NextResponse.json({
      attempted: documentNumbers.length,
      inserted: insertedCount,
      duplicates: documentNumbers.length - insertedCount,
      document_numbers: documentNumbers,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[marketing/send-to-letters]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
