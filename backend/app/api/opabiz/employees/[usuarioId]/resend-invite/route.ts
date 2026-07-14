import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createInviteToken, sendInviteEmail } from '@/lib/opabiz-invite'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST /api/opabiz/employees/[usuarioId]/resend-invite — reenvía el email de
// invitación (nuevo token, el anterior queda huérfano en Redis hasta que
// expire solo). Solo tiene sentido para empleados que todavía no crearon su
// contraseña.
export async function POST(req: NextRequest, { params }: { params: Promise<{ usuarioId: string }> }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { usuarioId } = await params

  const { data: usuario } = await getSupabaseAdmin()
    .from('usuarios')
    .select('id, nombre, email, password_hash')
    .eq('id', usuarioId)
    .eq('rol', 'empleado')
    .maybeSingle()

  if (!usuario) {
    return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  }
  if (usuario.password_hash) {
    return NextResponse.json({ error: 'Este empleado ya tiene contraseña creada' }, { status: 409 })
  }

  const token = await createInviteToken(usuario.id)
  await sendInviteEmail({ email: usuario.email, nombre: usuario.nombre, token })

  return NextResponse.json({ ok: true })
}
