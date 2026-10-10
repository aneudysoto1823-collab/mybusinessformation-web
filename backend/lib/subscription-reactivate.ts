// "Reactivar servicio" desde el portal del cliente (2026-10-09, pedido founder).
//
// Una Subscription cancelada en Stripe no se puede revivir: reactivar crea una
// Subscription NUEVA del mismo servicio en la misma orden, al precio actual del
// catálogo (recurringFeeFor), y cobra el primer período en el momento a la
// tarjeta guardada del cliente (o a una nueva que ingresa en la misma ventana).
// Se puede reactivar siempre, sin límite de tiempo (decisión founder).
//
// Solo Agente Registrado y Declaración Anual: la Dirección Virtual no se vende
// hoy (sin proveedor), en el portal sale "Servicio finalizado".
//
// Orden de los pasos, pensado para los webhooks:
//   1. Se crea la Subscription con payment_behavior 'default_incomplete' (no
//      cobra todavía) y se guarda en Order.subscriptions como 'incomplete'
//      ANTES de cobrar, así invoice.paid / invoice.payment_failed ya la
//      encuentran por su id.
//   2. Se cobra la primera factura (invoices.pay). Si el banco pide
//      verificación (3D Secure), se devuelve el client_secret para que el
//      navegador la complete y vuelva a llamar con confirm.
//   3. finalizeReactivation(): entrada 'active', notas, email de confirmación
//      y, en el Agente Registrado, alta nueva con el proveedor.
// La aceptación de Términos se guarda en Order.termsAcceptances.

import { after } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { getResend } from './resend-client'
import { notifyOps } from './ops-alert'
import { SERVICES_CATALOG } from './services-pricing'
import { recurringFeeFor, upsertOrderSubscription, type OrderSubscriptionEntry } from './order-subscriptions'
import { buildSubscriptionItems } from './stripe-subscriptions'
import { provisionRaForOrder } from './ra-provisioning'
import { formatCancelDate } from './subscription-cancel-policy'
import {
  brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandSubjectPrefix, brandPortalHome,
  type EmailBrand,
} from './email-constants'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export const REACTIVATABLE_SERVICES = ['registered-agent', 'annual-report']

export type ReactivationOrder = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  sourceBrand: string | null
  addons: unknown
  notes: string | null
  subscriptions: unknown
  stripeCustomerId: string | null
}

export const REACTIVATION_ORDER_SELECT = 'id, email, firstName, lastName, companyName, sourceBrand, addons, notes, subscriptions, stripeCustomerId'

export type ReactivationResult =
  | { status: 'active'; currentPeriodEnd: string | null; card: { brand: string; last4: string } | null }
  | { status: 'requires_action'; clientSecret: string }
  | { status: 'declined'; message: string }
  | { status: 'error'; httpStatus: number; error: string }

export function reactivationQuote(service: string, brand: 'opabiz' | 'fbfc') {
  const fee = recurringFeeFor(service, brand)
  if (!fee) return null
  const cat = SERVICES_CATALOG[service]
  const lines = [{ label_es: cat?.name_es ?? service, label_en: cat?.name_en ?? service, amount: fee.serviceFeeCents / 100 }]
  if (fee.stateFeeCents > 0) lines.push({ label_es: 'Tarifa estatal de Florida', label_en: 'Florida state fee', amount: fee.stateFeeCents / 100 })
  return { fee, lines, total: (fee.serviceFeeCents + fee.stateFeeCents) / 100 }
}

export async function getCustomerCard(customerId: string | null): Promise<{ id: string; brand: string; last4: string } | null> {
  if (!customerId) return null
  try {
    const stripe = getStripe()
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    const def = customer.invoice_settings?.default_payment_method
    let pmId = typeof def === 'string' ? def : def?.id ?? null
    if (!pmId) {
      const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 })
      pmId = list.data[0]?.id ?? null
    }
    if (!pmId) return null
    const pm = await stripe.paymentMethods.retrieve(pmId)
    return pm.card ? { id: pm.id, brand: pm.card.brand, last4: pm.card.last4 } : null
  } catch (err) {
    console.error('[subscription-reactivate] getCustomerCard error:', customerId, err)
    return null
  }
}

function brandKeyOf(order: ReactivationOrder): 'opabiz' | 'fbfc' {
  return order.sourceBrand === 'fbfc' ? 'fbfc' : 'opabiz'
}

function isEsOrder(order: ReactivationOrder): boolean {
  const a = (order.addons && typeof order.addons === 'object' && !Array.isArray(order.addons)) ? order.addons as { lang?: string } : {}
  return a.lang === 'es'
}

