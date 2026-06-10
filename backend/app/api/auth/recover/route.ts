import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import { createAdminToken } from '@/lib/session'
import { checkAuthRecoverRateLimit, getClientIp } from '@/lib/rate-limit'
import crypto from 'crypto'

function getRedis() {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}
function getResend() { return new Resend(process.env.RESEND_API_KEY) }

// POST /api/auth/recover  — solicita link de recuperación
export async function POST(req: NextRequest) {
  // Rate limit antes de leer body o tocar Redis/Resend — protege contra spam
  // del inbox del admin. 3/h/IP es generoso para humanos, restrictivo para abuse.
  const ip = getClientIp(req)
  const rl = await checkAuthRecoverRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: 'Too many recovery attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const { email } = await req.json()

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) return NextResponse.json({ ok: true })

  if (!email || email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ ok: false, notFound: true }, { status: 200 })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const redis = getRedis()
  await redis.set(`recover:${token}`, '1', { ex: 900 }) // 15 min TTL

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'
  const link    = `${baseUrl}/login/recover/${token}`

  await getResend().emails.send({
    from:    'OpaBiz Admin <onboarding@resend.dev>',
    to:      adminEmail,
    subject: '🔑 Admin password recovery — OpaBiz',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#1C2E44;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz — Admin Recovery</p>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
          <p style="color:#1e293b;font-size:.95rem">A password recovery link was requested for the admin account.</p>
          <p style="color:#1e293b;font-size:.95rem">Click the button below to access the admin panel. This link expires in <strong>15 minutes</strong>.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${link}" style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem">
              Access Admin Panel →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:.78rem">If you didn't request this, ignore this email. The link will expire automatically.</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}

// GET /api/auth/recover/[token]  — valida token y crea sesión
export async function GET(req: NextRequest) {
  const token = req.nextUrl.pathname.split('/').pop()
  if (!token) return NextResponse.redirect(new URL('/login?error=invalid', req.url))

  const redis = getRedis()
  const valid = await redis.get(`recover:${token}`)
  if (!valid) return NextResponse.redirect(new URL('/login?error=expired', req.url))

  await redis.del(`recover:${token}`)

  const session  = await createAdminToken()
  const response = NextResponse.redirect(new URL('/admin', req.url))
  response.cookies.set('admin_session', session, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, path: '/',
  })
  return response
}
