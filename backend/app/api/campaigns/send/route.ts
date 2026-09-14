import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { FROM_COLD_OUTREACH, REPLY_TO_COLD_OUTREACH, buildListUnsubscribeHeaders } from '@/lib/email-constants'
import { hasReceivedGuide, recordGuideSent, getGuideAttachments, buildGuideBonusHtml, type GuideKey } from '@/lib/guides'
import { buildComplianceEmail as buildEmail, CAMPAIGN_EMAIL_BASE_URL as BASE_URL } from '@/lib/campaign-email'
import { isSuppressed } from '@/lib/email-suppression'

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

const getResend = () => new Resend(process.env.RESEND_API_KEY)

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
      .select('id,document_id,company_name,company_type,owner_name,city,state,email,status,registration_date,unsubscribed,carta_sent_at')
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

      try {
        // Build track URL (records scan then redirects to the pre-filled landing)
        const trackUrl = `${BASE_URL}/api/campaigns/track-scan?doc=${encodeURIComponent(company.document_id)}&cid=${company.id}`

        // Build email
        const { subject, html: baseHtml } = buildEmail(company, trackUrl, lang as 'en' | 'es')

        // Regalo de la Guía I — solo si este email todavía no la recibió por
        // ningún canal (ver backend/lib/guides.ts). Este email siempre es
        // marca FBFC (membrete/footer mybusinessformation.com) — la guía
        // adjunta debe usar la variante con links a mybusinessformation.com,
        // no la de opabiz.com.
        const guideKeys: GuideKey[] = (await hasReceivedGuide(company.email, 'guide1', 'fbfc')) ? [] : ['guide1']
        const html = guideKeys.length > 0
          ? baseHtml.replace(
              '<!--GUIDE_BONUS-->',
              `<tr><td style="background:#fff;padding:0 36px 16px">${buildGuideBonusHtml(guideKeys, lang as 'en' | 'es', 'fbfc')}</td></tr>`
            )
          : baseHtml
        const attachments = guideKeys.length > 0 ? await getGuideAttachments(guideKeys, 'fbfc') : undefined

        // mybusinessformation.com (apex) no redirige a www (a diferencia de
        // opabiz.com) — confirmado en next.config.ts, ambos hosts se sirven
        // directo — así que acá no hace falta forzar www para el link de
        // one-click.
        const oneClickUrl = `https://mybusinessformation.com/api/unsubscribe/one-click?email=${encodeURIComponent(company.email)}`

        // FROM_COLD_OUTREACH: mismo remitente FBFC hasta que se registre un
        // dominio dedicado para correo frío (ver comentario en
        // lib/email-constants.ts) — el contenido del template sigue siendo
        // 100% mybusinessformation.com sin importar cuál sea el remitente.
        await getResend().emails.send({
          from:    FROM_COLD_OUTREACH,
          replyTo: REPLY_TO_COLD_OUTREACH,
          to:      company.email,
          subject,
          headers: buildListUnsubscribeHeaders(oneClickUrl),
          html,
          ...(attachments ? { attachments } : {}),
        })

        if (guideKeys.length > 0) {
          await recordGuideSent(company.email, 'guide1', 'campaign', company.owner_name, 'fbfc')
        }

        // Save campaign record
        await supabase.from('email_campaigns').insert({
          company_id:  company.id,
          email_to:    company.email,
          qr_code_url: trackUrl,
        })

        // status → email_sent sigue siendo el "contact status" general (lo
        // usa el filtro New/Email sent/Letter sent del panel). carta_sent_at
        // es el tracking específico de ESTA campaña — antes no existía
        // ninguno, y se confundía con el de Oferta VIP al compartir status
        // (auditoría 2026-09-13/14).
        await supabase
          .from('prospective_companies')
          .update({ status: 'email_sent', carta_sent_at: new Date().toISOString() })
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
    console.error('[campaigns/send]', msg)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