// PaymentIntent de la primera factura (API 2026: ya no viene en
// invoice.payment_intent, se lee de invoice.payments).
async function invoicePaymentIntent(stripe: Stripe, invoiceId: string): Promise<Stripe.PaymentIntent | null> {
  const inv = await stripe.invoices.retrieve(invoiceId, { expand: ['payments.data.payment.payment_intent'] })
  const pi = inv.payments?.data?.[0]?.payment?.payment_intent
  return pi && typeof pi !== 'string' ? pi : null
}

export async function reactivateService(opts: {
  order: ReactivationOrder
  service: string
  paymentMethodId?: string
  confirmOnly?: boolean
}): Promise<ReactivationResult> {
  const { order, service } = opts
  if (!REACTIVATABLE_SERVICES.includes(service)) return { status: 'error', httpStatus: 400, error: 'Este servicio no se puede reactivar' }
  const subs: OrderSubscriptionEntry[] = Array.isArray(order.subscriptions) ? order.subscriptions : []
  const entry = subs.find(s => s.service === service)
  if (!entry) return { status: 'error', httpStatus: 404, error: 'Servicio no encontrado en esta orden' }
  if (entry.status !== 'canceled' && entry.status !== 'incomplete') return { status: 'error', httpStatus: 409, error: 'Este servicio no está cancelado' }
  if (!order.stripeCustomerId) return { status: 'error', httpStatus: 400, error: 'Esta orden no tiene un cliente de pagos asociado' }

  const stripe = getStripe()
  const customerId = order.stripeCustomerId

  // Tarjeta a usar: la nueva que ingresó el cliente (debe pertenecerle) o la guardada.
  let pmId: string | null = null
  if (opts.paymentMethodId) {
    const pm = await stripe.paymentMethods.retrieve(opts.paymentMethodId)
    const pmCustomer = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
    if (pmCustomer !== customerId) return { status: 'error', httpStatus: 403, error: 'La tarjeta no corresponde a esta cuenta' }
    pmId = pm.id
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: pmId } })
  } else {
    pmId = (await getCustomerCard(customerId))?.id ?? null
  }
  if (!pmId && !opts.confirmOnly) return { status: 'declined', message: 'no_card' }

  // Reusar una reactivación a medias (tarjeta rechazada o verificación
  // pendiente) en vez de crear otra Subscription.
  let sub: Stripe.Subscription | null = null
  if (entry.status === 'incomplete' && entry.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(entry.stripeSubscriptionId, { expand: ['latest_invoice'] })
    if (existing.status === 'active' || existing.status === 'trialing') {
      return finalizeReactivation(order, entry, existing, pmId)
    }
    if (existing.status === 'incomplete') sub = existing
  }
  if (opts.confirmOnly && !sub) return { status: 'error', httpStatus: 409, error: 'No hay una reactivación pendiente' }

  if (!sub) {
    const fee = recurringFeeFor(service, brandKeyOf(order))
    if (!fee) return { status: 'error', httpStatus: 400, error: 'Servicio sin precio' }
    const built = buildSubscriptionItems(fee, brandKeyOf(order))
    if ('error' in built) {
      console.error('[subscription-reactivate]', built.error, order.id)
      return { status: 'error', httpStatus: 500, error: 'No se pudo preparar el cobro' }
    }
    sub = await stripe.subscriptions.create({
      customer: customerId,
      items: built.items,
      default_payment_method: pmId!,
      payment_behavior: 'default_incomplete',
      metadata: { orderId: order.id, service, reactivation: '1' },
      expand: ['latest_invoice'],
    })
    const previous = [
      ...(entry.previousSubscriptions ?? []),
      ...(entry.status === 'canceled'
        ? [{ stripeSubscriptionId: entry.stripeSubscriptionId, createdAt: entry.createdAt, canceledAt: entry.canceledAt, cancelType: entry.cancelType }]
        : []),
    ]
    const periodEnd = sub.items.data[0]?.current_period_end
    await upsertOrderSubscription(order.id, {
      service,
      stripeSubscriptionId: sub.id,
      status: 'incomplete',
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      createdAt: new Date().toISOString(),
      // Mientras no se cobre: si Stripe la da por vencida y la borra, el
      // webhook no le manda al cliente un email de "cancelada".
      cancelNoticeSent: true,
      previousSubscriptions: previous,
    })
  } else if (pmId) {
    await stripe.subscriptions.update(sub.id, { default_payment_method: pmId })
  }

  const invoice = sub.latest_invoice
  const invoiceId = typeof invoice === 'string' ? invoice : invoice?.id
  if (!invoiceId) return { status: 'error', httpStatus: 500, error: 'No se encontró la factura' }

  const freshInvoice = await stripe.invoices.retrieve(invoiceId)
  if (freshInvoice.status === 'paid') {
    const paidSub = await stripe.subscriptions.retrieve(sub.id)
    const currentEntry = { ...entry, stripeSubscriptionId: sub.id }
    return finalizeReactivation(order, currentEntry, paidSub, pmId)
  }
  if (opts.confirmOnly) {
    const pi = await invoicePaymentIntent(stripe, invoiceId)
    if (pi?.status === 'requires_action' && pi.client_secret) return { status: 'requires_action', clientSecret: pi.client_secret }
    return { status: 'declined', message: 'not_completed' }
  }

  try {
    await stripe.invoices.pay(invoiceId, { payment_method: pmId! })
  } catch (err) {
    const pi = await invoicePaymentIntent(stripe, invoiceId).catch(() => null)
    if (pi?.status === 'requires_action' && pi.client_secret) return { status: 'requires_action', clientSecret: pi.client_secret }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscription-reactivate] cobro rechazado:', order.id, service, msg)
    return { status: 'declined', message: 'declined' }
  }

  const paidSub = await stripe.subscriptions.retrieve(sub.id)
  return finalizeReactivation(order, { ...entry, stripeSubscriptionId: sub.id }, paidSub, pmId)
}

