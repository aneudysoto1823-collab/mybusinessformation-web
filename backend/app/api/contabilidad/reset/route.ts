import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Deletes all accounting data — use only to clear test data before going live
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (body.confirm !== 'RESET_CONTABILIDAD') {
    return NextResponse.json({ error: 'Falta confirmación. Envía { "confirm": "RESET_CONTABILIDAD" }' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Order matters: income/expenses reference clients
  const [incomeRes, expensesRes, clientsRes] = await Promise.all([
    supabase.from('accounting_income').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('accounting_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('accounting_clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ])

  const errors = [incomeRes.error, expensesRes.error, clientsRes.error].filter(Boolean)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.map(e => e!.message).join(', ') }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Todos los datos de contabilidad han sido eliminados.' })
}
