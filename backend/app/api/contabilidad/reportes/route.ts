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
  const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]
  const format = searchParams.get('format')

  const [incomeRes, expensesRes] = await Promise.all([
    getSupabaseAdmin()
      .from('accounting_income')
      .select('*, accounting_clients(name, email)')
      .gte('invoice_date', from)
      .lte('invoice_date', to)
      .order('invoice_date'),
    getSupabaseAdmin()
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', from)
      .lte('expense_date', to)
      .order('expense_date'),
  ])

  const income = incomeRes.data ?? []
  const expenses = expensesRes.data ?? []

  const totalIncome = income.reduce(
    (s: number, r: { amount: number; payment_status: string; amount_paid: number }) =>
      s + (r.payment_status === 'paid' ? r.amount : (r.amount_paid ?? 0)),
    0
  )
  const totalExpenses = expenses.reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  // Desglose por tipo de servicio
  const byService: Record<string, { total: number; count: number }> = {}
  for (const r of income) {
    if (!byService[r.service_type]) byService[r.service_type] = { total: 0, count: 0 }
    byService[r.service_type].total += r.amount
    byService[r.service_type].count += 1
  }

  // Desglose gastos por categoría
  const byCategory: Record<string, number> = {}
  for (const r of expenses) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount
  }

  if (format === 'csv') {
    const rows: string[][] = [
      ['Tipo', 'Fecha', 'Descripción', 'Monto', 'Estado', 'Referencia'],
      ...income.map((r: Record<string, unknown>) => [
        'Ingreso',
        String(r.invoice_date),
        String(r.description ?? r.service_type),
        String(r.amount),
        String(r.payment_status),
        String(r.invoice_number ?? ''),
      ]),
      ...expenses.map((r: Record<string, unknown>) => [
        'Gasto',
        String(r.expense_date),
        String(r.description),
        `-${r.amount}`,
        String(r.expense_type),
        String(r.category),
      ]),
    ]
    const csv = rows.map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte-${from}-al-${to}.csv"`,
      },
    })
  }

  return NextResponse.json({
    from, to, income, expenses,
    totalIncome, totalExpenses,
    balance: totalIncome - totalExpenses,
    byService, byCategory,
  })
}
