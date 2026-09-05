// ─────────────────────────────────────────────────────────────────────────────
// Crea las Stripe Subscriptions reales de una orden recién pagada, una por
// cada servicio recurrente (Registered Agent / Virtual Address / Annual
// Report) presente en el carrito — nunca mezcladas en un mismo objeto.
//
// El checkout (mode:'payment', ver checkout/embedded[-services]/route.ts) ya
// cobró el primer período (o fue $0 por freeWithOther) y guardó la tarjeta
// vía `payment_intent_data.setup_future_usage:'off_session'` +
// `customer_creation:'always'` — por eso la Subscription arranca con
// `trial_end` = ahora + 1 período: no vuelve a cobrar ese primer período,
// solo empieza a facturar sola desde el período 2.
//
// ⚠️ A diferencia de los Checkout Sessions (que sí aceptan product_data
// inline), el price_data de una Subscription exige un Product ID de Stripe
// ya existente (SDK 20.4.1 / API 2026-02-25.clover) — no se puede crear el
// producto al vuelo en cada llamada sin arriesgar duplicados (una idempotency
// key en products.create() no es una alias permanente: expira ~24h, así que
// confiar en ella para "reusar el mismo producto para siempre" crearía un
// Product nuevo por cada Subscription más allá del primer día). Por eso el
// Product ID de cada servicio recurrente se crea UNA VEZ a mano en el
// dashboard de Stripe (test y live por separado, mismo patrón que
// STRIPE_BASIC_COUPON_ID) y se referencia acá vía env var.
//
// Un Product POR MARCA (no compartido entre opabiz.com y mybusinessformation.com)
// — mismo criterio que el resto del sitio (emails, guías, checkout branding):
// el nombre/descripción del Product es lo que el cliente ve en la factura y el
// Billing Portal, así que debe reflejar la marca real de esa orden. Además dos
// Products separados dejan la puerta abierta a que sus precios diverjan del
// todo en el futuro sin ningún cambio de código (ver getServiceFee/
// FBFC_PRICE_OVERRIDES en lib/services-pricing.ts).
// ─────────────────────────────────────────────────────────────────────────────

import type Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { computeTrialEnd, upsertOrderSubscription, getRecurringServicesFromOrder, type SubscriptionStatus } from './order-subscriptions'

const CURRENCY = 'usd'

const SERVICE_PRODUCT_ENV: Record<string, { opabiz: string; fbfc: string }> = {
  'registered-agent': { opabiz: 'STRIPE_PRODUCT_ID_REGISTERED_AGENT_OPABIZ', fbfc: 'STRIPE_PRODUCT_ID_REGISTERED_AGENT_FBFC' },
  'virtual-address':  { opabiz: 'STRIPE_PRODUCT_ID_VIRTUAL_ADDRESS_OPABIZ',  fbfc: 'STRIPE_PRODUCT_ID_VIRTUAL_ADDRESS_FBFC' },
  'annual-report':    { opabiz: 'STRIPE_PRODUCT_ID_ANNUAL_REPORT_OPABIZ',   fbfc: 'STRIPE_PRODUCT_ID_ANNUAL_REPORT_FBFC' },
}

export async function createRecurringSubscriptionsForOrder(
  stripe: Stripe,
  orderId: string,
  stripeCustomerId: string | null,
  pkg: string | null | undefined,
  addons: unknown,
  sourceBrand?: string | null,
): Promise<void> {
  const recurring = getRecurringServicesFromOrder(pkg, addons, sourceBrand as 'opabiz' | 'fbfc' | null)
  if (recurring.length === 0) return

  if (!stripeCustomerId) {
    console.error('[stripe-subscriptions] orden sin stripeCustomerId, no se pueden crear subscriptions:', orderId, recurring.map(r => r.service))
    return
  }

  await getSupabaseAdmin().from('Order').update({ stripeCustomerId }).eq('id', orderId)

  const brandKey: 'opabiz' | 'fbfc' = sourceBrand === 'fbfc' ? 'fbfc' : 'opabiz'

  for (const svc of recurring) {
    try {
      const envKey = SERVICE_PRODUCT_ENV[svc.service][brandKey]
      const productId = process.env[envKey]
      if (!productId) {
        console.error(`[stripe-subscriptions] falta env var ${envKey} — no se puede crear la subscription de "${svc.service}"`, orderId)
        continue
      }

      const subscription = await stripe.subscriptions.create(
        {
          customer: stripeCustomerId,
          items: [{
            price_data: {
              currency: CURRENCY,
              product: productId,
              unit_amount: svc.unitAmountCents,
              recurring: { interval: svc.billing === 'monthly' ? 'month' : 'year' },
            },
          }],
          trial_end: computeTrialEnd(svc.billing),
          metadata: { orderId, service: svc.service },
        },
        { idempotencyKey: `sub_${orderId}_${svc.service}` }
      )

      const periodEnd = subscription.items.data[0]?.current_period_end

      await upsertOrderSubscription(orderId, {
        service: svc.service,
        stripeSubscriptionId: subscription.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[stripe-subscriptions] fallo creando subscription', orderId, svc.service, err)
    }
  }
}
