import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { peekInviteToken, consumeInviteToken } from '@/lib/opabiz-invite'
import { createEmployeeToken } from '@/lib/opabiz-session'
import { checkOpabizLoginRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/opabiz/auth/accept-invite?token=... — valida el token sin
// consumirlo, para que la página de invitación sepa si mostrar el form o un
// mensaje de "link inválido/expirado".
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const usuarioId = await peekInviteToken(token)
  if (!usuarioId) return NextResponse.json({ valid: false })

  const { data: usuario } = await getSupabaseAdmin()
    .from('usuarios')
    .select('nombre')
    .eq('id', usuarioId)
    .maybeSingle()

  return NextResponse.json({ valid: true, nombre: usuario?.nombre ?? null })
}

// POST /api/opabiz/auth/accept-invite — consume el token, setea la contraseña
// y loguea al empleado directamente (mismo patrón que /api/auth/recover: el
// link de invitación es la autenticación en sí, de un solo uso).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkOpabizLoginRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { token, password } = await req.json().catch(() => ({}))
  if (!token || !password || String(password).length < 8) {
    return NextResponse.json({ error: 'Token y contraseña (mín. 8 caracteres) requeridos' }, { status: 400 })
  }

  const usuarioId = await peekInviteToken(token)
  if (!usuarioId) {
    return NextResponse.json({ error: 'Link inválido o expirado' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const passwordHash = bcrypt.hashSync(password, 10)

  const { error: updateErr } = await supabase
    .from('usuarios')
    .update({ password_hash: passwordHash })
    .eq('id', usuarioId)

  if (updateErr) {
    return NextResponse.json({ error: 'No se pudo guardar la contraseña' }, { status: 500 })
  }

  await consumeInviteToken(token)

  const { data: empleadoRow } = await supabase
    .from('EMPLEADOS')
    .select('id')
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (!empleadoRow) {
    return NextResponse.json({ error: 'No existe registro de EMPLEADOS para este usuario' }, { status: 404 })
  }

  const jwtToken = await createEmployeeToken({ usuarioId, empleadosId: empleadoRow.id })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('opabiz_session', jwtToken, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, path: '/',
  })
  return response
}
