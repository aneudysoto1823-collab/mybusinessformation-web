import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/me/created-orders — órdenes que el empleado logueado generó
// vía intake asistida (Order.assistedByEmpleadosId), no las que le asignaron
// como tareas (eso es /api/opabiz/me/orders, tabla ordenes_opabiz — sin FK de
// vuelta a Order, así que acá se consulta Order directamente). Select
// explícito de columnas seguras — nunca einTaxIdEnc, draftSnapshot completo,
// ni members.
export async function GET(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, updatedAt, isDraft, paymentStatus, status, companyName, firstName, lastName, email, entityType')
    .eq('assistedByEmpleadosId', session.empleadosId)
    .order('createdAt', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ordenes: data ?? [] })
}
