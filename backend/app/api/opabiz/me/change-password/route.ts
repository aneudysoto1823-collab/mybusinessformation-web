import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { checkOpabizChangePasswordRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/change-password — { currentPassword, newPassword }.
// El empleado logueado cambia su propia contraseña; exige la actual para que
// una sesión abierta en un celular ajeno no alcance para tomar la cuenta.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getClientIp(req)
  const rl = await checkOpabizChangePasswordRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Completá la contraseña actual y la nueva' }, { status: 400 })
  }
  if (String(newPassword).length < 8) {
    return NextResponse.json({ error: 'La contraseña nueva debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('password_hash')
    .eq('id', session.usuarioId)
    .maybeSingle()

  if (!usuario?.password_hash || !bcrypt.compareSync(String(currentPassword), usuario.password_hash)) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
  }

  const { error } = await supabase
    .from('usuarios')
    .update({ password_hash: bcrypt.hashSync(String(newPassword), 10) })
    .eq('id', session.usuarioId)

  if (error) return NextResponse.json({ error: 'No se pudo guardar la contraseña' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
