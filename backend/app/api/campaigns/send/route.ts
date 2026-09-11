import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { FROM_FBFC, REPLY_TO_FBFC } from '@/lib/email-constants'
import { hasReceivedGuide, recordGuideSent, getGuideAttachments, buildGuideBonusHtml, type GuideKey } from '@/lib/guides'
import { buildComplianceEmail as buildEmail, CAMPAIGN_EMAIL_BASE_URL as BASE_URL } from '@/lib/campaign-email'

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

    const supabase = getSupabaseAdmin()

    const { data: companies, error: fetchErr } = await supabase
      .from('prospective_companies')
      .select('id,document_id,company_name,company_type,owner_name,city,state,email,status,registration_date,unsubscribed')
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

        // Send via Resend — marca FBFC (remitente y reply-to deben coincidir
        // con el contenido 100% mybusinessformation.com del template; antes
        // decían "OpaBiz"/opabiz.com, auditoría 2026-09-11).
        await getResend().emails.send({
          from:    FROM_FBFC,
          replyTo: REPLY_TO_FBFC,
          to:      company.email,
          subject,
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

        // Update company status → email_sent
        await supabase
          .from('prospective_companies')
          .update({ status: 'email_sent' })
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
