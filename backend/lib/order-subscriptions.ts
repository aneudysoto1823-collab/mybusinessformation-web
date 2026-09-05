// ─────────────────────────────────────────────────────────────────────────────
// Estado de facturación recurrente de una orden (Order.subscriptions, JSONB).
// Dato ortogonal a lib/order-items.ts: ese archivo resuelve "qué compró el
// cliente" desde Order.addons; este resuelve "de lo que compró, qué se está
// cobrando solo y en qué estado está" — nunca reemplaza a order-items.ts.
//
// Un servicio recurrente (Registered Agent, Virtual Address, Annual Report)
// se identifica por SERVICES_CATALOG[id].billing (ver lib/services-pricing.ts).
// Cada uno tiene su propia Stripe Subscription independiente — nunca se
// mezclan varias en un mismo objeto (ver supabase_migration_recurring_subscriptions.sql).
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from './supabase'
import { SERVICES_CATALOG, SERVICE_BUNDLES, FBFC_PRICE_OVERRIDES } from './services-pricing'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export interface OrderSubscriptionEntry {
  service: string
  stripeSubscriptionId: string
  status: SubscriptionStatus
  currentPeriodEnd: string | null // ISO date
  createdAt: string // ISO date
}

// epoch seconds — ahora + 1 período según la cadencia. Se usa como `trial_end`
// al crear la Subscription: el primer período ya se cobró (o fue gratis por
// freeWithOther) como parte del pago único del checkout, así que la
// Subscription arranca a cobrar sola recién en el período 2, en el
// aniversario exacto de la compra (coincide con los Términos §4.4).
export function computeTrialEnd(billing: 'monthly' | 'annual'): number {
  const d = new Date()
  if (billing === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return Math.floor(d.getTime() / 1000)
}

export interface RecurringServiceToCreate {
  service: string
  billing: 'monthly' | 'annual'
  unitAmountCents: number
}

// Resuelve, a partir de Order.package + Order.addons, qué servicios
// recurrentes hay que suscribir tras el pago — sin recalcular nada del
// request en vivo, todo sale de lo que ya está guardado en la orden.
//
// `brand` (Order.sourceBrand) determina el precio de renovación: hoy ningún
// servicio recurrente tiene override de marca en FBFC_PRICE_OVERRIDES (solo
// EIN lo tiene), pero si se agrega uno más adelante (mybusinessformation.com
// cobrando más caro RA/VA/AR, como ya se anticipó) esto lo recoge automático
// — sin este chequeo, la Subscription se crearía siempre al precio de OpaBiz
// sin importar la marca real de la orden.
export function getRecurringServicesFromOrder(pkg: string | null | undefined, addons: unknown, brand?: 'opabiz' | 'fbfc' | null): RecurringServiceToCreate[] {
  const pkgKey = (pkg ?? '').toLowerCase().trim()
  const out: RecurringServiceToCreate[] = []

  const pushIfRecurring = (id: string) => {
    const svc = SERVICES_CATALOG[id]
    if (!svc?.billing) return
    if (out.some(s => s.service === id)) return
    const override = brand === 'fbfc' ? FBFC_PRICE_OVERRIDES[id] : undefined
    // + stateFee: a diferencia de una tarifa estatal de formación (se paga una
    // sola vez), la de un servicio recurrente (hoy solo Annual Report,
    // stateFee $139) se paga TODOS los años junto con la presentación — sin
    // esto, la Subscription cobraría de menos a partir del año 2 (solo el
    // service fee, sin cubrir lo que realmente hay que pagarle al estado).
    // RA y VA tienen stateFee 0, así que no les afecta.
    const unitAmount = (override ?? svc.renewalFee ?? svc.serviceFee) + svc.stateFee
    out.push({ service: id, billing: svc.billing, unitAmountCents: Math.round(unitAmount * 100) })
  }

  if (pkgKey === 'services') {
    const a = (addons && typeof addons === 'object' && !Array.isArray(addons))
      ? addons as { services?: unknown; bundles?: unknown }
      : {}
    const bundleIds = Array.isArray(a.bundles)
      ? a.bundles.filter((b): b is string => typeof b === 'string' && !!SERVICE_BUNDLES[b])
      : []
    const serviceIds = Array.isArray(a.services)
      ? a.services.filter((s): s is string => typeof s === 'string' && !!SERVICES_CATALOG[s])
      : []
    for (const bid of bundleIds) {
      for (const s of SERVICE_BUNDLES[bid].services) pushIfRecurring(s)
    }
    for (const s of serviceIds) pushIfRecurring(s)
    return out
  }

  // Formación (basic/standard/premium): único addon recurrente posible es
  // Annual Report (addons.ar === true).
  const a = (addons && typeof addons === 'object' && !Array.isArray(addons))
    ? addons as Record<string, boolean>
    : {}
  if (a.ar === true) pushIfRecurring('annual-report')
  return out
}

// Lee Order.subscriptions, reemplaza (o agrega) la entrada de ese `service`,
// y escribe de vuelta. Se usa tanto al crear la Subscription como en cada
// evento de renovación/fallo/cancelación — nunca toca las entradas de otros
// servicios de la misma orden.
export async function upsertOrderSubscription(orderId: string, entry: OrderSubscriptionEntry): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: order, error: fetchErr } = await supabase
    .from('Order')
    .select('subscriptions')
    .eq('id', orderId)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  const current: OrderSubscriptionEntry[] = Array.isArray(order?.subscriptions) ? order.subscriptions : []
  const next = current.filter(e => e.service !== entry.service)
  next.push(entry)

  const { error: updateErr } = await supabase
    .from('Order')
    .update({ subscriptions: next })
    .eq('id', orderId)
  if (updateErr) throw updateErr
}

// Busca la orden dueña de una Stripe Subscription dada — usado por los
// handlers de invoice.paid / invoice.payment_failed / customer.subscription.deleted,
// que solo traen el subscription id de Stripe, no el orderId directo.
export async function findOrderBySubscriptionId(stripeSubscriptionId: string): Promise<{ id: string; subscriptions: OrderSubscriptionEntry[]; sourceBrand: string | null; email: string } | null> {
  const supabase = getSupabaseAdmin()
  // @brand-unified — se busca por subscription id de Stripe, la marca de la
  // orden recién se conoce DESPUÉS de encontrarla (se devuelve en el result,
  // sourceBrand) — no hay forma de filtrar por marca de antemano acá.
  const { data, error } = await supabase
    .from('Order')
    .select('id, subscriptions, sourceBrand, email')
    .contains('subscriptions', [{ stripeSubscriptionId }])
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
    sourceBrand: data.sourceBrand ?? null,
    email: data.email,
  }
}
