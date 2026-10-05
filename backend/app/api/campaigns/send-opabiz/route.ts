import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend-client'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { opabizAvailableFrom } from '@/lib/campaign-brand-order'
import { FROM_COLD_OUTREACH_OPABIZ, REPLY_TO_COLD_OUTREACH_OPABIZ, buildListUnsubscribeHeaders } from '@/lib/email-constants'
import { hasReceivedGuide, recordGuideSent, getGuideAttachments, buildGuideBonusHtml, type GuideKey } from '@/lib/guides'
import { buildOpabizComplianceEmail as buildEmail, opabizTrackUrl, OPABIZ_CAMPAIGN_BASE_URL } from '@/lib/campaign-email-opabiz'
import { isSuppressed } from '@/lib/email-suppression'

// POST /api/campaigns/send-opabiz — carta de cumplimiento por email, versión
// OpaBiz (2026-10-05). Copia de /api/campaigns/send (la de mybiz) con marca,
// remitente, guía y landing de OpaBiz, y su propio campo de seguimiento
// (carta_opabiz_sent_at), para que las dos campañas no se pisen.
//
// Un envío real (loop secuencial de Resend.emails.send + Supabase por cada
// company_id) sin tope de tamaño ni tiempo máximo declarado podía cortarse a
// mitad de camino por el timeout de la función serverless, dejando un envío
// parcial sin saber a quién sí le llegó (auditoría 2026-09-13/14). Mismo
// patrón que ya usan marketing/prepare y marketing/enrich-email.
export const dynamic = 'force-dynamic'
export const maxDuration = 300
const MAX_BATCH = 300

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { company_ids, lang = 'en' } = await req.json()

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return NextResponse.json({ error: 'company_ids array is required' }, { status: 400 })
    }
    if (company_ids.length > MAX_BATCH) {
      return NextResponse.json({ error: `Máximo ${MAX_BATCH} por corrida — mandá en tandas más chicas.` }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: companies, error: fetchErr } = await supabase
      .from('prospective_companies')
      .select('id,document_id,company_name,company_type,owner_name,city,state,email,status,registration_date,unsubscribed,email_deliverable,carta_sent_at,vip_reminder_sent_at,letter_sent_at')
      .in('id', company_ids)

    if (fetchErr) throw fetchErr
    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies found for the given IDs' }, { status: 404 })
    }

    const results: { company_id: string; document_id: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = []

    for (const company of companies) {
      // Skip if no email
      if (!company.email) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'no email' })
        continue
      }

      // Ya compró (por MyBiz u OpaBiz): no se le vuelve a mandar la carta.
      if (company.status === 'purchased') {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'already purchased' })
        continue
      }
      // MyBiz va primero: si MyBiz la contactó hace menos de OPABIZ_WAIT_DAYS,
      // OpaBiz espera (ver lib/campaign-brand-order.ts).
      const waitUntil = opabizAvailableFrom(company)
      if (waitUntil) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: `MyBiz contacted it recently; OpaBiz can send from ${waitUntil.slice(0, 10)}` })
        continue
      }
      // Skip si el lead pidió no recibir más comunicaciones (POST /api/unsubscribe).
      // Antes este chequeo no existía — el botón de baja no impedía nada acá
      // (auditoría 2026-09-11).
      if (company.unsubscribed) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'unsubscribed' })
        continue
      }

      // Chequeo directo contra la lista de supresión (rebotes/quejas de
      // Resend) — protege incluso una fila que nunca haya sido marcada
      // unsubscribed (ej. una fila nueva creada para el mismo email después
      // del rebote). Auditoría 2026-09-13/14.
      if (await isSuppressed(company.email)) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'suppressed (bounce/complaint)' })
        continue
      }

      // ZeroBounce ya lo marcó como no entregable (auditoría 2026-09-13/14,
      // punto 2) — a diferencia de isSuppressed (rebote/queja YA ocurrido),
      // esto evita mandarlo la primera vez. Solo bloquea cuando el dato es
      // explícitamente false (una prueba real que falló) — null/true no
      // bloquean (sin dato o validado, mismo criterio que % Precisión).
      if (company.email_deliverable === false) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'email inválido (ZeroBounce)' })
        continue
      }

      try {
        // Build track URL (records scan then redirects to the pre-filled landing)
        const trackUrl = opabizTrackUrl(company, lang as 'en' | 'es')

        // Build email
        const { subject, html: baseHtml } = buildEmail(company, trackUrl, lang as 'en' | 'es')

        // Regalo de la Guía I en su variante OpaBiz (links a opabiz.com),
        // solo si este email todavía no recibió la de OpaBiz.
        const guideKeys: GuideKey[] = (await hasReceivedGuide(company.email, 'guide1', 'opabiz')) ? [] : ['guide1']
        const html = guideKeys.length > 0
          ? baseHtml.replace(
              '<!--GUIDE_BONUS-->',
              `<tr><td style="background:#fff;padding:0 36px 16px">${buildGuideBonusHtml(guideKeys, lang as 'en' | 'es', 'opabiz')}</td></tr>`
            )
          : baseHtml
        const attachments = guideKeys.length > 0 ? await getGuideAttachments(guideKeys, 'opabiz', lang as 'en' | 'es') : undefined

        // Con www: opabiz.com redirige el apex con un 308 y el POST de baja
        // one-click no sigue redirecciones.
        const oneClickUrl = `${OPABIZ_CAMPAIGN_BASE_URL}/api/unsubscribe/one-click?email=${encodeURIComponent(company.email)}`

        // Subdominio dedicado a correo frío de OpaBiz (notices.opabiz.com, ver
        // FROM_COLD_OUTREACH_OPABIZ en lib/email-constants.ts), mismo esquema
        // que notices.mybusinessformation.com en la carta de mybiz.
        await getResend().emails.send({
          from:    FROM_COLD_OUTREACH_OPABIZ,
          replyTo: REPLY_TO_COLD_OUTREACH_OPABIZ,
          to:      company.email,
          subject,
          headers: buildListUnsubscribeHeaders(oneClickUrl),
          html,
          ...(attachments ? { attachments } : {}),
        })

        if (guideKeys.length > 0) {
          await recordGuideSent(company.email, 'guide1', 'campaign', company.owner_name, 'opabiz')
        }

        // Save campaign record
        await supabase.from('email_campaigns').insert({
          company_id:  company.id,
          email_to:    company.email,
          qr_code_url: trackUrl,
        })

        // Solo carta_opabiz_sent_at: el status general de la tabla es de
        // MyBiz (lo usa la cola "New" de su panel). Tocarlo sacaría a esta
        // empresa de la cola de MyBiz por un envío de OpaBiz.
        await supabase
          .from('prospective_companies')
          .update({ carta_opabiz_sent_at: new Date().toISOString() })
          .eq('id', company.id)

        results.push({ company_id: company.id, document_id: company.document_id, status: 'sent' })
      } catch (err) {
        results.push({
          company_id:  company.id,
          document_id: company.document_id,
          status:      'error',
          reason:      err instanceof Error ? err.message : String(err),
        })
      }
    }

    const sent    = results.filter(r => r.status === 'sent').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const errors  = results.filter(r => r.status === 'error').length

    return NextResponse.json({ sent, skipped, errors, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[campaigns/send-opabiz]', msg)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
