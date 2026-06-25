import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logAdminAction } from '@/lib/audit-log'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  return NextResponse.json({ order: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  const allowed: Record<string, unknown> = {}
  if (body.status !== undefined) allowed.status = body.status
  if (body.notes  !== undefined) allowed.notes  = body.notes
  // addons (JSON) — usado por la hoja de trabajo de servicios para persistir las
  // ediciones del equipo (ServicesFilingForm). Debe ser un objeto.
  if (body.addons !== undefined && body.addons && typeof body.addons === 'object') {
    allowed.addons = body.addons
  }

  // Snapshot before (solo campos que estamos por cambiar) para el audit log.
  const { data: before } = await getSupabaseAdmin()
    .from('Order')
    .select(Object.keys(allowed).join(',') || 'id')
    .eq('id', id)
    .single()

  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log — fail-quiet (no bloquea la respuesta al admin si falla).
  // addons puede contener datos sensibles (SSN/ITIN/EIN) → se redacta para no
  // duplicarlos en admin_audit_log; solo se registra que cambió.
  const redact = (o: Record<string, unknown> | null | undefined) => {
    if (!o) return o ?? null
    return 'addons' in o ? { ...o, addons: '[redacted]' } : o
  }
  await logAdminAction({
    action: 'order.update',
    entity: 'Order',
    entityId: id,
    before: redact(before as Record<string, unknown> | null),
    after: redact(allowed),
    request,
  })

  return NextResponse.json({ success: true, data })
}
