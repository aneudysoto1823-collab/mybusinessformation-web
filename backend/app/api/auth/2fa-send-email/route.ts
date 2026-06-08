import { NextRequest, NextResponse } from 'next/server'
import { verifyPendingToken } from '@/lib/session'
import { saveEmailCode } from '@/lib/twofa'
import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request: NextRequest) {
  const pending = request.cookies.get('admin_pending')
  if (!pending?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { valid, methods } = await verifyPendingToken(pending.value)
  if (!valid || !methods.includes('email')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = generateCode()
  await saveEmailCode(code)

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.ADMIN_USER ?? ''
  await getResend().emails.send({
    from: 'onboarding@resend.dev',
    to: adminEmail,
    subject: `${code} — Tu código de verificación OpaBiz`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:20px 28px;border-radius:10px 10px 0 0">
          <h2 style="color:#fff;font-size:18px;margin:0">OpaBiz — Admin 2FA</h2>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <p style="color:#475569;margin:0 0 20px">Tu código de verificación para acceder al panel de administración:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1C2E44;font-family:monospace">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">Válido por 10 minutos. Si no solicitaste este código, cambia tu contraseña inmediatamente.</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
