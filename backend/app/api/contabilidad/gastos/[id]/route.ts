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

  const allowed: Record<string, unknown> = {}
  for (const f of ['expense_date', 'category', 'expense_type', 'description', 'amount', 'receipt_note',
    'is_recurring', 'recurrence', 'renewal_date']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }
  if (allowed.amount) allowed.amount = parseFloat(allowed.amount as string)
  if (allowed.is_recurring !== undefined) allowed.is_recurring = Boolean(allowed.is_recurring)
  if (allowed.is_recurring === false) { allowed.recurrence = 'none'; allowed.renewal_date = null }

  const { data, error } = await getSupabaseAdmin()
    .from('accounting_expenses')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { error } = await getSupabaseAdmin().from('accounting_expenses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
