// GET/PATCH /api/admin/guide-leads — panel /admin/guias.
//
// Lista los leads de `guide_sends` con source='landing' (los de campaña/orden
// ya se administran en sus propios paneles — /admin/campaigns y /admin/orders)
// y permite editar una nota de seguimiento por lead. Mismo patrón que
// /api/campaigns/companies (note editing de prospective_companies).

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
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('guide_sends')
      .select('*')
      .eq('source', 'landing')
      .order('sent_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ leads: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, note } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('guide_sends')
      .update({ note: (note ?? '').trim() || null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
