// GET /api/campaigns/preview-vip-reminder?company_id=X&lang=en|es
// Preview de solo lectura del email "Recordatorio de Cumplimiento" — mismo
// patrón que /api/campaigns/preview-email (B1). No envía nada.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { buildVipReminderEmail } from '@/lib/vip-reminder-email'

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

  const { html } = buildVipReminderEmail(company, lang)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
