// POST /api/affiliates/apply — landing pública /afiliados (ambas marcas).
//
// Un solo endpoint para dos tipos de solicitud: 'affiliate' (referido con
// cupón, requiere PTIN) y 'agent' (agente de campo de OpaBiz Connect, gana
// comisión por orden asistida en persona, sin PTIN ni cupón). Queda en
// status='pending' hasta que el admin la aprueba a mano desde /admin/afiliados
// — ahí recién se genera el Promotion Code de Stripe (solo para 'affiliate').
// Ver lib/affiliates.ts.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkAffiliateApplyRateLimit, getClientIp } from '@/lib/rate-limit'
import { AffiliateApplicationInputSchema, parseOr400 } from '@/lib/schemas'
import { AFFILIATE_COMMISSION_DEFAULT_PERCENT, AGENT_COMMISSION_DEFAULT_PERCENT } from '@/lib/affiliates'
import {
  brandFrom, brandReplyTo, brandSubjectPrefix, brandHeaderHtml, brandFooterLine, brandDisclosureHtml,
  FROM_OPABIZ_ALERTS, INTERNAL_ALERT_EMAIL, REPLY_TO, PHYSICAL_MAILING_ADDRESS,
  type EmailBrand,
} from '@/lib/email-constants'

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

  const parsed = parseOr400(AffiliateApplicationInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const {
    name, email, phone, ptin, type, brand, lang,
    addressStreet, addressCity, addressState, addressZip, employmentStatus, employerName, experienceNotes,
  } = parsed.data
  const emailBrand: EmailBrand = brand === 'fbfc' ? 'fbfc' : 'opabiz'
  const isEs = lang === 'es'
  const isAgent = type === 'agent'

  const ip = getClientIp(req)
  const rate = await checkAffiliateApplyRateLimit(ip)
  if (!rate.success) {
    return NextResponse.json(
      { error: isEs ? 'Demasiados intentos. Probá de nuevo en un rato.' : 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const supabase = getSupabaseAdmin()
  const { error: insertError } = await supabase.from('affiliates').insert({
    name,
    email,
    phone,
    ptin: ptin ?? null,
    application_type: type,
    commission_percent: isAgent ? AGENT_COMMISSION_DEFAULT_PERCENT : AFFILIATE_COMMISSION_DEFAULT_PERCENT,
    brand: emailBrand,
    lang: isEs ? 'es' : 'en',
    status: 'pending',
    // Solo 'agent' los pide en el form — quedan null para 'affiliate'.
    address_street: addressStreet ?? null,
    address_city: addressCity ?? null,
    address_state: addressState ?? null,
    address_zip: addressZip ?? null,
    employment_status: employmentStatus ?? null,
    employer_name: employerName ?? null,
    experience_notes: experienceNotes ?? null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({
        error: isEs
          ? 'Ya existe una aplicación con ese correo. Si querés consultar su estado, escribinos.'
          : 'An application with that email already exists. Reach out to us if you want to check its status.',
      }, { status: 409 })
    }
    console.error('[/api/affiliates/apply] insert error:', insertError)
    return NextResponse.json({ error: isEs ? 'Algo salió mal. Probá de nuevo.' : 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const safeName = escape(name)
  const subjectPrefix = brandSubjectPrefix(emailBrand)
  const programLabel = isAgent ? (isEs ? 'Programa de Agentes' : 'Field Agent Program') : (isEs ? 'Programa de Afiliados' : 'Affiliate Program')

  getResend().emails.send({
    from: brandFrom(emailBrand),
    replyTo: brandReplyTo(emailBrand),
    to: email,
    subject: isEs ? `${subjectPrefix}Recibimos tu aplicación al ${programLabel}` : `${subjectPrefix}We received your ${programLabel} application`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${brandHeaderHtml(emailBrand)}</tr></table>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `¡Gracias, ${safeName}!` : `Thank you, ${safeName}!`}</h2>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? `Recibimos tu aplicación al ${programLabel}. Nuestro equipo la va a revisar y te vamos a contactar por este mismo correo en los próximos días con el resultado.`
                : `We received your ${programLabel} application. Our team will review it and reach out to you at this email address in the next few days with the result.`}
            </p>
            <p style="margin-top:32px;color:#94a3b8;font-size:12px;line-height:1.6">
              ${brandFooterLine(emailBrand)}<br/>
              ${brandDisclosureHtml(emailBrand, isEs ? 'es' : 'en')}<br/>
              ${PHYSICAL_MAILING_ADDRESS}
            </p>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[/api/affiliates/apply] applicant email error (non-fatal):', err))

  getResend().emails.send({
    from: FROM_OPABIZ_ALERTS,
    replyTo: REPLY_TO,
    to: INTERNAL_ALERT_EMAIL,
    subject: `OpaBiz Alerts: 🆕 Nueva aplicación de ${isAgent ? 'agente' : 'afiliado'} — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#7c3aed;padding:20px 28px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:18px;margin:0">🆕 Nueva aplicación — ${programLabel}</h1>
        </div>
        <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;width:40%">Tipo</td><td style="padding:6px 0;font-weight:600">${isAgent ? 'Agente' : 'Afiliado'}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Nombre</td><td style="padding:6px 4px;font-weight:600">${escape(name)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Teléfono</td><td style="padding:6px 4px">${escape(phone)}</td></tr>
            ${ptin ? `<tr><td style="padding:6px 0;color:#64748b">PTIN</td><td style="padding:6px 0">${escape(ptin)}</td></tr>` : ''}
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Marca</td><td style="padding:6px 4px">${emailBrand}</td></tr>
            ${isAgent ? `
            <tr><td style="padding:6px 0;color:#64748b">Dirección</td><td style="padding:6px 0">${escape([addressStreet, addressCity, addressState, addressZip].filter(Boolean).join(', '))}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Situación laboral</td><td style="padding:6px 4px">${employmentStatus === 'employed' ? `Empleado${employerName ? ` — ${escape(employerName)}` : ''}` : 'Independiente'}</td></tr>
            ${experienceNotes ? `<tr><td style="padding:6px 0;color:#64748b">Experiencia</td><td style="padding:6px 0">${escape(experienceNotes)}</td></tr>` : ''}
            ` : ''}
          </table>
          <div style="text-align:center;margin:18px 0 4px">
            <a href="https://opabiz.com/admin/afiliados" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Revisar en el panel admin →</a>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('[/api/affiliates/apply] internal alert error (non-fatal):', err))

  return NextResponse.json({ success: true })
}
