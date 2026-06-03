import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  const allowed: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const f of ['client_id', 'invoice_date', 'service_type', 'description', 'amount', 'payment_method', 'payment_status', 'amount_paid', 'notes']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }
  if (allowed.amount) allowed.amount = parseFloat(allowed.amount as string)
  if (allowed.amount_paid) allowed.amount_paid = parseFloat(allowed.amount_paid as string)

  const { data, error } = await getSupabaseAdmin()
    .from('accounting_income')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ income: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { error } = await getSupabaseAdmin().from('accounting_income').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
