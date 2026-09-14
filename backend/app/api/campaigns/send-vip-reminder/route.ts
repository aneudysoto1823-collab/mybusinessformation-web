// POST /api/campaigns/send-vip-reminder — segundo tipo de campaña, compañero
// de /api/campaigns/send (B1). Manda el email "Recordatorio de Cumplimiento"
// (AR solo + combo VIP) a las mismas prospective_companies. Ruta separada de
// la de B1 a propósito — así un bug acá nunca puede afectar el envío de la
// carta de cumplimiento que ya está probada en producción.
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { FROM_COLD_OUTREACH, REPLY_TO_COLD_OUTREACH, buildListUnsubscribeHeaders } from '@/lib/email-constants'
import { buildVipReminderEmail } from '@/lib/vip-reminder-email'
import { CAMPAIGN_EMAIL_BASE_URL as BASE_URL } from '@/lib/campaign-email'
import { isSuppressed } from '@/lib/email-suppression'

// Ver mismo comentario en campaigns/send/route.ts — auditoría 2026-09-13/14.
export const dynamic = 'force-dynamic'
export const maxDuration = 300
const MAX_BATCH = 300

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

const getResend = () => new Resend(process.env.RESEND_API_KEY)

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
      .select('id,document_id,company_name,company_type,owner_name,city,state,email,registration_date,unsubscribed,vip_reminder_sent_at')
      .in('id', company_ids)

    if (fetchErr) throw fetchErr
    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies found for the given IDs' }, { status: 404 })
    }

    const results: { company_id: string; document_id: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = []

    for (const company of companies) {
      if (!company.email) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'no email' })
        continue
      }
      if (company.unsubscribed) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'unsubscribed' })
        continue
      }

      // Ver mismo chequeo en campaigns/send/route.ts — auditoría 2026-09-13/14.
      if (await isSuppressed(company.email)) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'suppressed (bounce/complaint)' })
        continue
      }

      try {
        const { subject, html } = buildVipReminderEmail(company, lang as 'en' | 'es')
        // mybusinessformation.com apex no redirige a www — ver mismo
        // comentario en campaigns/send/route.ts.
        const oneClickUrl = `https://mybusinessformation.com/api/unsubscribe/one-click?email=${encodeURIComponent(company.email)}`

        // Ver comentario en campaigns/send/route.ts sobre FROM_COLD_OUTREACH.
        await getResend().emails.send({
          from:    FROM_COLD_OUTREACH,
          replyTo: REPLY_TO_COLD_OUTREACH,
          to:      company.email,
          subject,
          headers: buildListUnsubscribeHeaders(oneClickUrl),
          html,
        })

        await supabase.from('email_campaigns').insert({
          company_id:  company.id,
          email_to:    company.email,
          qr_code_url: `${BASE_URL}/vip?id=${encodeURIComponent(company.document_id)}`,
        })

        // vip_reminder_sent_at es el tracking específico de esta campaña —
        // antes compartía el mismo `status` que Carta Nuevas Empresas, sin
        // forma de saber a quién le faltaba cuál de las dos (auditoría
        // 2026-09-13/14). `status` se mantiene igual, sigue siendo el
        // "contact status" general del panel.
        await supabase
          .from('prospective_companies')
          .update({ status: 'email_sent', vip_reminder_sent_at: new Date().toISOString() })
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
    console.error('[campaigns/send-vip-reminder]', msg)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
