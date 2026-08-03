import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyAdminToken } from '@/lib/session'
import { checkChangePasswordRateLimit, getClientIp } from '@/lib/rate-limit'
import { saveEmailCode, hasPendingPasswordChange } from '@/lib/twofa'
import { FROM_OPABIZ, REPLY_TO } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// POST /api/auth/change-password/send-email — manda el código de confirmación
// del cambio de contraseña (reusa el mismo código/columna que el 2FA de email
// del login, ver lib/twofa.ts saveEmailCode). Exige sesión admin activa (a
// diferencia de /api/auth/2fa-send-email, que exige admin_pending — este paso
// ocurre estando ya logueado) y que exista un cambio de contraseña pendiente.
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

  if (!(await hasPendingPasswordChange())) {
    return NextResponse.json({ error: 'No hay un cambio de contraseña en curso.' }, { status: 400 })
  }

  const code = generateCode()
  await saveEmailCode(code)

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.ADMIN_USER ?? ''
  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: adminEmail,
    subject: `${code} — Confirmar cambio de contraseña OpaBiz`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:20px 28px;border-radius:10px 10px 0 0">
          <h2 style="color:#fff;font-size:18px;margin:0">OpaBiz — Confirmar cambio de contraseña</h2>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <p style="color:#475569;margin:0 0 20px">Alguien solicitó cambiar la contraseña del panel de administración. Tu código de confirmación:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1C2E44;font-family:monospace">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">Válido por 10 minutos. Si no solicitaste este cambio, ignora este email — tu contraseña actual sigue funcionando.</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
