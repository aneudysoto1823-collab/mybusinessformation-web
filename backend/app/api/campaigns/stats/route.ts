import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
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
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
