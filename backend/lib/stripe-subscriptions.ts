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
//
// Tarifa estatal itemizada aparte (2026-09-07): Annual Report cobra también
// $139 de tarifa estatal en cada renovación (a diferencia de una tarifa de
// formación, que se paga una sola vez). Va como una 2da línea dentro de la
// MISMA Subscription (mismo ciclo, se cancelan juntas) usando un Product
// genérico compartido por marca (STRIPE_PRODUCT_ID_STATE_FEE_OPABIZ/_FBFC) —
// nunca un monto combinado en un solo price_data. Requiere 8 Products en
// total (6 de servicio + 2 de tarifa estatal), no 6.
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

// Product genérico reusado por CUALQUIER servicio recurrente con stateFeeCents
// > 0 (hoy solo Annual Report) para la línea de tarifa estatal, itemizada
// aparte del service fee dentro de la misma Subscription — mismo patrón de
// "un Product por marca" que los de arriba (el nombre es lo que el cliente ve
// en la factura).
const STATE_FEE_PRODUCT_ENV: Record<'opabiz' | 'fbfc', string> = {
  opabiz: 'STRIPE_PRODUCT_ID_STATE_FEE_OPABIZ',
  fbfc: 'STRIPE_PRODUCT_ID_STATE_FEE_FBFC',
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

      const interval = svc.billing === 'monthly' ? 'month' : 'year'
      const items: Stripe.SubscriptionCreateParams.Item[] = [{
        price_data: {
          currency: CURRENCY,
          product: productId,
          unit_amount: svc.serviceFeeCents,
          recurring: { interval },
        },
      }]

      // Tarifa estatal itemizada aparte (misma Subscription, mismo ciclo) —
      // solo cuando el servicio la tiene (hoy solo Annual Report). Si falta el
      // Product genérico, no se crea la Subscription a medias (cobraría de
      // menos cada renovación) — mismo criterio que el guard de arriba.
      if (svc.stateFeeCents > 0) {
        const stateFeeEnvKey = STATE_FEE_PRODUCT_ENV[brandKey]
        const stateFeeProductId = process.env[stateFeeEnvKey]
        if (!stateFeeProductId) {
          console.error(`[stripe-subscriptions] falta env var ${stateFeeEnvKey} — no se puede crear la subscription de "${svc.service}" (requiere tarifa estatal itemizada)`, orderId)
          continue
        }
        items.push({
          price_data: {
            currency: CURRENCY,
            product: stateFeeProductId,
            unit_amount: svc.stateFeeCents,
            recurring: { interval },
          },
        })
      }

      const subscription = await stripe.subscriptions.create(
        {
          customer: stripeCustomerId,
          items,
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
