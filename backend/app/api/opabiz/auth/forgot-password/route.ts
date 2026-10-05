import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createInviteToken, sendPasswordResetEmail, RESET_TTL_SECONDS } from '@/lib/opabiz-invite'
import { checkOpabizRecoverRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/auth/forgot-password — { email }. Si el email es de un
// empleado activo, le manda un link (1h, un solo uso) a /opabiz/invite/[token]
// para elegir una contraseña nueva. Respuesta siempre genérica: nunca revela
// si el email tiene cuenta (mismo criterio que /api/client-auth).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkOpabizRecoverRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados pedidos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { email } = await req.json().catch(() => ({}))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const { data: usuario } = await getSupabaseAdmin()
    .from('usuarios')
    .select('id, nombre, email, estado')
    .eq('email', email.toLowerCase().trim())
    .eq('rol', 'empleado')
    .maybeSingle()

  if (usuario && usuario.estado === 'activo') {
    try {
      const token = await createInviteToken(usuario.id, RESET_TTL_SECONDS)
      await sendPasswordResetEmail({ email: usuario.email, nombre: usuario.nombre, token })
    } catch (err) {
      console.error('[opabiz] forgot-password error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
