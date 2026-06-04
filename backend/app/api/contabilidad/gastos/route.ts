import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = getSupabaseAdmin()
    .from('accounting_expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (category) query = query.eq('category', category)
  if (from) query = query.gte('expense_date', from)
  if (to) query = query.lte('expense_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expenses: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { expense_date, category, expense_type = 'variable', description, amount, receipt_note,
    is_recurring = false, recurrence = 'none', renewal_date } = body

  if (!category || !description?.trim() || !amount) {
    return NextResponse.json({ error: 'category, description y amount son requeridos' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('accounting_expenses')
    .insert({
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      category,
      expense_type,
      description: description.trim(),
      amount: parseFloat(amount),
      receipt_note: receipt_note || null,
      is_recurring: Boolean(is_recurring),
      recurrence: is_recurring ? (recurrence || 'monthly') : 'none',
      renewal_date: is_recurring && renewal_date ? renewal_date : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data }, { status: 201 })
}
