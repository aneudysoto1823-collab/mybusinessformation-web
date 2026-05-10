import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminToken, createPendingToken } from '@/lib/session'
import { checkAdminLoginRateLimit, getClientIp } from '@/lib/rate-limit'
import { getTwoFAConfig } from '@/lib/twofa'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await checkAdminLoginRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { user, password } = await request.json()

  const expectedUser = process.env.ADMIN_USER
  const rawHash = process.env.ADMIN_PASSWORD_HASH ?? ''

  if (!expectedUser || !rawHash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const passwordHash = rawHash.startsWith('$2') && rawHash.length >= 50
    ? rawHash
    : Buffer.from(rawHash, 'base64').toString('utf-8')

  if (!(user === expectedUser && bcrypt.compareSync(password, passwordHash))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Credenciales válidas — verificar si tiene 2FA activo
  const config = await getTwoFAConfig()
  const methods: string[] = []
  if (config.totp_enabled) methods.push('totp')
  if (config.email_enabled) methods.push('email')

  if (methods.length === 0) {
    // Sin 2FA — sesión directa
    const token = await createAdminToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', token, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 60 * 60 * 8, path: '/',
    })
    return response
  }

  // Con 2FA — token pendiente de 5 min
  const pending = await createPendingToken(methods)
  const response = NextResponse.json({ ok: true, requiresTwoFactor: true, methods })
  response.cookies.set('admin_pending', pending, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 5, path: '/',
  })
  return response
}
