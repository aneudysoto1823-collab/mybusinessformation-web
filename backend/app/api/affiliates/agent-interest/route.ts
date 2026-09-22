// POST /api/affiliates/agent-interest — mini-form "¿Querés convertirte en
// agente?" en la misma landing /afiliados. Programa SEPARADO del de afiliados
// (referido a OpaBiz Connect, empleados de campo) — sin alta pública hoy, así
// que esto solo deja un registro + alerta interna para que el staff contacte
// a la persona y la dé de alta a mano, como siempre.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkAffiliateAgentInterestRateLimit, getClientIp } from '@/lib/rate-limit'
import { AffiliateAgentInterestInputSchema, parseOr400 } from '@/lib/schemas'
import { FROM_OPABIZ_ALERTS, INTERNAL_ALERT_EMAIL, REPLY_TO } from '@/lib/email-constants'

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

  const parsed = parseOr400(AffiliateAgentInterestInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { name, email, phone, brand } = parsed.data
  const isEs = req.nextUrl.searchParams.get('lang') === 'es'

  const ip = getClientIp(req)
  const rate = await checkAffiliateAgentInterestRateLimit(ip)
  if (!rate.success) {
    return NextResponse.json(
      { error: isEs ? 'Demasiados intentos. Probá de nuevo en un rato.' : 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const supabase = getSupabaseAdmin()
  const { error: insertError } = await supabase.from('affiliate_agent_leads').insert({
    name,
    email,
    phone,
    brand: brand === 'fbfc' ? 'fbfc' : 'opabiz',
  })

  if (insertError) {
    console.error('[/api/affiliates/agent-interest] insert error:', insertError)
    return NextResponse.json({ error: isEs ? 'Algo salió mal. Probá de nuevo.' : 'Something went wrong. Please try again.' }, { status: 500 })
  }

  getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: INTERNAL_ALERT_EMAIL,
    subject: `OpaBiz Alerts: 🙋 Interesado en ser agente — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#7c3aed;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">🙋 Interesado en convertirse en agente</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Nombre</td><td style="padding:6px 0;font-weight:600">${escape(name)}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Email</td><td style="padding:6px 4px"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Teléfono</td><td style="padding:6px 0">${escape(phone)}</td></tr>
          </table>
          <p style="margin-top:16px;color:#64748b;font-size:12.5px">Este es un programa distinto al de afiliados — no tiene alta automática. Contactar y dar de alta manualmente en OpaBiz Connect (/admin/opabiz) si corresponde.</p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[/api/affiliates/agent-interest] internal alert error (non-fatal):', err))

  return NextResponse.json({ success: true })
}
