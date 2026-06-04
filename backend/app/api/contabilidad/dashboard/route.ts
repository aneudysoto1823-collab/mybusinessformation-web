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

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString().split('T')[0]
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0]

  const [allIncome, allExpenses, monthIncome, monthExpenses, activeClients, pendingIncome, recentIncome, recentExpenses, upcomingRenewals] =
    await Promise.all([
      getSupabaseAdmin().from('accounting_income').select('amount, payment_status, amount_paid'),
      getSupabaseAdmin().from('accounting_expenses').select('amount'),
      getSupabaseAdmin().from('accounting_income').select('amount, payment_status, amount_paid')
        .gte('invoice_date', firstOfMonth).lte('invoice_date', lastOfMonth),
      getSupabaseAdmin().from('accounting_expenses').select('amount')
        .gte('expense_date', firstOfMonth).lte('expense_date', lastOfMonth),
      getSupabaseAdmin().from('accounting_clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      getSupabaseAdmin().from('accounting_income').select('amount, amount_paid').neq('payment_status', 'paid'),
      getSupabaseAdmin().from('accounting_income')
        .select('id, invoice_number, invoice_date, service_type, amount, payment_status, accounting_clients(name)')
        .order('created_at', { ascending: false }).limit(5),
      getSupabaseAdmin().from('accounting_expenses')
        .select('id, expense_date, category, description, amount')
        .order('created_at', { ascending: false }).limit(5),
      getSupabaseAdmin().from('accounting_expenses')
        .select('id, description, amount, recurrence, renewal_date')
        .eq('is_recurring', true)
        .gte('renewal_date', sevenDaysAgo)
        .lte('renewal_date', thirtyDaysFromNow)
        .order('renewal_date', { ascending: true }),
    ])

  const sumPaid = (rows: { amount: number; payment_status: string; amount_paid: number }[]) =>
    rows.reduce((s, r) => s + (r.payment_status === 'paid' ? r.amount : (r.amount_paid ?? 0)), 0)

  const totalRevenue = sumPaid(allIncome.data ?? [])
  const totalExpenses = (allExpenses.data ?? []).reduce((s, r) => s + r.amount, 0)
  const monthRevenue = sumPaid(monthIncome.data ?? [])
  const monthExpensesTotal = (monthExpenses.data ?? []).reduce((s, r) => s + r.amount, 0)
  const pendingAmount = (pendingIncome.data ?? []).reduce((s, r) => s + (r.amount - (r.amount_paid ?? 0)), 0)

  return NextResponse.json({
    totalBalance: totalRevenue - totalExpenses,
    totalRevenue,
    totalExpenses,
    monthRevenue,
    monthExpenses: monthExpensesTotal,
    monthBalance: monthRevenue - monthExpensesTotal,
    activeClients: activeClients.count ?? 0,
    pendingAmount,
    recentIncome: recentIncome.data ?? [],
    recentExpenses: recentExpenses.data ?? [],
    upcomingRenewals: upcomingRenewals.data ?? [],
  })
}
