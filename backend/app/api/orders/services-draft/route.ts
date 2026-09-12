import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkOrdersDraftRateLimit, getClientIp } from '@/lib/rate-limit'
import { ServicesDraftInputSchema, ServicesDraftLookupSchema, parseOr400 } from '@/lib/schemas'
import { resolveOrigin, brandFromOrigin } from '@/lib/request-origin'
import { brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandSubjectPrefix, type EmailBrand } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

// Guarda el progreso de /servicios/checkout (compartido opabiz.com/
// mybusinessformation.com) como una orden real (isDraft:true, package:'services')
// para que sea recuperable si el cliente se refresca o vuelve más tarde — antes
// este checkout no guardaba nada hasta llegar al paso de pago, y un refresh a
// mitad de camino perdía TODO lo tipeado (ver memoria de la sesión 2026-09-09).
// Mismo patrón que /api/orders/draft (formación del home) pero con el shape de
// datos de este checkout — nunca se mezclan, cada endpoint solo toca su propio
// tipo de orden.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await checkOrdersDraftRateLimit(ip)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const raw = await request.json()
    const parsed = parseOr400(ServicesDraftInputSchema, raw)
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
    }
    const body = parsed.data
    const now = new Date().toISOString()

    // Marca derivada del Origin YA VALIDADO (nunca de un campo que mande el
    // cliente) — mismo criterio que /api/checkout/embedded-services.
    const origin = resolveOrigin(request)
    const sourceBrand = brandFromOrigin(origin)

    const fields = {
      updatedAt:    now,
      firstName:    body.firstName || '',
      lastName:     body.lastName  || '',
      email:        body.email,
      phone:        body.phone     || null,
      country:      body.country   || 'US',
      // 'Pending' en vez de null — companyName es NOT NULL en la tabla (mismo
      // placeholder que ya usa el signup del cliente para cuentas sin orden real).
      companyName:  body.companyName || 'Pending',
      entityType:   body.entityType  || 'llc',
      sourceBrand,
      // amount es NOT NULL en la tabla — un borrador todavía no tiene precio
      // real (se calcula recién en /api/checkout/embedded-services al llegar
      // al pago), 0 es el placeholder correcto mientras tanto.
      amount:        0,
      isDraft:       true,
      draftSnapshot: body.snapshot ?? null,
    }

    // Reusa la fila si ya existe un borrador de esta misma sesión — el filtro
    // .eq('isDraft', true) es el blindaje: este endpoint jamás pisa una orden
    // ya promovida a real (pagada o en camino de pago).
    if (body.orderId) {
      const { data: updated, error: updateErr } = await getSupabaseAdmin()
        .from('Order')
        .update(fields)
        .eq('id', body.orderId)
        .eq('isDraft', true)
        .select('id')
        .maybeSingle()

      if (!updateErr && updated) {
        if (body.manual) {
          sendDraftSavedEmail({
            id: updated.id,
            email: fields.email,
            firstName: fields.firstName,
            companyName: fields.companyName,
            origin,
            brand: sourceBrand,
            lang: body.lang === 'es' ? 'es' : 'en',
            source: body.source === 'new-business' ? 'new-business' : 'services-checkout',
          })
        }
        return NextResponse.json({ success: true, orderId: updated.id }, { status: 200 })
      }
      // Si no se pudo actualizar (id viejo, ya promovido a real, etc.) cae al insert.
    }

    const { data: created, error: insertErr } = await getSupabaseAdmin()
      .from('Order')
      .insert({
        id:              crypto.randomUUID(),
        createdAt:       now,
        package:         'services',
        currency:        'USD',
        paymentStatus:   'pending',
        status:          'pending',
        speed:           'standard',
        registeredAgent: 'us',
        ...fields,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[/api/orders/services-draft] Supabase insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Error saving draft' }, { status: 500 })
    }

    if (body.manual) {
      sendDraftSavedEmail({
        id: created.id,
        email: fields.email,
        firstName: fields.firstName,
        companyName: fields.companyName,
        origin,
        brand: sourceBrand,
        lang: body.lang === 'es' ? 'es' : 'en',
        source: body.source === 'new-business' ? 'new-business' : 'services-checkout',
      })
    }

    return NextResponse.json({ success: true, orderId: created.id }, { status: 201 })
  } catch (error) {
    console.error('[/api/orders/services-draft POST] Error inesperado:', error)
    return NextResponse.json({ success: false, error: 'Error processing draft' }, { status: 500 })
  }
}

