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
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let query = getSupabaseAdmin()
    .from('accounting_clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, phone, email, status = 'active', notes, order_id } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name es requerido' }, { status: 400 })

  // Si viene order_id, verificar que existe y auto-completar campos vacíos
  let clientData: Record<string, unknown> = { name: name.trim(), phone, email, status, notes, order_id: order_id || null }

  if (order_id) {
    const { data: order } = await getSupabaseAdmin()
      .from('Order')
      .select('firstName, lastName, email, phone')
      .eq('id', order_id)
      .single()
    if (order) {
      clientData = {
        ...clientData,
        name: name.trim() || `${order.firstName} ${order.lastName}`,
        email: email || order.email,
        phone: phone || order.phone,
      }
    }
  }

  const { data, error } = await getSupabaseAdmin()
    .from('accounting_clients')
    .insert(clientData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data }, { status: 201 })
}