async function finalizeReactivation(
  order: ReactivationOrder,
  _entry: OrderSubscriptionEntry,
  sub: Stripe.Subscription,
  pmId: string | null,
): Promise<ReactivationResult> {
  const supabase = getSupabaseAdmin()
  const service = (sub.metadata?.service as string) || _entry.service

  // Releer la entrada actual (el webhook invoice.paid puede haberla tocado).
  const { data: fresh } = await supabase.from('Order').select('subscriptions, notes').eq('id', order.id).maybeSingle()
  const freshSubs: OrderSubscriptionEntry[] = Array.isArray(fresh?.subscriptions) ? fresh!.subscriptions : []
  const current = freshSubs.find(s => s.service === service)
  const periodEnd = sub.items.data[0]?.current_period_end
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : current?.currentPeriodEnd ?? null

  let card: { brand: string; last4: string } | null = null
  if (pmId) {
    try {
      const pm = await getStripe().paymentMethods.retrieve(pmId)
      card = pm.card ? { brand: pm.card.brand, last4: pm.card.last4 } : null
    } catch { /* solo para el texto */ }
  }

  // Ya finalizada antes (doble clic, o el navegador volvió a confirmar).
  if (current?.reactivatedAt && current.stripeSubscriptionId === sub.id) {
    return { status: 'active', currentPeriodEnd, card }
  }

  await upsertOrderSubscription(order.id, {
    ...(current ?? _entry),
    service,
    stripeSubscriptionId: sub.id,
    status: 'active',
    currentPeriodEnd,
    cancelNoticeSent: false,
    cancelType: undefined,
    serviceEndsAt: undefined,
    canceledAt: undefined,
    reactivatedAt: new Date().toISOString(),
  })

  const stamp = new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })
  const line = `[${stamp}] Cliente reactivó ${service} desde el portal (suscripción nueva ${sub.id}).${card ? ` Cobrado a la tarjeta terminada en ${card.last4}.` : ''}`
  await supabase.from('Order').update({ notes: fresh?.notes ? `${fresh.notes}\n${line}` : line }).eq('id', order.id)

  const brand = order.sourceBrand as EmailBrand
  const isEs = isEsOrder(order)
  const quote = reactivationQuote(service, brandKeyOf(order))
  const amount = quote?.total ?? 0
  const cat = SERVICES_CATALOG[service]
  const serviceName = cat ? (isEs ? cat.name_es : cat.name_en) : service
  const orderNumber = `FBFC-${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const customerName = [order.firstName, order.lastName].filter(Boolean).join(' ').trim()
  const company = order.companyName && order.companyName !== 'Pending' ? order.companyName : null

  after(async () => {
    try {
      await getResend().emails.send({
        from: brandFrom(brand),
        replyTo: brandReplyTo(brand),
        to: order.email,
        subject: isEs
          ? `${brandSubjectPrefix(brand)}Su ${serviceName} está ${service === 'annual-report' ? 'activa' : 'activo'} de nuevo`
          : `${brandSubjectPrefix(brand)}Your ${serviceName} is active again`,
        html: buildReactivationEmailHtml({ brand, isEs, service, serviceName, customerName, company, orderNumber, amount, last4: card?.last4 ?? null, renewalDate: currentPeriodEnd }),
      })
    } catch (e) { console.error('[subscription-reactivate] client email error (non-fatal):', e) }
  })

  after(() => notifyOps(`Servicio REACTIVADO por el cliente\n${cat?.name_es ?? service} · $${amount.toFixed(2)}\nOrden: ${orderNumber}\nCliente: ${customerName || order.email} (${order.email})\n${company ? `Empresa: ${company}\n` : ''}https://opabiz.com/admin/orders/${order.id}`, 'info'))

  // Agente Registrado: alta nueva con el proveedor. Se conserva raCompanyId
  // (la empresa ya existe allá) y se limpia el servicio anterior para que la
  // cadena cree uno nuevo y mande al cliente la dirección por email.
  if (service === 'registered-agent') {
    after(async () => {
      try {
        await supabase.from('Order').update({
          raServiceId: null, raInvoiceId: null, raInvoicePaid: false, raAddress: null,
          raProvisionedAt: null, raAddressEmailSentAt: null,
        }).eq('id', order.id)
        await provisionRaForOrder(order.id)
      } catch (e) { console.error('[subscription-reactivate] RA provisioning error:', e) }
    })
  }

  return { status: 'active', currentPeriodEnd, card }
}

