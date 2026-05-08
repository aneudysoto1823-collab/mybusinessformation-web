import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminToken } from '@/lib/session'
import { checkAdminLoginRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit ANTES de leer body o ejecutar bcrypt: protege contra brute
  // force y contra DoS por costo de bcrypt (hash factor 12 es caro a propósito).
  const ip = getClientIp(request)
  const rl = await checkAdminLoginRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    )
  }

  const { user, password } = await request.json()

  const expectedUser = process.env.ADMIN_USER
  const rawHash = process.env.ADMIN_PASSWORD_HASH ?? ''

  if (!expectedUser || !rawHash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Acepta hash bcrypt crudo ($2b$12$...) o codificado en base64.
  // El base64 evita que el parser dotenv de Next.js expanda los $ del hash.
  const passwordHash = rawHash.startsWith('$2') && rawHash.length >= 50
    ? rawHash
    : Buffer.from(rawHash, 'base64').toString('utf-8')

  if (user === expectedUser && bcrypt.compareSync(password, passwordHash)) {
    const token = await createAdminToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    })
    return response
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
