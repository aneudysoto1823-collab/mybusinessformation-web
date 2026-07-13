import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ClientSignupInputSchema, parseOr400 } from '@/lib/schemas'
import { checkClientAuthRateLimit, getClientIp } from '@/lib/rate-limit'
import { REPLY_TO, FROM_OPABIZ } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'

function setSession(orderId: string) {
  const response = NextResponse.json({ success: true, orderId })
  response.cookies.set('client_session', orderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}

function sendAccountCreatedEmail(order: { email: string; firstName: string; fbfc: string }) {
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: Your account is ready — ${order.fbfc}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">OpaBiz</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">Florida Business Formation Center</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Welcome, ${order.firstName}!</h2>
          <p style="color:#475569;line-height:1.7">
            Your account is ready. Whenever you're ready to start your business formation,
            just log in at opabiz.com with your email and password.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Your account number</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#1e40af;letter-spacing:1px">${order.fbfc}</p>
          </div>
          <div style="text-align:center;margin:26px 0">
            <a href="${SITE_URL}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:700">
              Go to opabiz.com →
            </a>
          </div>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
            OpaBiz · opabiz.com<br/>
            This is a transactional email. We are a document preparation service, not a law firm.
          </p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[/api/client-auth/signup] account-created email error (non-fatal):', err))
}

// Crea una cuenta de cliente ANTES de haber empezado ninguna orden — hasta
// ahora la única forma de tener contraseña era loguearse primero con un
// número FBFC (ver /api/client-auth/set-password) y el único login "sin
// orden" no existía. Reusa el mecanismo de borrador (isDraft:true) que ya
// existe para "Save" en el form: crea una fila Order casi vacía con
// client_password_hash, y la deja lista para que el cliente la complete
// cuando arranque su formación (ver fmFetchAndRestoreDraft en page.tsx).
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await checkClientAuthRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const raw = await request.json().catch(() => ({}))
  const parsed = parseOr400(ClientSignupInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { firstName, email, password } = parsed.data

  const supabase = getSupabaseAdmin()

  // Si ya existe una cuenta (orden con contraseña) para este email, no crear
  // una segunda — el cliente debe iniciar sesión en vez de registrarse de nuevo.
  const { data: existing, error: existingErr } = await supabase
    .from('Order')
    .select('id, client_password_hash')
    .eq('email', email)
    .not('client_password_hash', 'is', null)
    .limit(1)

  if (existingErr) {
    console.error('[/api/client-auth/signup] lookup error:', existingErr)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const passwordHash = bcrypt.hashSync(password, 10)

  const { error: insertErr } = await supabase.from('Order').insert({
    id,
    createdAt: now,
    updatedAt: now,
    firstName,
    lastName: '-',
    email,
    country: 'US',
    companyName: 'Pending',
    entityType: 'llc',
    speed: 'standard',
    package: 'basic',
    amount: 0,
    currency: 'USD',
    registeredAgent: 'us',
    paymentStatus: 'pending',
    status: 'pending',
    isDraft: true,
    client_password_hash: passwordHash,
  })

  if (insertErr) {
    console.error('[/api/client-auth/signup] insert error:', insertErr)
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
  }

  const fbfc = `FBFC-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  sendAccountCreatedEmail({ email, firstName, fbfc })

  return setSession(id)
}
