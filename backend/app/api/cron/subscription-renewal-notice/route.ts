// Cron diario: avisa por email a los clientes con un servicio recurrente
// ANUAL (Registered Agent, Annual Report) cuya renovación cae dentro de los
// próximos 30 días — decisión founder 2026-09-15. Virtual Address (mensual)
// queda afuera a propósito: no aplica el mismo aviso de 30 días a un ciclo
// que se cobra cada mes.
//
// Idempotente por período: cada OrderSubscriptionEntry guarda
// `renewalReminderSentForPeriodEnd` — si ya coincide con el `currentPeriodEnd`
// vigente, no se reenvía aunque el cron vuelva a correr al día siguiente. Al
// renovar (invoice.paid), currentPeriodEnd avanza al período siguiente y este
// valor queda desactualizado, habilitando el próximo aviso solo.
//
// Segundo chequeo (2026-10-07): 5 días antes del cobro, si la tarjeta guardada
// vence antes de la renovación, manda un email aparte pidiendo actualizarla.
// Mismo esquema idempotente con `cardExpiryWarningSentForPeriodEnd`.
//
// Disparo: Vercel Cron (vercel.json), 1 vez al día. Manual: curl con header
// Authorization: Bearer ${CRON_SECRET}.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SERVICES_CATALOG, FBFC_PRICE_OVERRIDES } from '@/lib/services-pricing'
import { listOrdersWithSubscriptions, upsertOrderSubscription, type OrderSubscriptionEntry } from '@/lib/order-subscriptions'
import { sendSubscriptionRenewalReminder, sendCardExpiryWarning } from '@/lib/subscription-renewal-emails'
import type { EmailBrand } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const REMINDER_WINDOW_DAYS = 30
// Chequeo de tarjeta por vencer: 5 días antes del cobro (decisión founder
// 2026-10-07). Tan cerca a propósito: si el banco ya le pasó la tarjeta nueva
// a Stripe (Card Account Updater), para entonces el PaymentMethod ya tiene la
// fecha nueva y no se manda nada.
const CARD_CHECK_WINDOW_DAYS = 5

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Tarjeta con la que se va a cobrar la renovación: la de la Subscription o,
// si no tiene una propia, la default del Customer. Devuelve null si no se
// puede saber (sin tarjeta, otro método de pago, error de Stripe) — el aviso
// sale igual, solo sin la advertencia de tarjeta.
async function getRenewalCard(subscriptionId: string): Promise<{ brand: string; last4: string; expMonth: number; expYear: number } | null> {
  try {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer.invoice_settings.default_payment_method'],
    })
    const own = typeof sub.default_payment_method === 'object' ? sub.default_payment_method : null
    const customer = typeof sub.customer === 'object' && !('deleted' in sub.customer && sub.customer.deleted) ? sub.customer as Stripe.Customer : null
    const fallback = customer && typeof customer.invoice_settings?.default_payment_method === 'object' ? customer.invoice_settings.default_payment_method : null
    const pm = own ?? fallback
    if (!pm?.card) return null
    return { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year }
  } catch (e) {
    console.error('[cron/subscription-renewal-notice] could not read card for', subscriptionId, e)
    return null
  }
}

// Una tarjeta vence al FINAL de su mes de expiración. Si ese momento es
// anterior a la fecha de renovación, el cobro va a fallar — avisamos antes.
function cardExpiresBefore(card: { expMonth: number; expYear: number }, date: Date): boolean {
  const endOfExpMonth = new Date(Date.UTC(card.expYear, card.expMonth, 1)) // primer día del mes siguiente
  return endOfExpMonth.getTime() <= date.getTime()
}

function renewalAmount(serviceId: string, brand: EmailBrand): number {
  const svc = SERVICES_CATALOG[serviceId]
  if (!svc) return 0
  const override = brand === 'fbfc' ? FBFC_PRICE_OVERRIDES[serviceId] : undefined
  const serviceFee = override ?? svc.renewalFee ?? svc.serviceFee
  return serviceFee + svc.stateFee
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const orders = await listOrdersWithSubscriptions()

  const results: { orderId: string; service: string; sent: boolean; reason?: string }[] = []

  for (const order of orders) {
    for (const originalEntry of order.subscriptions) {
      let entry = originalEntry
      const svc = SERVICES_CATALOG[entry.service]

      if (svc?.billing !== 'annual') {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'not annual' })
        continue
      }
      if (entry.status !== 'active' && entry.status !== 'trialing') {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: `status ${entry.status}` })
        continue
      }
      if (!entry.currentPeriodEnd) {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'no currentPeriodEnd' })
        continue
      }

      const renewalDate = new Date(entry.currentPeriodEnd)
      const daysUntil = Math.floor((renewalDate.getTime() - now.getTime()) / 86400000)
      const brand = order.sourceBrand as EmailBrand

      // 1) Aviso de renovación, 30 días antes.
      if (entry.renewalReminderSentForPeriodEnd === entry.currentPeriodEnd) {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'reminder already sent for this period' })
      } else if (daysUntil < 0 || daysUntil > REMINDER_WINDOW_DAYS) {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'outside reminder window' })
      } else {
        try {
          await sendSubscriptionRenewalReminder({
            to: order.email,
            brand,
            isEs: order.isEs,
            serviceId: entry.service,
            companyName: order.companyName,
            renewalDate,
            amount: renewalAmount(entry.service, brand),
          })
          entry = { ...entry, renewalReminderSentForPeriodEnd: entry.currentPeriodEnd } as OrderSubscriptionEntry
          await upsertOrderSubscription(order.id, entry)
          results.push({ orderId: order.id, service: entry.service, sent: true, reason: 'renewal reminder' })
        } catch (e) {
          console.error('[cron/subscription-renewal-notice] send error for', order.id, entry.service, e)
          results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'reminder send error' })
        }
      }

      // 2) Tarjeta por vencer, 5 días antes del cobro.
      if (
        daysUntil >= 0 && daysUntil <= CARD_CHECK_WINDOW_DAYS &&
        entry.cardExpiryWarningSentForPeriodEnd !== entry.currentPeriodEnd
      ) {
        const card = await getRenewalCard(entry.stripeSubscriptionId)
        if (card && cardExpiresBefore(card, renewalDate)) {
          try {
            await sendCardExpiryWarning({
              to: order.email,
              brand,
              isEs: order.isEs,
              serviceId: entry.service,
              companyName: order.companyName,
              renewalDate,
              card,
            })
            entry = { ...entry, cardExpiryWarningSentForPeriodEnd: entry.currentPeriodEnd } as OrderSubscriptionEntry
            await upsertOrderSubscription(order.id, entry)
            results.push({ orderId: order.id, service: entry.service, sent: true, reason: 'card expiry warning' })
          } catch (e) {
            console.error('[cron/subscription-renewal-notice] card warning error for', order.id, entry.service, e)
            results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'card warning send error' })
          }
        }
      }
    }
  }

  return NextResponse.json({ checked: results.length, sent: results.filter(r => r.sent).length, results })
}
