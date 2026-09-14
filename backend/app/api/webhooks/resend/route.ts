// Webhook de Resend — auditoría 2026-09-13/14, punto bloqueante #1: antes,
// un email rebotado o marcado como spam no dejaba ningún rastro en el
// sistema, así que la misma dirección se le podía volver a ofrecer en la
// próxima corrida de marketing, repitiendo el daño de reputación en vez de
// corregirlo.
//
// Resend firma sus webhooks con Svix (headers svix-id / svix-timestamp /
// svix-signature) — NO es el mismo esquema que usa Stripe. El signing
// secret se obtiene en Resend → Webhooks → (el endpoint) → "Signing Secret",
// y se guarda en RESEND_WEBHOOK_SECRET.
//
// Eventos manejados:
//  - email.bounced: "the recipient's mail server permanently rejected the
//    email" (definición de Resend — este evento ya implica rebote duro, no
//    hace falta distinguir soft/hard nosotros).
//  - email.complained: el email se entregó pero el destinatario lo marcó
//    como spam. Señal más grave que un rebote — dispara alerta interna.
// Cualquier otro tipo de evento (delivered, opened, clicked, etc.) se
// reconoce con 200 pero no dispara ninguna acción — no los necesitamos hoy.

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { suppressEmail } from '@/lib/email-suppression'
import { FROM_OPABIZ_ALERTS, INTERNAL_ALERT_EMAIL } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string[]
    subject?: string
    bounce?: { message?: string; subType?: string; type?: string }
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const secret = process.env.RESEND_WEBHOOK_SECRET

  if (!secret) {
    // Nunca debería pasar en producción — si pasa, mejor rechazar que
    // procesar eventos sin verificar la firma.
    console.error('[webhooks/resend] falta RESEND_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  try {
    const wh = new Webhook(secret)
    // .verify() no devuelve el payload parseado (a diferencia de
    // stripe.webhooks.constructEvent) — solo lanza si la firma no es
    // válida. El JSON se parsea aparte, después de confirmar la firma.
    wh.verify(payload, {
      'svix-id': req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    })
  } catch (err) {
    console.error('[webhooks/resend] firma inválida:', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(payload) as ResendWebhookEvent

  const recipients = event.data.to ?? []

  if (event.type === 'email.bounced') {
    const detail = event.data.bounce
      ? `${event.data.bounce.type ?? ''}/${event.data.bounce.subType ?? ''}: ${event.data.bounce.message ?? ''}`.trim()
      : null
    await Promise.all(
      recipients.map(to => suppressEmail(to, 'bounced', detail, event.data.email_id ?? null))
    )
    return NextResponse.json({ ok: true, suppressed: recipients.length })
  }

  if (event.type === 'email.complained') {
    await Promise.all(
      recipients.map(to => suppressEmail(to, 'complained', event.data.subject ?? null, event.data.email_id ?? null))
    )
    // Una queja de spam es una señal grave (a diferencia de un rebote, que es
    // rutinario) — mismo criterio que ya se usa para chargebacks: alertar
    // solo en el evento que de verdad amerita atención humana.
    try {
      await getResend().emails.send({
        from: FROM_OPABIZ_ALERTS,
        to: INTERNAL_ALERT_EMAIL,
        subject: `Alerta: queja de spam — ${recipients.join(', ') || 'destinatario desconocido'}`,
        html: `<p>Resend reportó que ${recipients.join(', ') || 'un destinatario'} marcó un email como spam.</p>
               <p>Asunto: ${event.data.subject ?? '(sin asunto)'}</p>
               <p>Esa dirección ya quedó excluida automáticamente de futuros envíos de marketing.</p>`,
      })
    } catch (e) {
      console.error('[webhooks/resend] alerta interna de queja falló (no fatal):', e)
    }
    return NextResponse.json({ ok: true, suppressed: recipients.length })
  }

  // Otro tipo de evento (sent, delivered, opened, clicked, delivery_delayed) —
  // reconocido pero sin acción.
  return NextResponse.json({ ok: true, ignored: event.type })
}
