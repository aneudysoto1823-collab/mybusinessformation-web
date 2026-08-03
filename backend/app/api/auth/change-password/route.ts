import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyAdminToken } from '@/lib/session'
import { checkChangePasswordRateLimit, getClientIp } from '@/lib/rate-limit'
import { getAdminPasswordHash, getTwoFAConfig, stagePasswordChange, applyPendingPasswordChange } from '@/lib/twofa'

// POST /api/auth/change-password — paso 1: valida la contraseña actual y deja
// lista la nueva. Si el admin tiene 2FA activo (TOTP o email), la nueva
// contraseña queda "pending" hasta confirmarla con un código (ver
// /change-password/verify) — así alguien que solo sabe la contraseña actual
// pero no tiene el segundo factor no puede cambiarla. Sin 2FA activo, se
// aplica directo (misma protección que ya tenía el login sin 2FA).
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

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
  }

  const dbHash = await getAdminPasswordHash()
  const rawHash = process.env.ADMIN_PASSWORD_HASH ?? ''
  const currentHash = dbHash
    ? dbHash
    : (rawHash.startsWith('$2') && rawHash.length >= 50 ? rawHash : Buffer.from(rawHash, 'base64').toString('utf-8'))

  if (!currentHash || !bcrypt.compareSync(currentPassword, currentHash)) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 })
  }

  const newHash = bcrypt.hashSync(newPassword, 12)
  const config = await getTwoFAConfig()
  const methods: string[] = []
  if (config.totp_enabled) methods.push('totp')
  if (config.email_enabled) methods.push('email')

  if (methods.length === 0) {
    await applyPendingPasswordChangeDirect(newHash)
    return NextResponse.json({ ok: true, applied: true })
  }

  await stagePasswordChange(newHash)
  return NextResponse.json({ ok: true, requiresVerification: true, methods })
}

// Sin 2FA configurado no hay nada que confirmar — aplica directo reusando el
// mismo camino de staging + apply (evita duplicar el UPDATE de Supabase).
async function applyPendingPasswordChangeDirect(newHash: string) {
  await stagePasswordChange(newHash)
  await applyPendingPasswordChange()
}
