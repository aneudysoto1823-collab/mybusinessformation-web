import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { listOrdersWithSubscriptions } from '@/lib/order-subscriptions'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().split('T')[0]
}

// KPIs de negocio para /admin/contabilidad/reportes. CAC/ROI/AOV respetan el
// rango from/to elegido (mismos datos que el reporte de arriba); Runway y
// Churn usan su propia ventana fija (trailing 3 meses / snapshot actual) —
// no tiene sentido que un Runway cambie solo porque alguien acortó el rango
// del reporte a una semana.
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  const supabase = getSupabaseAdmin()

  const [incomeRes, expensesRes, marketingRes, newClientsRes, burnWindowRes] = await Promise.all([
    supabase.from('accounting_income').select('amount, payment_status').gte('invoice_date', from).lte('invoice_date', to),
    supabase.from('accounting_expenses').select('amount').gte('expense_date', from).lte('expense_date', to),
    supabase.from('accounting_expenses').select('amount').eq('category', 'marketing').gte('expense_date', from).lte('expense_date', to),
    supabase.from('accounting_clients').select('id', { count: 'exact', head: true }).gte('created_at', from).lte('created_at', `${to}T23:59:59`),
    Promise.all([
      supabase.from('accounting_income').select('amount, payment_status, amount_paid').gte('invoice_date', monthsAgo(3)),
      supabase.from('accounting_expenses').select('amount').gte('expense_date', monthsAgo(3)),
    ]),
  ])

  const income = incomeRes.data ?? []
  const expenses = expensesRes.data ?? []
  const marketingSpend = (marketingRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const newClients = newClientsRes.count ?? 0

  const paidIncomeRows = income.filter(r => r.payment_status === 'paid')
  const totalPaidIncome = paidIncomeRows.reduce((s, r) => s + r.amount, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0)
  const netProfit = totalPaidIncome - totalExpenses

  // CAC = gasto de marketing / clientes nuevos captados en el período.
  const cac = newClients > 0 ? marketingSpend / newClients : null

  // AOV = ingreso cobrado / número de facturas cobradas (cada fila de
  // accounting_income es una transacción — no todas tienen order_id, ej.
  // ingresos manuales, así que contamos filas, no Orders).
  const aov = paidIncomeRows.length > 0 ? totalPaidIncome / paidIncomeRows.length : null

  // ROI = beneficio neto del período / costo total invertido (gastos del período).
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : null

  // Runway = efectivo disponible / quema neta mensual promedio (trailing 3 meses,
  // fijo — independiente del rango elegido arriba en el reporte).
  const [burnIncomeRes, burnExpensesRes] = burnWindowRes
  const burnIncome = (burnIncomeRes.data ?? []).reduce((s, r) => s + (r.payment_status === 'paid' ? r.amount : (r.amount_paid ?? 0)), 0)
  const burnExpenses = (burnExpensesRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const avgMonthlyBurn = (burnExpenses - burnIncome) / 3

  const { data: cashRow } = await supabase
    .from('accounting_settings')
    .select('value')
    .eq('key', 'cash_on_hand')
    .maybeSingle()
  const cashOnHand = (cashRow?.value as { amount?: number } | null)?.amount ?? null

  let runwayMonths: number | null = null
  let profitable = false
  if (avgMonthlyBurn <= 0) {
    profitable = true // los últimos 3 meses generaron más de lo que gastaron — no se está "quemando" caja
  } else if (cashOnHand !== null) {
    runwayMonths = cashOnHand / avgMonthlyBurn
  }

  // Churn = suscripciones canceladas DENTRO del período (canceledAt real) /
  // suscripciones activas al inicio del período. Solo cuenta cancelaciones
  // con canceledAt (agregado 2026-09-30) — una cancelación anterior a esa
  // fecha no tiene cómo ubicarse en un mes específico, así que no entra acá.
  const orders = await listOrdersWithSubscriptions()
  let activeAtStart = 0
  let canceledInPeriod = 0
  let hasAnyCanceledAtData = false
  for (const order of orders) {
    for (const entry of order.subscriptions) {
      const createdBeforeStart = entry.createdAt < from
      const stillActiveAtStart = createdBeforeStart && (entry.status !== 'canceled' || (entry.canceledAt ?? '') >= from)
      if (stillActiveAtStart) activeAtStart++
      if (entry.canceledAt) {
        hasAnyCanceledAtData = true
        if (entry.canceledAt >= from && entry.canceledAt <= `${to}T23:59:59`) canceledInPeriod++
      }
    }
  }
  const churnRate = hasAnyCanceledAtData && activeAtStart > 0 ? (canceledInPeriod / activeAtStart) * 100 : null

  return NextResponse.json({
    cac, newClients, marketingSpend,
    aov, ordersCount: paidIncomeRows.length,
    roi, netProfit, totalExpenses,
    runwayMonths, profitable, cashOnHand, avgMonthlyBurn,
    churnRate, activeAtStart, canceledInPeriod, churnDataAvailable: hasAnyCanceledAtData,
  })
}