function buildReactivationEmailHtml(p: {
  brand: EmailBrand
  isEs: boolean
  service: string
  serviceName: string
  customerName: string
  company: string | null
  orderNumber: string
  amount: number
  last4: string | null
  renewalDate: string | null
}): string {
  const { isEs } = p
  const forCompany = p.company ? (isEs ? ` para ${p.company}` : ` for ${p.company}`) : ''
  const amount = `$${p.amount.toFixed(2)}`
  const date = formatCancelDate(p.renewalDate, isEs ? 'es' : 'en')
  const paras: string[] = []
  paras.push(isEs
    ? `Confirmamos que reactivó su servicio de <strong>${p.serviceName}</strong>${forCompany}. Cobramos <strong>${amount}</strong>${p.last4 ? ` a su tarjeta terminada en ${p.last4}` : ''}.`
    : `This confirms that you reactivated your <strong>${p.serviceName}</strong> service${forCompany}. We charged <strong>${amount}</strong>${p.last4 ? ` to your card ending in ${p.last4}` : ''}.`)
  if (date) {
    paras.push(isEs
      ? `Su servicio se renovará automáticamente el <strong>${date}</strong> al precio vigente. Puede cancelar la renovación cuando quiera desde su cuenta.`
      : `Your service will renew automatically on <strong>${date}</strong> at the then-current rate. You can cancel the renewal anytime from your account.`)
  }
  if (p.service === 'registered-agent') {
    paras.push(isEs
      ? 'En breve le enviaremos por email la dirección de su Agente Registrado. Si es distinta a la anterior, recuerde actualizarla ante el Estado de Florida.'
      : "We'll email you your Registered Agent address shortly. If it's different from the previous one, remember to update it with the State of Florida.")
  }
  if (p.service === 'annual-report') {
    paras.push(isEs
      ? 'Presentaremos su próxima Declaración Anual en el período que establece Florida, entre el 1 de enero y el 1 de mayo.'
      : 'We will file your next Annual Report during the period set by Florida, between January 1 and May 1.')
  }
  const greeting = p.customerName ? (isEs ? `Hola ${p.customerName},` : `Hello ${p.customerName},`) : (isEs ? 'Hola,' : 'Hello,')
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
      <table style="width:100%;border-collapse:collapse;padding:20px 28px;background:#fff;border-radius:10px 10px 0 0"><tr>${brandHeaderHtml(p.brand)}</tr></table>
      <div style="background:#fff;padding:8px 28px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px;line-height:1.6">
        <p>${greeting}</p>
        <p style="color:#64748b;font-size:13px">${isEs ? 'Número de Orden' : 'Order Number'}: <strong style="color:#1e293b">${p.orderNumber}</strong></p>
        ${paras.map(t => `<p>${t}</p>`).join('\n        ')}
        <div style="text-align:center;margin:20px 0">
          <a href="${brandPortalHome(p.brand)}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">${isEs ? 'Ver Mi Cuenta' : 'View My Account'}</a>
        </div>
        <p style="color:#64748b;font-size:12.5px">${brandFooterLine(p.brand)}</p>
      </div>
    </div>
  `
}
