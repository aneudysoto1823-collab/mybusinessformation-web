import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Efectivo disponible (cash on hand) — no hay integración bancaria, así que
// es un número que el founder actualiza a mano. Usado para calcular Runway.
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await getSupabaseAdmin()
    .from('accounting_settings')
    .select('value, updated_at')
    .eq('key', 'cash_on_hand')
    .maybeSingle()

  const amount = (data?.value as { amount?: number } | null)?.amount ?? null
  return NextResponse.json({ amount, updatedAt: data?.updated_at ?? null })
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const amount = parseFloat(body.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'amount debe ser un número válido' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('accounting_settings')
    .upsert({ key: 'cash_on_hand', value: { amount }, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ amount })
}
