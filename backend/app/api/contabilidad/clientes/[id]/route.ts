import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [clientRes, incomeRes] = await Promise.all([
    getSupabaseAdmin().from('accounting_clients').select('*').eq('id', id).single(),
    getSupabaseAdmin().from('accounting_income').select('*').eq('client_id', id).order('invoice_date', { ascending: false }),
  ])

  if (clientRes.error || !clientRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ client: clientRes.data, income: incomeRes.data ?? [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  const allowed: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const f of ['name', 'phone', 'email', 'status', 'notes', 'order_id']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }

  const { data, error } = await getSupabaseAdmin()
    .from('accounting_clients')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { error } = await getSupabaseAdmin().from('accounting_clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
