import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { addPeriod } from '@/lib/recurring-expense'

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

  const { data: current } = await getSupabaseAdmin()
    .from('accounting_expenses')
    .select('is_recurring, expense_date, recurrence, renewal_date')
    .eq('id', id)
    .single()

  const allowed: Record<string, unknown> = {}
  for (const f of ['expense_date', 'category', 'expense_type', 'description', 'amount', 'receipt_note',
    'is_recurring', 'recurrence', 'renewal_date', 'receipt_file_url', 'auto_renew']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }
  if (allowed.amount !== undefined) {
    const parsedAmount = parseFloat(allowed.amount as string)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'amount debe ser un número mayor a 0' }, { status: 400 })
    }
    allowed.amount = parsedAmount
  }

  // El form del admin siempre manda renewal_date como '' cuando está vacío — Postgres no acepta
  // '' en una columna date (solo null o una fecha válida), así que se normaliza primero.
  if (allowed.renewal_date === '') allowed.renewal_date = null

  if (allowed.is_recurring !== undefined) allowed.is_recurring = Boolean(allowed.is_recurring)
  if (allowed.is_recurring === false) { allowed.recurrence = 'none'; allowed.renewal_date = null }

  // Solo se calcula un vencimiento automático cuando el gasto se activa como recurrente recién
  // (antes no lo era). Un registro que YA era recurrente y quedó sin vencimiento es casi siempre
  // uno histórico ya superado por process-renewals (el mes anterior de una cadena que ya generó
  // el siguiente) — forzarle una fecha lo reactivaría y generaría cargos duplicados junto con el
  // registro vigente. En ese caso se deja como está (null es válido para Postgres).
  const wasRecurring = current?.is_recurring ?? false
  const willBeRecurring = allowed.is_recurring !== undefined ? allowed.is_recurring : wasRecurring
  const finalRenewalDate = allowed.renewal_date !== undefined ? allowed.renewal_date : (current?.renewal_date ?? null)

  if (willBeRecurring && !finalRenewalDate && !wasRecurring) {
    const expDate = (allowed.expense_date as string) || current?.expense_date
    const rec = (allowed.recurrence as string) || current?.recurrence || 'monthly'
    if (expDate) allowed.renewal_date = addPeriod(expDate, rec)
  }

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
