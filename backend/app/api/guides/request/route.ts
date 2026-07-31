// POST /api/guides/request — Landing pública /guia-gratis.
//
// Leads de redes sociales (Instagram, TikTok, Facebook, etc.) dejan su email
// para recibir la Guía I gratis. Si ese email ya la recibió antes (por
// cualquier canal — campaña B1, esta misma landing, o el pago de una orden),
// no se reenvía: solo se confirma que ya la tiene. Ver backend/lib/guides.ts.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkGuideRequestRateLimit, getClientIp } from '@/lib/rate-limit'
import { GuideRequestInputSchema, parseOr400 } from '@/lib/schemas'
import { FROM_OPABIZ_MARKETING, REPLY_TO } from '@/lib/email-constants'
import { hasReceivedGuide, recordGuideSent, getGuideAttachments, getGuideUrl } from '@/lib/guides'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = parseOr400(GuideRequestInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { name, email, lang } = parsed.data
  const isEs = lang === 'es'
  const safeName = escape(name)

  const ip = getClientIp(req)
  const rate = await checkGuideRequestRateLimit(ip)
  if (!rate.success) {
    return NextResponse.json(
      { error: isEs ? 'Demasiados intentos. Probá de nuevo en un rato.' : 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const alreadySent = await hasReceivedGuide(email, 'guide1')
  if (alreadySent) {
    return NextResponse.json({
      success: true,
      message: isEs
        ? 'Ya te enviamos esta guía antes — revisá tu correo (o la carpeta de spam).'
        : "We've already sent you this guide before — check your inbox (or spam folder).",
    })
  }

  try {
    const attachments = await getGuideAttachments(['guide1'])
    const guideUrl = getGuideUrl('guide1')

    const result = await getResend().emails.send({
      from: FROM_OPABIZ_MARKETING,
      replyTo: REPLY_TO,
      to: email,
      subject: isEs ? 'OpaBiz: 🎁 Su Guía gratuita — Formar su LLC o Corporación en Florida' : 'OpaBiz: 🎁 Your free Guide — Form Your LLC or Corporation in Florida',
      attachments,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:22px;margin:0">OpaBiz</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">Florida Business Formation Center</p>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <h2 style="color:#1C2E44;font-size:20px;margin:0 0 14px">${isEs ? `¡Aquí está su guía, ${safeName}! 🎉` : `Here's your guide, ${safeName}! 🎉`}</h2>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? 'Le adjuntamos el PDF directamente a este correo. Ahí encontrará el paso a paso completo para formar su LLC o Corporación en Florida: nombre, agente registrado, EIN, Operating Agreement, licencias, y todo lo que necesita saber antes de empezar.'
                : "We've attached the PDF directly to this email. Inside you'll find the full step-by-step process to form your LLC or Corporation in Florida: naming, registered agent, EIN, Operating Agreement, licenses, and everything you need to know before you start."}
            </p>
            <p style="text-align:center;margin:26px 0">
              <a href="${guideUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
                ${isEs ? 'Descargar la guía →' : 'Download the guide →'}
              </a>
            </p>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? '¿Listo para dar el siguiente paso? Podemos formar su empresa por usted, sin trámites ni portales por su cuenta.'
                : 'Ready to take the next step? We can form your company for you, no paperwork or portals to figure out on your own.'}
            </p>
            <p style="text-align:center;margin:20px 0">
              <a href="https://opabiz.com" style="color:#2563EB;font-weight:600;text-decoration:none">${isEs ? 'Empezar mi formación →' : 'Start my formation →'}</a>
            </p>
            <p style="margin-top:32px;color:#94a3b8;font-size:12px">
              OpaBiz · opabiz.com<br/>
              Florida Business Formation Center. ${isEs ? 'Somos un servicio de preparación de documentos, no un bufete de abogados.' : 'We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('[/api/guides/request] Resend error:', result.error)
      return NextResponse.json(
        { error: isEs ? 'El servicio de email no está disponible en este momento. Probá de nuevo en unos minutos.' : 'Email service is temporarily unavailable. Please try again in a few minutes.' },
        { status: 502 }
      )
    }

    await recordGuideSent(email, 'guide1', 'landing', name)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/guides/request] Unexpected error:', err)
    return NextResponse.json(
      { error: isEs ? 'Algo salió mal. Probá de nuevo.' : 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
