// POST /api/admin/affiliates/[id]/resend-invite — botón "Reenviar link" en
// /admin/afiliados para un agente ya aprobado. Reusa exactamente la misma
// infraestructura que POST /api/opabiz/employees/[usuarioId]/resend-invite
// (mismo guard: solo tiene sentido si el empleado todavía no creó su
// contraseña) — acá el punto de entrada es la fila de affiliates en vez del
// usuarioId directo, porque el admin de /admin/afiliados no tiene ese id a
// mano.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { createInviteToken, sendInviteEmail } from '@/lib/opabiz-invite'

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
    .select('empleados_id, application_type')
    .eq('id', id)
    .maybeSingle()
  if (fetchError || !affiliate) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }
  if (affiliate.application_type !== 'agent' || !affiliate.empleados_id) {
    return NextResponse.json({ error: 'Este afiliado no tiene una cuenta de OpaBiz Connect vinculada' }, { status: 400 })
  }

  const { data: empleado, error: empleadoError } = await supabase
    .from('EMPLEADOS')
    .select('usuario_id')
    .eq('id', affiliate.empleados_id)
    .maybeSingle()
  if (empleadoError || !empleado) {
    return NextResponse.json({ error: 'No se encontró la cuenta de OpaBiz Connect vinculada' }, { status: 404 })
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id, email, nombre, password_hash')
    .eq('id', empleado.usuario_id)
    .maybeSingle()
  if (usuarioError || !usuario) {
    return NextResponse.json({ error: 'No se encontró el usuario de la cuenta' }, { status: 404 })
  }
  if (usuario.password_hash) {
    return NextResponse.json({ error: 'Este agente ya creó su contraseña, no hace falta reenviar el link' }, { status: 409 })
  }

  const token = await createInviteToken(usuario.id)
  await sendInviteEmail({ email: usuario.email, nombre: usuario.nombre, token })

  return NextResponse.json({ success: true })
}
