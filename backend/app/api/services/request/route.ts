// POST /api/services/request — Multi-service order request (lead capture).
//
// Recibe el carrito de la página /servicios: lista de servicios seleccionados +
// datos de contacto del cliente. NO cobra — manda un email al equipo (alert@)
// con la lista de servicios y los datos, y una confirmación al cliente.
//
// Mismo patrón que /api/contact: Resend lazy-init, rate-limit por IP, Reply-To
// al email del cliente para que el equipo responda con un click.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkContactRateLimit, getClientIp } from '@/lib/rate-limit'
import { INTERNAL_ALERT_EMAIL as TO_TEAM, REPLY_TO as REPLY_TO_DEFAULT, FROM_OPABIZ_ALERTS, FROM_OPABIZ } from '@/lib/email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CartService = { id?: string; name?: string; price?: string }

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function genOrderNumber(): string {
  return 'FBFC-' + Math.floor(10000 + Math.random() * 90000)
}

export async function POST(req: NextRequest) {
  let body: {
    name?: string; email?: string; phone?: string; message?: string
    services?: CartService[]; lang?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const isEs = body.lang === 'es'
  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const phone = (body.phone || '').trim()
  const message = (body.message || '').trim()
  const services = Array.isArray(body.services) ? body.services : []

  // Validación mínima
  if (!name || name.length < 2) {
    return NextResponse.json({ error: isEs ? 'Ingresa tu nombre completo.' : 'Please enter your full name.' }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: isEs ? 'Ingresa un correo válido.' : 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!phone || phone.length < 7) {
    return NextResponse.json({ error: isEs ? 'Ingresa un teléfono válido.' : 'Please enter a valid phone number.' }, { status: 400 })
  }
  if (services.length === 0) {
    return NextResponse.json({ error: isEs ? 'Tu pedido está vacío.' : 'Your order is empty.' }, { status: 400 })
  }
  // Límites defensivos contra payload abuse
  if (name.length > 120 || email.length > 254 || phone.length > 40 || message.length > 4000 || services.length > 30) {
    return NextResponse.json({ error: 'One or more fields exceed the allowed length.' }, { status: 400 })
  }

  // Rate limit anti-spam (mismo bucket que el form de contacto).
  const ip = getClientIp(req)
  const rate = await checkContactRateLimit(ip)
  if (!rate.success) {
    return NextResponse.json(
      { error: isEs ? 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en una hora.' : 'Too many requests from this IP. Please try again in an hour.' },
      { status: 429 }
    )
  }

  const orderNumber = genOrderNumber()
  const safeName = escape(name)
  const safeEmail = escape(email)
  const safePhone = escape(phone)
  const safeMessage = message ? escape(message).replace(/\n/g, '<br>') : (isEs ? '—' : '—')

  // Filas de servicios para el email (sanitizadas)
  const serviceRows = services
    .map(s => {
      const nm = escape((s.name || s.id || 'Service').toString().slice(0, 160))
      const pr = escape((s.price || '').toString().slice(0, 40))
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px">${nm}</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right;color:#475569;white-space:nowrap">${pr || '&mdash;'}</td></tr>`
    })
    .join('')

  // Lista en texto plano para la confirmación al cliente
  const clientList = services
    .map(s => `<li style="margin-bottom:4px">${escape((s.name || s.id || 'Service').toString().slice(0, 160))}${s.price ? ` <span style="color:#64748b">(${escape(s.price.toString().slice(0, 40))})</span>` : ''}</li>`)
    .join('')

  try {
    const result = await getResend().emails.send({
      from: FROM_OPABIZ_ALERTS,
      to: TO_TEAM,
      replyTo: email,
      subject: `OpaBiz Alerts: New service request ${orderNumber} (${services.length})`.slice(0, 240),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:20px 28px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:18px;margin:0;font-weight:600">New service request</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">opabiz.com/servicios &middot; Order ${orderNumber}</p>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <table cellpadding="6" style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#64748b;width:110px"><strong>Name</strong></td><td>${safeName}</td></tr>
              <tr><td style="color:#64748b"><strong>Email</strong></td><td><a href="mailto:${safeEmail}" style="color:#2563eb">${safeEmail}</a></td></tr>
              <tr><td style="color:#64748b"><strong>Phone</strong></td><td><a href="https://wa.me/${safePhone.replace(/[^0-9]/g, '')}" style="color:#059669">${safePhone}</a></td></tr>
              <tr><td style="color:#64748b"><strong>Order #</strong></td><td>${orderNumber}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:6px"><strong>Requested services (${services.length})</strong></div>
            <table style="width:100%;border-collapse:collapse">${serviceRows}</table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:6px">Message</div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;font-size:14px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${safeMessage}</div>
            <p style="font-size:12px;color:#94a3b8;margin-top:18px">Reply directly to this email and it will land in ${safeEmail}.</p>
          </div>
        </div>
      `,
    })

    if (result.error) {
      console.error('[/api/services/request] Resend error:', result.error)
      return NextResponse.json({ error: isEs ? 'El servicio de correo no está disponible. Intenta por WhatsApp.' : 'Email service is temporarily unavailable. Please try WhatsApp.' }, { status: 502 })
    }

    // ── Confirmación al cliente — non-blocking ────────────────────────────────
    getResend().emails.send({
      from: FROM_OPABIZ,
      replyTo: REPLY_TO_DEFAULT,
      to: email,
      subject: isEs
        ? `OpaBiz: ✅ Recibimos tu solicitud (${orderNumber})`
        : `OpaBiz: ✅ We got your service request (${orderNumber})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:22px;margin:0">OpaBiz</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">Florida Business Formation Center</p>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <h2 style="color:#1C2E44;font-size:20px;margin:0 0 14px">${isEs ? `Hola ${safeName}, recibimos tu solicitud ✅` : `Hi ${safeName}, we got your request ✅`}</h2>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? 'Gracias por elegir OpaBiz. Nuestro equipo revisará tu solicitud y te contactará en <strong style="color:#1C2E44">1 día hábil</strong> para confirmar los detalles y el pago.'
                : 'Thanks for choosing OpaBiz. Our team will review your request and contact you within <strong style="color:#1C2E44">1 business day</strong> to confirm the details and payment.'}
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b"><strong>${isEs ? 'Tu número de orden' : 'Your order number'}:</strong> ${orderNumber}</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b"><strong>${isEs ? 'Servicios solicitados' : 'Requested services'}:</strong></p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#1e293b;line-height:1.6">${clientList}</ul>
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? '¿Lo necesitas antes? Escríbenos por ' : 'Need it sooner? Reach us on '}
              <a href="https://wa.me/13528377755" style="color:#059669;font-weight:600">WhatsApp</a>
              ${isEs ? ' y un miembro del equipo te ayudará enseguida.' : ' and a team member will help you right away.'}
            </p>
            <p style="margin-top:32px;color:#94a3b8;font-size:12px">
              OpaBiz · opabiz.com<br/>
              ${isEs ? 'Florida Business Formation Center. Somos un servicio de preparación de documentos, no una firma de abogados.' : 'Florida Business Formation Center. We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      `,
    }).catch(err => console.error('[/api/services/request] Confirmation to client failed (non-fatal):', err))

    return NextResponse.json({ success: true, orderNumber })
  } catch (err) {
    console.error('[/api/services/request] Unexpected error:', err)
    return NextResponse.json({ error: isEs ? 'Algo salió mal. Intenta de nuevo o usa WhatsApp.' : 'Something went wrong. Please try again or use WhatsApp.' }, { status: 500 })
  }
}
