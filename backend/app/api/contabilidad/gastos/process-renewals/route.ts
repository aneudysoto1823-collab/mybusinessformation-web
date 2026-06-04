import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

function addPeriod(dateStr: string, recurrence: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (recurrence === 'annual') {
    return `${year + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  // monthly
  const newMonth = month + 1
  const newYear = newMonth > 12 ? year + 1 : year
  const actualMonth = newMonth > 12 ? 1 : newMonth
  return `${newYear}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const supabase = getSupabaseAdmin()

  // Busca gastos recurrentes vencidos donde auto_renew=true (o null = legado, se trata como true)
  const { data: due, error } = await supabase
    .from('accounting_expenses')
    .select('*')
    .eq('is_recurring', true)
    .not('renewal_date', 'is', null)
    .lte('renewal_date', today)
    .or('auto_renew.is.null,auto_renew.eq.true')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ count: 0 })

  let count = 0
  for (const expense of due) {
    const nextDate = addPeriod(expense.renewal_date, expense.recurrence)

    // Crea el nuevo registro para el período siguiente
    const { error: insertError } = await supabase
      .from('accounting_expenses')
      .insert({
        expense_date: expense.renewal_date,
        category: expense.category,
        expense_type: expense.expense_type,
        description: expense.description,
        amount: expense.amount,
        receipt_note: expense.receipt_note ?? null,
        is_recurring: true,
        recurrence: expense.recurrence,
        renewal_date: nextDate,
        auto_renew: true,
      })

    if (insertError) continue

    // El registro original pasa a ser histórico (sin renewal_date activa)
    await supabase
      .from('accounting_expenses')
      .update({ renewal_date: null })
      .eq('id', expense.id)

    count++
  }

  return NextResponse.json({ count })
}
