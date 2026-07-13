import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkOrdersDraftRateLimit, getClientIp } from '@/lib/rate-limit'
import { OrderDraftInputSchema, parseOr400 } from '@/lib/schemas'
import { REPLY_TO, FROM_OPABIZ } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

// Se manda una sola vez, al crear el borrador (no en cada sync de progreso) —
// es la única forma que tiene el cliente de recuperar el código si cierra la
// pestaña sin anotarlo, ya que la recuperación es solo por número de orden
// (sin email de respaldo, decisión negocio 2026-07-02). No es la confirmación
// de orden (A1) — esa sigue disparando solo cuando paga.
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'

function sendDraftSavedEmail(order: { id: string; email: string; firstName: string; lastName: string; companyName: string }) {
  const fbfcNumber = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  // El link auto-loguea con el número (ver ?continue= en app/page.tsx) y
  // reabre el formulario ya restaurado — el cliente no tiene que tipear nada.
  const continueUrl = `${SITE_URL}/?continue=${fbfcNumber}`
  getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: Save your application number — ${fbfcNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName} ${order.lastName}, your application is saved</h2>
          <p style="color:#475569;line-height:1.7">
            You started forming <strong>${order.companyName}</strong> with us. Whenever you're ready to continue,
            just click the button below — it'll take you right back to where you left off.
          </p>
          <div style="text-align:center;margin:26px 0">
            <a href="${continueUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:700">
              Continue My Application →
            </a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Or enter this number at opabiz.com</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#1e40af;letter-spacing:1px">${fbfcNumber}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6">
            This isn't a confirmed order yet — it's just your progress so far. No payment has been made.
          </p>
          <p style="margin-top:32px;color:#94a3b8;font-size:12px">
            Florida Business Formation Center · opabiz.com
          </p>
        </div>
      </div>
    `
  }).catch(err => console.error('[/api/orders/draft] draft-saved email error (non-fatal):', err))
}

// Guarda el progreso del formulario de formación como una orden real
// (isDraft:true) para que sea recuperable desde cualquier dispositivo con el
// número FBFC, no solo desde el navegador donde se empezó. Nunca envía la
// confirmación de orden (A1) ni alerta al equipo — eso sigue pasando solo
// cuando la orden se promueve a real (ver draftOrderId en POST /api/orders)
// y se confirma el pago. El único email de este endpoint es sendDraftSavedEmail,
// y solo se dispara la primera vez (camino insert), nunca en los updates.
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
    const parsed = parseOr400(OrderDraftInputSchema, raw)
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
    }
    const body = parsed.data
    const now = new Date().toISOString()

    const fields = {
      updatedAt:       now,
      firstName:       String(body.firstName),
      lastName:        String(body.lastName),
      email:           String(body.email),
      phone:           body.phone           || null,
      country:         body.country         || 'US',
      companyName:     String(body.companyName),
      companyName2:    body.companyName2    || null,
      companyName3:    body.companyName3    || null,
      entityType:      body.entityType      || 'llc',
      businessAddress: body.businessAddress || null,
      speed:           body.speed           || 'standard',
      package:         body.package         || 'basic',
      amount:          Number(body.amount)  || 0,
      currency:        'USD',
      members:         body.members         ?? null,
      registeredAgent: body.registeredAgent || 'us',
      addons:          body.addons          ?? null,
      orgSignature:    body.orgSignature     || null,
      isDraft:         true,
      draftSnapshot:   body.snapshot         ?? null,
    }

    // Si ya existe un borrador (mismo navegador o sesión restaurada), actualizarlo
    // en vez de crear otro. El filtro .eq('isDraft', true) es el blindaje: este
    // endpoint jamás puede pisar una orden ya promovida a real.
    if (body.orderId) {
      const { data: updated, error: updateErr } = await getSupabaseAdmin()
        .from('Order')
        .update(fields)
        .eq('id', body.orderId)
        .eq('isDraft', true)
        .select('id')
        .maybeSingle()

      if (!updateErr && updated) {
        return NextResponse.json({ success: true, orderId: updated.id }, { status: 200 })
      }
      // Si no se pudo actualizar (id viejo, ya promovido, etc.) cae al insert de abajo.
    }

    const { data: created, error: insertErr } = await getSupabaseAdmin()
      .from('Order')
      .insert({
        id:            crypto.randomUUID(),
        createdAt:     now,
        paymentStatus: 'pending',
        status:        'pending',
        ...fields,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[/api/orders/draft] Supabase insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Error saving draft' }, { status: 500 })
    }

    sendDraftSavedEmail({ id: created.id, email: fields.email, firstName: fields.firstName, lastName: fields.lastName, companyName: fields.companyName })

    return NextResponse.json({ success: true, orderId: created.id }, { status: 201 })
  } catch (error) {
    console.error('[/api/orders/draft POST] Error inesperado:', error)
    return NextResponse.json({ success: false, error: 'Error processing draft' }, { status: 500 })
  }
}

// Recupera el snapshot de un borrador para restaurar el formulario tras el
// login. Autenticado por la cookie client_session — nunca por un id en la URL,
// así nadie puede leer el progreso de otra persona adivinando un id.
export async function GET(request: NextRequest) {
  const sessionOrderId = request.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, isDraft, draftSnapshot')
    .eq('id', sessionOrderId)
    .maybeSingle()

  if (error || !order || order.isDraft !== true) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  return NextResponse.json({ isDraft: true, orderId: order.id, snapshot: order.draftSnapshot ?? null })
}
