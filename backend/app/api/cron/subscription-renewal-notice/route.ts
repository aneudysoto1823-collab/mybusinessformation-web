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
// Disparo: Vercel Cron (vercel.json), 1 vez al día. Manual: curl con header
// Authorization: Bearer ${CRON_SECRET}.

import { NextRequest, NextResponse } from 'next/server'
import { SERVICES_CATALOG, FBFC_PRICE_OVERRIDES } from '@/lib/services-pricing'
import { listOrdersWithSubscriptions, upsertOrderSubscription, type OrderSubscriptionEntry } from '@/lib/order-subscriptions'
import { sendSubscriptionRenewalReminder } from '@/lib/subscription-renewal-emails'
import type { EmailBrand } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const REMINDER_WINDOW_DAYS = 30

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
    for (const entry of order.subscriptions) {
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
      if (entry.renewalReminderSentForPeriodEnd === entry.currentPeriodEnd) {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'already sent for this period' })
        continue
      }

      const renewalDate = new Date(entry.currentPeriodEnd)
      const daysUntil = Math.floor((renewalDate.getTime() - now.getTime()) / 86400000)

      if (daysUntil < 0 || daysUntil > REMINDER_WINDOW_DAYS) {
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'outside window' })
        continue
      }

      try {
        const brand = order.sourceBrand as EmailBrand
        await sendSubscriptionRenewalReminder({
          to: order.email,
          brand,
          isEs: order.isEs,
          serviceId: entry.service,
          companyName: order.companyName,
          renewalDate,
          amount: renewalAmount(entry.service, brand),
        })
        await upsertOrderSubscription(order.id, {
          ...entry,
          renewalReminderSentForPeriodEnd: entry.currentPeriodEnd,
        } as OrderSubscriptionEntry)
        results.push({ orderId: order.id, service: entry.service, sent: true })
      } catch (e) {
        console.error('[cron/subscription-renewal-notice] send error for', order.id, entry.service, e)
        results.push({ orderId: order.id, service: entry.service, sent: false, reason: 'send error' })
      }
    }
  }

  return NextResponse.json({ checked: results.length, sent: results.filter(r => r.sent).length, results })
}
