import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { verifyTotpCode } from '@/lib/totp'
import { getTotpSecret, verifyEmailCode, applyPendingPasswordChange } from '@/lib/twofa'
import { checkChangePasswordRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/auth/change-password/verify — paso 2: confirma el cambio de
// contraseña pendiente con el mismo TOTP/email 2FA que ya protege el login.
export async function POST(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session?.value || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await checkChangePasswordRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { code, method } = await request.json()
  if (!code || !method) return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 })

  let codeValid = false
  if (method === 'totp') {
    const secret = await getTotpSecret()
    if (!secret) return NextResponse.json({ error: 'TOTP no configurado.' }, { status: 400 })
    codeValid = verifyTotpCode(code, secret)
  } else if (method === 'email') {
    codeValid = await verifyEmailCode(code)
  } else {
    return NextResponse.json({ error: 'Método no permitido.' }, { status: 400 })
  }

  if (!codeValid) {
    return NextResponse.json({ error: 'Código incorrecto.' }, { status: 401 })
  }

  const applied = await applyPendingPasswordChange()
  if (!applied) {
    return NextResponse.json({ error: 'El cambio de contraseña expiró. Vuelve a intentarlo.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
