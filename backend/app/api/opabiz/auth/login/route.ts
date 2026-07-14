import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createEmployeeToken } from '@/lib/opabiz-session'
import { checkOpabizLoginRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/auth/login — email+password del empleado. Solo usuarios con
// rol='empleado', estado='activo' y password_hash ya seteado (ver flujo de
// invitación en /api/opabiz/employees) pueden loguearse.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await checkOpabizLoginRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'email y password requeridos' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, password_hash, estado')
    .eq('email', String(email).toLowerCase().trim())
    .eq('rol', 'empleado')
    .maybeSingle()

  if (!usuario || !usuario.password_hash || usuario.estado !== 'activo' ||
      !bcrypt.compareSync(password, usuario.password_hash)) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const { data: empleadoRow } = await supabase
    .from('EMPLEADOS')
    .select('id')
    .eq('usuario_id', usuario.id)
    .maybeSingle()

  if (!empleadoRow) {
    return NextResponse.json({ error: 'No existe registro de EMPLEADOS para este usuario' }, { status: 404 })
  }

  const token = await createEmployeeToken({ usuarioId: usuario.id, empleadosId: empleadoRow.id })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('opabiz_session', token, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, path: '/',
  })
  return response
}
