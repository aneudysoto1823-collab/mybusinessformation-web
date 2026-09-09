import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { insertIncomeWithInvoiceNumber } from '@/lib/invoice-number'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = getSupabaseAdmin()
    .from('accounting_income')
    .select('*, accounting_clients(id, name, email)')
    .order('invoice_date', { ascending: false })

  if (status) query = query.eq('payment_status', status)
  if (from) query = query.gte('invoice_date', from)
  if (to) query = query.lte('invoice_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ income: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    client_id, order_id, invoice_date, service_type, description,
    amount, payment_method, payment_status = 'pending', amount_paid = 0, notes,
  } = body

  if (!service_type || !amount || !payment_method) {
    return NextResponse.json({ error: 'service_type, amount y payment_method son requeridos' }, { status: 400 })
  }
  const parsedAmount = parseFloat(amount)
  const parsedAmountPaid = parseFloat(amount_paid)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'amount debe ser un número mayor a 0' }, { status: 400 })
  }
  if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid < 0) {
    return NextResponse.json({ error: 'amount_paid debe ser un número válido' }, { status: 400 })
  }

  const { data, error } = await insertIncomeWithInvoiceNumber(getSupabaseAdmin(), invoice_number => ({
    client_id: client_id || null,
    order_id: order_id || null,
    invoice_number,
    invoice_date: invoice_date || new Date().toISOString().split('T')[0],
    service_type,
    description: description || null,
    amount: parsedAmount,
    payment_method,
    payment_status,
    amount_paid: parsedAmountPaid,
    notes: notes || null,
  }))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ income: data }, { status: 201 })
}
