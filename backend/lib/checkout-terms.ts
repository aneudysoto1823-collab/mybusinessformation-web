// Casilla de Términos DENTRO del Embedded Checkout de Stripe (2026-10-15).
//
// Antes cada checkout tenía su propia casilla y el formulario de Stripe no se
// montaba hasta marcarla (auditoría compliance 2026-09-15), lo que demoraba la
// carga del pago. El botón Pay vive en el iframe de Stripe y no se puede
// bloquear desde la página, así que la casilla pasa a Stripe:
// consent_collection.terms_of_service:'required' no deja pagar sin marcarla.
// Requiere la "Terms of service URL" cargada en Stripe → Settings → Business →
// Public details (test y live por separado); si falta, Stripe rechaza la sesión.
// El texto de la casilla lo ponemos nosotros (custom_text, admite links en
// markdown), con los links de la marca del cliente y la mención de cada
// servicio que se renueva solo. Mismo texto que tenían las casillas propias.
//
// La aceptación se registra en Order.termsAcceptances desde el webhook
// (recordStripeTermsAcceptance), con la IP y el navegador guardados en la
// metadata al crear la sesión.

import type { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { appendTermsAcceptance, requestIp, type TermsContext } from './terms-acceptance'

type ConsentParams = Pick<Stripe.Checkout.SessionCreateParams, 'consent_collection' | 'custom_text'>

function consent(message: string): ConsentParams {
  return {
    consent_collection: { terms_of_service: 'required' },
    custom_text: { terms_of_service_acceptance: { message: message.slice(0, 1200) } },
  }
}

export function formationConsentParams(opts: { origin: string; isEs: boolean; hasRa: boolean; hasAr: boolean }): ConsentParams {
  const { origin, isEs, hasRa, hasAr } = opts
  const bits: string[] = []
  if (hasRa) bits.push(isEs ? 'el Agente Registrado ($99/año a partir del segundo año)' : 'Registered Agent ($99/yr starting year two)')
  if (hasAr) bits.push(isEs ? 'la Declaración Anual ($99/año + tarifa estatal)' : 'Annual Report Filing ($99/yr + state fee)')
  const joined = bits.join(isEs ? ' y ' : ' and ')
  const rec = bits.length
    ? (isEs
      ? ` Entiendo que ${joined} se renueva automáticamente cada año con el método de pago que use ahora, hasta que lo cancele desde mi portal de cliente.`
      : ` I understand that ${joined} renews automatically each year using the payment method I use now, until I cancel it from my client portal.`)
    : ''
  const base = isEs
    ? `He leído y acepto el [Aviso Legal](${origin}/legal) y los [Términos de Servicio](${origin}/terms), y entiendo que este es un servicio de preparación de documentos, no asesoría legal ni fiscal.`
    : `I have read and agree to the [Legal Statement](${origin}/legal) and [Terms of Service](${origin}/terms), and understand this is a document preparation service, not legal or tax advice.`
  return consent(base + rec)
}

export function servicesConsentParams(opts: { origin: string; isEs: boolean; brand: 'opabiz' | 'fbfc'; recurring: boolean }): ConsentParams {
  const { origin, isEs, brand, recurring } = opts
  const who = brand === 'fbfc' ? 'Florida Business Formation Center' : 'OpaBiz (Florida Business Formation Center)'
  const base = isEs
    ? `Autorizo a ${who} a preparar y presentar mis trámites en mi nombre, según los [Términos](${origin}/terms) y la [Política de privacidad](${origin}/privacy). Las tarifas de servicio no son reembolsables una vez iniciado el trabajo.`
    : `I authorize ${who} to prepare and file my filings on my behalf, per the [Terms](${origin}/terms) and [Privacy Policy](${origin}/privacy). Service fees are non-refundable once work begins.`
  const rec = recurring
    ? (isEs
      ? ' Los servicios recurrentes (marcados /mes o /año) se renuevan automáticamente al precio vigente hasta que los cancele desde mi cuenta de cliente. El Agente Registrado es gratis el primer año al combinarlo con otro servicio; luego se renueva a $99/año.'
      : ' Recurring services (marked /mo or /yr) renew automatically at the then-current rate until I cancel from my client account. Registered Agent is free the first year when combined with another service; then renews at $99/yr.')
    : ''
  return consent(base + rec)
}

// IP y navegador de quien abrió el pago, para guardarlos con la aceptación
// (el webhook no los tiene). La metadata de Stripe acepta hasta 500 caracteres.
export function consentRequestMetadata(req: NextRequest): Record<string, string> {
  return {
    consentIp: (requestIp(req) ?? '').slice(0, 100),
    consentUa: (req.headers.get('user-agent') ?? '').slice(0, 500),
  }
}

// Llamado desde el webhook al confirmarse el pago. No bloqueante.
export async function recordStripeTermsAcceptance(orderId: string, session: Stripe.Checkout.Session, context: TermsContext): Promise<void> {
  if (session.consent?.terms_of_service !== 'accepted') return
  const meta = session.metadata ?? {}
  await appendTermsAcceptance(orderId, {
    context,
    text: session.custom_text?.terms_of_service_acceptance?.message ?? '',
    ip: meta.consentIp || null,
    userAgent: meta.consentUa || null,
    stripeSessionId: session.id,
  })
}
