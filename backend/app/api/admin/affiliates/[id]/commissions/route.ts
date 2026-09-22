// GET /api/admin/affiliates/[id]/commissions — panel /admin/afiliados,
// ledger de un afiliado (una fila por orden que usó su cupón).

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', id)
    .order('created_at', { ascending: false })
  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
  return NextResponse.json({ commissions: data ?? [] })
}
