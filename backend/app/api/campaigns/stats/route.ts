import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, pgErrorMessage } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { contactedByOrFilter, type CampaignBrand } from '@/lib/campaign-brand-order'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { count: totalCompanies },
      { count: emailsToday },
      { count: emailsMonth },
      { count: totalScans },
      { count: totalEmailsSent },
      { data: conversions },
    ] = await Promise.all([
      supabase.from('prospective_companies').select('*', { count: 'exact', head: true }),
      supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).gte('sent_at', todayStart),
      supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).gte('sent_at', monthStart),
      supabase.from('qr_scans').select('*', { count: 'exact', head: true }),
      supabase.from('email_campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('conversions').select('total_amount'),
    ])

    // Comparación por marca (panel único, 2026-10-05): empresas contactadas
    // por cada marca y cuántas de esas compraron. Cada empresa la contacta una
    // sola marca (lib/campaign-brand-order.ts), así que no se cuentan doble.
    const brandCount = async (brand: CampaignBrand, purchasedOnly: boolean) => {
      let q = supabase.from('prospective_companies').select('*', { count: 'exact', head: true }).or(contactedByOrFilter(brand))
      if (purchasedOnly) q = q.eq('status', 'purchased')
      const { count } = await q
      return count ?? 0
    }
    const [fbfcContacted, fbfcPurchased, opabizContacted, opabizPurchased] = await Promise.all([
      brandCount('fbfc', false), brandCount('fbfc', true), brandCount('opabiz', false), brandCount('opabiz', true),
    ])

    const revenue = conversions?.reduce((sum, c) => sum + Number(c.total_amount), 0) ?? 0
    const scanRate = totalEmailsSent && totalEmailsSent > 0
      ? Math.round(((totalScans ?? 0) / totalEmailsSent) * 100)
      : 0

    return NextResponse.json({
      totalCompanies:  totalCompanies  ?? 0,
      emailsToday:     emailsToday     ?? 0,
      emailsMonth:     emailsMonth     ?? 0,
      totalScans:      totalScans      ?? 0,
      totalEmailsSent: totalEmailsSent ?? 0,
      scanRate,
      conversions:     conversions?.length ?? 0,
      revenue,
      byBrand: {
        fbfc:   { contacted: fbfcContacted,   purchased: fbfcPurchased },
        opabiz: { contacted: opabizContacted, purchased: opabizPurchased },
      },
    })
  } catch (err) {
    return NextResponse.json({ error: pgErrorMessage(err) }, { status: 500 })
  }
}
