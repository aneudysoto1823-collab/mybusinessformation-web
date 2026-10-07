// ─────────────────────────────────────────────────────────────────────────────
// Dos emails hermanos para servicios recurrentes anuales (Registered Agent /
// Annual Report — Virtual Address queda afuera a propósito, es mensual y no
// necesita este aviso de 30 días): el aviso ANTES de la renovación (cron
// diario, ver app/api/cron/subscription-renewal-notice/route.ts) y la
// confirmación DESPUÉS de que el cobro de renovación se proceso con éxito
// (webhooks/stripe.ts, handleInvoicePaid). Comparten el mismo shell visual
// a propósito — decisión founder 2026-09-15: "diseñarlo igual que el que le
// llega antes" — mismo layout que ya usan sendOrderConfirmation/
// handleInvoicePaymentFailed (header con logo por marca + card blanca).
// ─────────────────────────────────────────────────────────────────────────────

import { getResend } from './resend-client'
import { SERVICES_CATALOG } from './services-pricing'
import {
  brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandSubjectPrefix,
  brandPortalHome, type EmailBrand,
} from './email-constants'

function renewalEmailShell(brand: EmailBrand, bodyHtml: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
      <table style="width:100%;border-collapse:collapse;padding:20px 28px;background:#fff;border-radius:10px 10px 0 0"><tr>${brandHeaderHtml(brand)}</tr></table>
      <div style="background:#fff;padding:8px 28px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px;line-height:1.6">
        ${bodyHtml}
        <p style="color:#64748b;font-size:12.5px">${brandFooterLine(brand)}</p>
      </div>
    </div>
  `
}

function formatLongDate(d: Date, isEs: boolean): string {
  return d.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function serviceLabel(serviceId: string, isEs: boolean): string {
  const svc = SERVICES_CATALOG[serviceId]
  return svc ? (isEs ? svc.name_es : svc.name_en) : serviceId
}

export interface RenewalReminderParams {
  to: string
  brand: EmailBrand
  isEs: boolean
  serviceId: string
  companyName: string | null
  renewalDate: Date
  amount: number // dólares, service fee + state fee ya sumados
}

export async function sendSubscriptionRenewalReminder(params: RenewalReminderParams): Promise<void> {
  const { to, brand, isEs, serviceId, companyName, renewalDate, amount } = params
  const serviceName = serviceLabel(serviceId, isEs)
  const dateStr = formatLongDate(renewalDate, isEs)
  const portalUrl = brandPortalHome(brand)
  const company = companyName && companyName !== 'Pending' ? companyName : null
  const amountStr = amount.toFixed(2)

  const body = isEs
    ? `<p>Le escribimos para recordarle que su <strong>${serviceName}</strong>${company ? ` para <strong>${company}</strong>` : ''} se renovará automáticamente el <strong>${dateStr}</strong> por <strong>$${amountStr}</strong>.</p>
       <p>No necesita hacer nada: el cargo se procesará automáticamente con su método de pago guardado. Si desea revisar o cancelar esta suscripción antes de esa fecha, puede hacerlo desde su portal de cliente.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Ir a Mi Portal</a>
       </div>`
    : `<p>This is a reminder that your <strong>${serviceName}</strong>${company ? ` for <strong>${company}</strong>` : ''} will automatically renew on <strong>${dateStr}</strong> for <strong>$${amountStr}</strong>.</p>
       <p>You don't need to do anything: the charge will process automatically using your saved payment method. If you'd like to review or cancel this subscription before that date, you can do so from your client portal.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Go to My Portal</a>
       </div>`

  await getResend().emails.send({
    from:    brandFrom(brand),
    replyTo: brandReplyTo(brand),
    to,
    subject: isEs
      ? `${brandSubjectPrefix(brand)}Su ${serviceName} se renueva pronto`
      : `${brandSubjectPrefix(brand)}Your ${serviceName} renews soon`,
    html: renewalEmailShell(brand, body),
  })
}

export interface CardExpiryWarningParams {
  to: string
  brand: EmailBrand
  isEs: boolean
  serviceId: string
  companyName: string | null
  renewalDate: Date
  card: { brand: string; last4: string; expMonth: number; expYear: number }
}

// 5 días antes del cobro, solo si la tarjeta guardada vence antes de la
// fecha de renovación (ver cron/subscription-renewal-notice).
export async function sendCardExpiryWarning(params: CardExpiryWarningParams): Promise<void> {
  const { to, brand, isEs, serviceId, companyName, renewalDate, card } = params
  const serviceName = serviceLabel(serviceId, isEs)
  const dateStr = formatLongDate(renewalDate, isEs)
  const portalUrl = brandPortalHome(brand)
  const company = companyName && companyName !== 'Pending' ? companyName : null
  const cardName = `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} ****${card.last4}`
  const cardExp = `${String(card.expMonth).padStart(2, '0')}/${card.expYear}`

  const body = isEs
    ? `<p>El <strong>${dateStr}</strong> se renueva su <strong>${serviceName}</strong>${company ? ` para <strong>${company}</strong>` : ''}, pero la tarjeta guardada para ese cobro (${cardName}) vence el <strong>${cardExp}</strong>.</p>
       <p>Para que el cobro no falle y su servicio no se interrumpa, actualice su método de pago desde su portal de cliente antes de esa fecha.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Actualizar Método de Pago</a>
       </div>`
    : `<p>Your <strong>${serviceName}</strong>${company ? ` for <strong>${company}</strong>` : ''} renews on <strong>${dateStr}</strong>, but the card saved for that charge (${cardName}) expires <strong>${cardExp}</strong>.</p>
       <p>To make sure the charge goes through and your service is not interrupted, please update your payment method from your client portal before that date.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Update Payment Method</a>
       </div>`

  await getResend().emails.send({
    from:    brandFrom(brand),
    replyTo: brandReplyTo(brand),
    to,
    subject: isEs
      ? `${brandSubjectPrefix(brand)}Actualice su tarjeta antes de la renovación de su ${serviceName}`
      : `${brandSubjectPrefix(brand)}Please update your card before your ${serviceName} renews`,
    html: renewalEmailShell(brand, body),
  })
}

export interface RenewalConfirmationParams {
  to: string
  brand: EmailBrand
  isEs: boolean
  serviceId: string
  companyName: string | null
  amount: number // dólares, monto real cobrado (invoice.amount_paid / 100)
  nextRenewalDate: Date | null
}

export async function sendSubscriptionRenewalConfirmation(params: RenewalConfirmationParams): Promise<void> {
  const { to, brand, isEs, serviceId, companyName, amount, nextRenewalDate } = params
  const serviceName = serviceLabel(serviceId, isEs)
  const portalUrl = brandPortalHome(brand)
  const company = companyName && companyName !== 'Pending' ? companyName : null
  const amountStr = amount.toFixed(2)
  const nextDateStr = nextRenewalDate ? formatLongDate(nextRenewalDate, isEs) : null

  const body = isEs
    ? `<p>Le confirmamos que renovamos con éxito su <strong>${serviceName}</strong>${company ? ` para <strong>${company}</strong>` : ''}.</p>
       <p>Se procesó un cargo de <strong>$${amountStr}</strong> a su método de pago guardado${nextDateStr ? `, y su próxima renovación será el <strong>${nextDateStr}</strong>` : ''}.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Ir a Mi Portal</a>
       </div>`
    : `<p>We're confirming that your <strong>${serviceName}</strong>${company ? ` for <strong>${company}</strong>` : ''} was successfully renewed.</p>
       <p>A charge of <strong>$${amountStr}</strong> was processed to your saved payment method${nextDateStr ? `, and your next renewal will be on <strong>${nextDateStr}</strong>` : ''}.</p>
       <div style="text-align:center;margin:20px 0">
         <a href="${portalUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">Go to My Portal</a>
       </div>`

  await getResend().emails.send({
    from:    brandFrom(brand),
    replyTo: brandReplyTo(brand),
    to,
    subject: isEs
      ? `${brandSubjectPrefix(brand)}Su ${serviceName} fue renovada con éxito`
      : `${brandSubjectPrefix(brand)}Your ${serviceName} was successfully renewed`,
    html: renewalEmailShell(brand, body),
  })
}
