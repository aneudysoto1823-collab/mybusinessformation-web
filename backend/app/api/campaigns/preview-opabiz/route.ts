// GET /api/campaigns/preview-opabiz?company_id=X&lang=en|es — preview de la
// carta de cumplimiento versión OpaBiz (ver send-opabiz). Igual que
// preview-email: arma el HTML real sin enviar ni registrar nada.
//
// (Base: preview-email)
// Devuelve el HTML del email de campaña (B1) tal cual se mandaría — mismo
// buildComplianceEmail() que usa el envío real (api/campaigns/send) — pero
// SIN enviar nada por Resend ni tocar guide_sends/email_campaigns/status.
// Solo para que el admin pueda revisar el correo en una pestaña nueva antes
// de mandarlo de verdad.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { buildOpabizComplianceEmail, opabizTrackUrl } from '@/lib/campaign-email-opabiz'
import { hasReceivedGuide, buildGuideBonusHtml, type GuideKey } from '@/lib/guides'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = req.nextUrl.searchParams.get('company_id')
  const lang = (req.nextUrl.searchParams.get('lang') === 'es' ? 'es' : 'en') as 'en' | 'es'
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  const { data: company, error } = await getSupabaseAdmin()
    .from('prospective_companies')
    .select('id,document_id,company_name,company_type,owner_name,city,state,email,registration_date')
    .eq('id', companyId)
    .single()

  if (error || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const trackUrl = opabizTrackUrl(company, lang)
  const { html: baseHtml } = buildOpabizComplianceEmail(company, trackUrl, lang)

  // Refleja el mismo bloque de regalo de la Guía I que vería el destinatario
  // real (solo lectura — hasReceivedGuide no registra nada).
  const guideKeys: GuideKey[] = company.email && !(await hasReceivedGuide(company.email, 'guide1', 'opabiz')) ? ['guide1'] : []
  const html = guideKeys.length > 0
    ? baseHtml.replace(
        '<!--GUIDE_BONUS-->',
        `<tr><td style="background:#fff;padding:0 36px 16px">${buildGuideBonusHtml(guideKeys, lang, 'opabiz')}</td></tr>`
      )
    : baseHtml

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
