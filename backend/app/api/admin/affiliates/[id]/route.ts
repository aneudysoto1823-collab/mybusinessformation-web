// PATCH /api/admin/affiliates/[id] — panel /admin/afiliados.
//
// action: 'approve'   — genera el Promotion Code real en Stripe (sobre el
//                        Coupon compartido, ver lib/affiliates.ts), marca
//                        approved, manda el email con el código al afiliado.
//         'reject'     — marca rejected, manda un email breve de rechazo.
//         'suspend'    — marca suspended (afiliado ya aprobado, deja de
//                        poder generar comisión — no borra el código de
//                        Stripe, solo se ignora porque el filtro de
//                        recordAffiliateCommissionForOrder exige status='approved').
//         'update'     — solo edita commission_percent y/o notes, sin tocar status.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { createPromotionCodeForAffiliate, AFFILIATE_COUPON_DISCOUNT_PERCENT } from '@/lib/affiliates'
import {
  brandFrom, brandReplyTo, brandSubjectPrefix, brandHeaderHtml, brandFooterLine, brandDisclosureHtml,
  PHYSICAL_MAILING_ADDRESS, type EmailBrand,
} from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  let body: { action?: string; commission_percent?: number; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const { action } = body

  const supabase = getSupabaseAdmin()
  const { data: affiliate, error: fetchError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  const emailBrand: EmailBrand = affiliate.brand === 'fbfc' ? 'fbfc' : 'opabiz'
  const isEs = affiliate.lang === 'es'
  const isAgent = affiliate.application_type === 'agent'

  if (action === 'approve') {
    if (affiliate.status === 'approved') {
      return NextResponse.json({ error: 'Ya está aprobado.' }, { status: 409 })
    }
    const commissionPercent = typeof body.commission_percent === 'number' ? body.commission_percent : affiliate.commission_percent

    // Los agentes NO reciben cupón de Stripe — ganan comisión por orden
    // asistida en persona (vía OpaBiz Connect), no por un código de
    // descuento. El registro/cálculo de esa comisión queda pendiente de otra
    // sesión (ver AGENT_COMMISSION_DEFAULT_PERCENT en lib/affiliates.ts); por
    // ahora aprobar un agente solo marca el estado y avisa que el equipo va
    // a dar de alta su cuenta de OpaBiz Connect a mano, como siempre.
    let promo: { id: string; code: string } | null = null
    if (!isAgent) {
      try {
        promo = await createPromotionCodeForAffiliate()
      } catch (err) {
        console.error('[/api/admin/affiliates/[id]] createPromotionCodeForAffiliate error:', err)
        return NextResponse.json({ error: `No se pudo crear el código de Stripe: ${String(err)}` }, { status: 502 })
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('affiliates')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        ...(promo ? { coupon_code: promo.code, stripe_promotion_code_id: promo.id } : {}),
        commission_percent: commissionPercent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (updateError) {
      return NextResponse.json({ error: String(updateError) }, { status: 500 })
    }

    const subjectPrefix = brandSubjectPrefix(emailBrand)
    const approveSubject = isAgent
      ? (isEs ? `${subjectPrefix}¡Estás aprobado como agente!` : `${subjectPrefix}You're approved as a field agent!`)
      : (isEs ? `${subjectPrefix}¡Estás aprobado! Tu código de afiliado` : `${subjectPrefix}You're approved! Here's your affiliate code`)

    const bodyHtml = isAgent
      ? `
              <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `¡Bienvenido/a al equipo, ${escapeHtml(affiliate.name)}!` : `Welcome to the team, ${escapeHtml(affiliate.name)}!`}</h2>
              <p style="color:#475569;line-height:1.7">${isEs
                ? `Tu solicitud como agente fue aprobada. Ganás ${commissionPercent}% de comisión sobre las tarifas de servicio de cada orden que asistís en persona.`
                : `Your field agent application was approved. You earn ${commissionPercent}% commission on the service fees of every order you assist in person.`}</p>
              <p style="color:#475569;line-height:1.7">${isEs
                ? 'Nuestro equipo se va a poner en contacto en los próximos días con tu training y los datos de acceso a OpaBiz Connect, el sistema que vas a usar para llenar las solicitudes de tus clientes.'
                : "Our team will reach out in the next few days with your training and your OpaBiz Connect access — the system you'll use to fill out applications for your clients."}</p>
      `
      : `
              <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `¡Bienvenido/a al Programa de Afiliados, ${escapeHtml(affiliate.name)}!` : `Welcome to the Affiliate Program, ${escapeHtml(affiliate.name)}!`}</h2>
              <p style="color:#475569;line-height:1.7">${isEs
                ? `Tu solicitud fue aprobada. Este es tu código para compartir — tus referidos obtienen ${AFFILIATE_COUPON_DISCOUNT_PERCENT}% de descuento, y vos ganás ${commissionPercent}% de comisión sobre las tarifas de servicio de cada orden que lo use.`
                : `Your application was approved. Here is your code to share — your referrals get ${AFFILIATE_COUPON_DISCOUNT_PERCENT}% off, and you earn ${commissionPercent}% commission on the service fees of every order that uses it.`}</p>
              <div style="background:#EFF6FF;border-radius:8px;padding:16px 20px;margin:22px 0;text-align:center">
                <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Tu código' : 'Your code'}</div>
                <div style="font-size:24px;font-weight:800;color:#1C2E44;letter-spacing:1px">${promo?.code}</div>
              </div>
              <p style="color:#475569;line-height:1.7;font-size:13.5px">${isEs
                ? 'Los pagos de comisión se realizan al alcanzar $200 acumulados, o a los 2 meses de colocada la primera orden con tu código, lo que ocurra primero.'
                : 'Commission payouts happen once you reach $200 accumulated, or 2 months after your first order, whichever comes first.'}</p>
      `

    getResend().emails.send({
      from: brandFrom(emailBrand),
      replyTo: brandReplyTo(emailBrand),
      to: affiliate.email,
      subject: approveSubject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${brandHeaderHtml(emailBrand)}</tr></table>
            </div>
            <div style="padding:32px">
              ${bodyHtml}
              <p style="margin-top:32px;color:#94a3b8;font-size:12px;line-height:1.6">
                ${brandFooterLine(emailBrand)}<br/>
                ${brandDisclosureHtml(emailBrand, isEs ? 'es' : 'en')}<br/>
                ${PHYSICAL_MAILING_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      `,
    }).catch(err => console.error('[/api/admin/affiliates/[id]] approve email error (non-fatal):', err))

    return NextResponse.json({ affiliate: updated })
  }

  if (action === 'reject') {
    const { data: updated, error: updateError } = await supabase
      .from('affiliates')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updateError) return NextResponse.json({ error: String(updateError) }, { status: 500 })

    const subjectPrefix = brandSubjectPrefix(emailBrand)
    const programLabel = isAgent ? (isEs ? 'Programa de Agentes' : 'Field Agent Program') : (isEs ? 'Programa de Afiliados' : 'Affiliate Program')
    getResend().emails.send({
      from: brandFrom(emailBrand),
      replyTo: brandReplyTo(emailBrand),
      to: affiliate.email,
      subject: isEs ? `${subjectPrefix}Actualización sobre tu aplicación al ${programLabel}` : `${subjectPrefix}Update on your ${programLabel} application`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${brandHeaderHtml(emailBrand)}</tr></table>
            </div>
            <div style="padding:32px">
              <p style="color:#475569;line-height:1.7">${isEs
                ? `Gracias por tu interés en nuestro ${programLabel}. En esta ocasión no podemos aprobar tu solicitud. Si creés que fue un error, escribinos respondiendo este correo.`
                : `Thank you for your interest in our ${programLabel}. We're unable to approve your application at this time. If you believe this was a mistake, reply to this email.`}</p>
              <p style="margin-top:32px;color:#94a3b8;font-size:12px;line-height:1.6">${brandFooterLine(emailBrand)} · ${PHYSICAL_MAILING_ADDRESS}</p>
            </div>
          </div>
        </div>
      `,
    }).catch(err => console.error('[/api/admin/affiliates/[id]] reject email error (non-fatal):', err))

    return NextResponse.json({ affiliate: updated })
  }

  if (action === 'suspend') {
    const { data: updated, error: updateError } = await supabase
      .from('affiliates')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updateError) return NextResponse.json({ error: String(updateError) }, { status: 500 })
    return NextResponse.json({ affiliate: updated })
  }

  if (action === 'update') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.commission_percent === 'number') patch.commission_percent = body.commission_percent
    if (typeof body.notes === 'string') patch.notes = body.notes.trim() || null

    const { data: updated, error: updateError } = await supabase
      .from('affiliates')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (updateError) return NextResponse.json({ error: String(updateError) }, { status: 500 })
    return NextResponse.json({ affiliate: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
