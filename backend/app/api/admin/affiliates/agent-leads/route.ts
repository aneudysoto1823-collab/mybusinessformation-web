// GET/PATCH /api/admin/affiliates/agent-leads — panel /admin/afiliados,
// pestaña "Interesados en ser agente". Mismo patrón que /api/admin/guide-leads.

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
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('affiliate_agent_leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, contacted, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const patch: Record<string, unknown> = {}
    if (typeof contacted === 'boolean') patch.contacted = contacted
    if (typeof notes === 'string') patch.notes = notes.trim() || null

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('affiliate_agent_leads')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