// Recupera el snapshot de un borrador — sin client_session (este checkout es
// anónimo hasta pagar), autenticado por orderId + email coincidente en vez de
// solo el id: evita que alcance con que un UUID se filtre (log, referrer,
// captura de pantalla reenviada) para leer el nombre/dirección/teléfono de
// otra persona sin conocer también su email.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = parseOr400(ServicesDraftLookupSchema, {
    orderId: searchParams.get('orderId'),
    email:   searchParams.get('email'),
  })
  if (!parsed.ok) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, isDraft, draftSnapshot, email')
    .eq('id', parsed.data.orderId)
    .maybeSingle()

  if (error || !order || order.isDraft !== true || (order.email || '').toLowerCase() !== parsed.data.email) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  return NextResponse.json({ isDraft: true, orderId: order.id, snapshot: order.draftSnapshot ?? null })
}

function sendDraftSavedEmail(order: {
  id: string
  email: string
  firstName: string | null
  companyName: string | null
  origin: string
  brand: EmailBrand
  lang: 'en' | 'es'
  source: 'services-checkout' | 'new-business'
}) {
  const fbfcNumber = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  // new-business (mybiz) vive en la RAÍZ del dominio (rewrite de host en
  // next.config.ts), nunca en /new-business — mismo criterio que el payUrl
  // de la carta física, que ya usa mybusinessformation.com/?id=...
  const path = order.source === 'new-business' ? '' : '/servicios/checkout'
  const continueUrl = `${order.origin}${path}?resumeOrder=${order.id}&resumeEmail=${encodeURIComponent(order.email)}`
  const isEs = order.lang === 'es'
  const name = order.firstName || (isEs ? 'hola' : 'there')
  const company = order.companyName || (isEs ? 'su pedido' : 'your order')

  getResend().emails.send({
    from:    brandFrom(order.brand),
    replyTo: brandReplyTo(order.brand),
    to:      order.email,
    subject: `${brandSubjectPrefix(order.brand)}${isEs ? 'Guardamos su progreso' : 'Your progress is saved'} — ${fbfcNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <table style="width:100%;border-collapse:collapse;padding:20px 28px;background:#fff;border-radius:10px 10px 0 0"><tr>${brandHeaderHtml(order.brand)}</tr></table>
        <div style="background:#fff;padding:8px 28px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px;line-height:1.6">
          ${isEs
            ? `<h2 style="color:#1C2E44;font-size:19px">Hola ${name}, guardamos su pedido</h2>
               <p>Empezó a armar <strong>${company}</strong> con nosotros. Cuando quiera continuar, haga clic en el botón — lo va a llevar exactamente adonde quedó, sin tener que volver a escribir nada.</p>`
            : `<h2 style="color:#1C2E44;font-size:19px">Hi ${name}, your order is saved</h2>
               <p>You started putting together <strong>${company}</strong> with us. Whenever you're ready, click the button below — it'll take you right back to where you left off, no retyping needed.</p>`}
          <div style="text-align:center;margin:22px 0">
            <a href="${continueUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">${isEs ? 'Continuar mi pedido →' : 'Continue My Order →'}</a>
          </div>
          <p style="color:#94a3b8;font-size:12.5px">${isEs ? 'Esto no es una orden confirmada todavía — es solo su progreso hasta ahora. No se realizó ningún cobro.' : 'This isn’t a confirmed order yet — it’s just your progress so far. No payment has been made.'}</p>
          <p style="color:#64748b;font-size:12.5px;margin-top:24px">${brandFooterLine(order.brand)}</p>
        </div>
      </div>
    `,
  }).catch(err => console.error('[/api/orders/services-draft] draft-saved email error (non-fatal):', err))
}
