import { NextRequest, NextResponse } from 'next/server'
import { verifyPendingToken, createAdminToken } from '@/lib/session'
import { verifyTotpCode } from '@/lib/totp'
import { getTotpSecret, verifyEmailCode } from '@/lib/twofa'

export async function POST(request: NextRequest) {
  const pending = request.cookies.get('admin_pending')
  if (!pending?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { valid, methods } = await verifyPendingToken(pending.value)
  if (!valid) return NextResponse.json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' }, { status: 401 })

  const { code, method } = await request.json()
  if (!code || !method) return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 })
  if (!methods.includes(method)) return NextResponse.json({ error: 'Método no permitido.' }, { status: 400 })

  let codeValid = false

  if (method === 'totp') {
    const secret = await getTotpSecret()
    if (!secret) return NextResponse.json({ error: 'TOTP no configurado.' }, { status: 400 })
    codeValid = verifyTotpCode(code, secret)
  } else if (method === 'email') {
    codeValid = await verifyEmailCode(code)
  }

  if (!codeValid) {
    return NextResponse.json({ error: 'Código incorrecto.' }, { status: 401 })
  }

  const token = await createAdminToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, path: '/',
  })
  response.cookies.set('admin_pending', '', {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 0, path: '/',
  })
  return response
}
