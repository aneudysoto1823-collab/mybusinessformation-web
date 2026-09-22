// POST /api/admin/affiliates/[id]/mark-paid — panel /admin/afiliados.
//
// Puramente contable: marca todas las filas `affiliate_commissions` no
// pagadas de este afiliado como pagadas, mueve el acumulado de
// total_commission_owed a total_commission_paid. El pago real (Zelle/lo que
// sea) sigue siendo manual — esto no mueve plata, solo registra que ya se
// hizo, como el resto del proyecto (facturas RAI, reembolsos).

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: affiliate, error: fetchError } = await supabase
    .from('affiliates')
    .select('id, total_commission_owed, total_commission_paid')
    .eq('id', id)
    .single()
  if (fetchError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }
  if (Number(affiliate.total_commission_owed) <= 0) {
    return NextResponse.json({ error: 'No hay saldo pendiente para este afiliado.' }, { status: 409 })
  }

  const now = new Date().toISOString()

  const { error: commissionsError } = await supabase
    .from('affiliate_commissions')
    .update({ paid: true, paid_at: now })
    .eq('affiliate_id', id)
    .eq('paid', false)
  if (commissionsError) {
    return NextResponse.json({ error: String(commissionsError) }, { status: 500 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('affiliates')
    .update({
      total_commission_paid: Number(affiliate.total_commission_paid || 0) + Number(affiliate.total_commission_owed),
      total_commission_owed: 0,
      last_paid_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()
  if (updateError) {
    return NextResponse.json({ error: String(updateError) }, { status: 500 })
  }

  return NextResponse.json({ affiliate: updated })
}
