// GET /api/admin/affiliates — panel /admin/afiliados. Lista afiliados,
// filtrable por status. Mismo patrón de auth que /api/admin/guide-leads.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const status = req.nextUrl.searchParams.get('status')
    const supabase = getSupabaseAdmin()
    let query = supabase.from('affiliates').select('*').order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ affiliates: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
