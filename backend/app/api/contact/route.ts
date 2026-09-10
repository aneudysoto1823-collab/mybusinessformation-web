// POST /api/contact — Public contact form.
//
// Recibe el form de /contact (opabiz.com) o su clon /new-business/contact
// (mybusinessformation.com, rewrite de /contact en ese host — ver
// next.config.ts) y envía un email vía Resend. Reply-To = email del
// remitente, para que admin pueda responder con un click sin tener que
// copiar/pegar. La marca (FROM/TO/subject/HTML) se resuelve por el header
// Origin validado contra la allowlist (resolveOrigin/brandFromOrigin, mismo
// mecanismo que ya usan los endpoints de checkout — auditoría 2026-08-17).
//
// El FROM_EMAIL viene de la env var CONTACT_FROM_EMAIL. Mientras no esté
// verificado el dominio en Resend cae al fallback 'onboarding@resend.dev'
// (mismo patrón que el resto de notifications.ts del proyecto).

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkContactRateLimit, getClientIp } from '@/lib/rate-limit'
import { CONTACT_TO_EMAIL as TO_EMAIL_OPABIZ, REPLY_TO_FBFC, FROM_OPABIZ_CONTACT, FROM_FBFC, type EmailBrand, brandFrom, brandReplyTo, brandSubjectPrefix, brandHeaderHtml, brandFooterLine } from '@/lib/email-constants'
import { resolveOrigin, brandFromOrigin } from '@/lib/request-origin'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; phone?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const phone = (body.phone || '').trim()
  const subject = (body.subject || '').trim()
  const message = (body.message || '').trim()

  // Validación mínima
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!subject || subject.length < 2) {
    return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 })
  }
  if (!message || message.length < 5) {
    return NextResponse.json({ error: 'Please enter a longer message.' }, { status: 400 })
  }
  // Límites máximos defensivos contra payload abuse
  if (name.length > 120 || email.length > 254 || phone.length > 40 || subject.length > 200 || message.length > 4000) {
    return NextResponse.json({ error: 'One or more fields exceed the allowed length.' }, { status: 400 })
  }

  // Rate limit anti-spam. checkContactRateLimit retorna { success, ... }
  // donde success=true significa "allowed". El nombre del campo es success
  // (no allowed) — el bug original devolvía 429 a TODOS los visitors.
  const ip = getClientIp(req)
  const rate = await checkContactRateLimit(ip)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many messages from this IP. Please try again in an hour.' },
      { status: 429 }
    )
  }

  const safeName = escape(name)
  const safeEmail = escape(email)
  const safePhone = phone ? escape(phone) : '—'
  const safeSubject = escape(subject)
  const safeMessage = escape(message).replace(/\n/g, '<br>')

  const origin = resolveOrigin(req)
  const brand: EmailBrand = brandFromOrigin(origin)
  const isFBFC = brand === 'fbfc'
  // Admin (interno, no de cara al cliente): FROM_OPABIZ_CONTACT tiene su
  // propio display name ("OpaBiz Contact", distinto de brandFrom()'s
  // "OpaBiz") — no hay equivalente "... Contact" para FBFC, así que ese
  // matiz solo aplica al lado OpaBiz. El "to" de FBFC reusa REPLY_TO_FBFC a
  // falta de una bandeja de contacto dedicada — ver nota en CLAUDE.md.
  const fromAdmin = isFBFC ? FROM_FBFC : FROM_OPABIZ_CONTACT
  const toAdmin = isFBFC ? REPLY_TO_FBFC : TO_EMAIL_OPABIZ
  const subjectPrefix = isFBFC ? '' : 'OpaBiz Contact: '
  const adminDomainLine = isFBFC ? 'mybusinessformation.com — Contact form' : 'opabiz.com — Contact form'

  try {
    const result = await getResend().emails.send({
      from: fromAdmin,
      to: toAdmin,
      replyTo: email,
      subject: `${subjectPrefix}${subject}`.slice(0, 240),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:20px 28px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:18px;margin:0;font-weight:600">New contact message</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">${adminDomainLine}</p>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <table cellpadding="6" style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#64748b;width:110px"><strong>From</strong></td><td>${safeName}</td></tr>
              <tr><td style="color:#64748b"><strong>Email</strong></td><td><a href="mailto:${safeEmail}" style="color:#2563eb">${safeEmail}</a></td></tr>
              <tr><td style="color:#64748b"><strong>Phone</strong></td><td>${safePhone}</td></tr>
              <tr><td style="color:#64748b"><strong>Subject</strong></td><td>${safeSubject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:6px">Message</div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${safeMessage}</div>
            <p style="font-size:12px;color:#94a3b8;margin-top:18px">Reply directly to this email and it will land in ${safeEmail}.</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('[/api/contact] Resend error:', result.error)
      return NextResponse.json({ error: 'Email service is temporarily unavailable. Please try WhatsApp.' }, { status: 502 })
    }

    // ── Confirmación al visitor (D2) — non-blocking ────────────────────────────
    // Le confirma al cliente que recibimos su mensaje y que respondemos en 24h.
    // Sin esto el cliente solo ve el panel verde "Got it" pero no tiene constancia
    // en su inbox de que el mensaje salió. Si este envío falla, no rompe el flow
    // principal (solo loguea).
    getResend().emails.send({
      from: brandFrom(brand),
      replyTo: brandReplyTo(brand),
      to: email,
      subject: `${brandSubjectPrefix(brand)}✅ We got your message — we'll respond within 24 hours`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                ${brandHeaderHtml(brand)}
              </tr></table>
            </div>
            <div style="padding:32px">
              <h2 style="color:#1C2E44;font-size:20px;margin:0 0 14px">Hi ${safeName}, we got your message ✅</h2>
              <p style="color:#475569;line-height:1.7">
                Thanks for reaching out${isFBFC ? '' : ' to OpaBiz'}. Our team has received your message and will reply to your email within
                <strong style="color:#1C2E44">24 business hours</strong>.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;margin:20px 0">
                <p style="margin:0 0 8px;font-size:13px;color:#64748b"><strong>Your message</strong></p>
                <p style="margin:0;font-size:13px;color:#1e293b"><strong>Subject:</strong> ${safeSubject}</p>
                <div style="margin-top:8px;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">${safeMessage}</div>
              </div>
              <p style="color:#475569;line-height:1.7">
                Need it sooner? Reach us on
                <a href="https://wa.me/13528377755" style="color:#059669;font-weight:600">WhatsApp</a>
                and a team member will help you right away.
              </p>
              <p style="margin-top:32px;color:#94a3b8;font-size:12px">
                ${brandFooterLine(brand)}<br/>We are a document preparation service, not a law firm.
              </p>
            </div>
          </div>
        </div>
      `,
    }).catch(err => console.error('[/api/contact] Confirmation to visitor failed (non-fatal):', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/contact] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again or use WhatsApp.' }, { status: 500 })
  }
}
