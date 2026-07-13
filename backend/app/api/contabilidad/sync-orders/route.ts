import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { insertIncomeWithInvoiceNumber } from '@/lib/invoice-number'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

function resolveServiceType(order: { entityType: string; package: string }): string {
  if (order.package === 'addon') return 'addon'
  if (order.package === 'new_business_letter') return 'new_business_letter'
  if (order.entityType === 'llc') return 'llc'
  if (order.entityType === 'corp') return 'corp'
  return 'other'
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  // Fetch all orders
  const { data: orders, error: ordersErr } = await supabase
    .from('Order')
    .select('id, firstName, lastName, email, phone, entityType, package, amount, paymentStatus, stripePaymentId, createdAt')
    .order('createdAt', { ascending: true })

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })
  if (!orders || orders.length === 0) return NextResponse.json({ imported: 0, skipped: 0 })

  // Get existing order_ids already in accounting to avoid duplicates
  const { data: existingIncome } = await supabase
    .from('accounting_income')
    .select('order_id')
    .not('order_id', 'is', null)

  const { data: existingClients } = await supabase
    .from('accounting_clients')
    .select('order_id')
    .not('order_id', 'is', null)

  const syncedIncomeOrderIds = new Set((existingIncome ?? []).map(r => r.order_id))
  const syncedClientOrderIds = new Set((existingClients ?? []).map(r => r.order_id))

  let imported = 0
  let skipped = 0

  for (const order of orders) {
    if (syncedIncomeOrderIds.has(order.id)) {
      skipped++
      continue
    }

    // Create accounting client if not already linked; fetch id if it already exists
    let clientId: string | null = null
    if (!syncedClientOrderIds.has(order.id)) {
      const { data: newClient } = await supabase
        .from('accounting_clients')
        .insert({
          name: `${order.firstName} ${order.lastName}`,
          email: order.email || null,
          phone: order.phone || null,
          status: 'active',
          order_id: order.id,
        })
        .select('id')
        .single()
      clientId = newClient?.id ?? null
    } else {
      const { data: existingClient } = await supabase
        .from('accounting_clients')
        .select('id')
        .eq('order_id', order.id)
        .single()
      clientId = existingClient?.id ?? null
    }

    const isPaid = order.paymentStatus === 'paid'
    const paymentMethod = order.stripePaymentId ? 'stripe' : 'other'
    const invoiceDate = order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]

    await insertIncomeWithInvoiceNumber(supabase, invoice_number => ({
      client_id: clientId,
      order_id: order.id,
      invoice_number,
      invoice_date: invoiceDate,
      service_type: resolveServiceType(order),
      amount: order.amount ?? 0,
      payment_method: paymentMethod,
      payment_status: isPaid ? 'paid' : 'pending',
      amount_paid: isPaid ? (order.amount ?? 0) : 0,
      notes: null,
    }))

    imported++
  }

  return NextResponse.json({ imported, skipped })
}
