// Programa de Afiliados — núcleo de lógica (cupones Stripe + cálculo de
// comisión). Ver supabase_migration_affiliates.sql para el esquema y
// CLAUDE.md (sesión del programa de afiliados) para el diseño completo.
//
// Modelo Stripe: 1 Coupon compartido (10% off, id en STRIPE_AFFILIATE_COUPON_ID,
// creado a mano — ver scripts/create-affiliate-coupon.mjs para TEST) + 1
// Promotion Code por afiliado (creado acá al aprobar). `allow_promotion_codes`
// ya está activo en ambos checkouts (embedded/embedded-services) — cero
// cambios ahí, el campo nativo de cupón de Stripe ya acepta estos códigos.
//
// La comisión NUNCA se calcula leyendo el desglose de descuento de Stripe
// (sería frágil con line items ad-hoc sin Price IDs reales). En su lugar usa
// valores que el sistema ya conoce de antemano: el subtotal de tarifas de
// servicio (mismo motor de precios que ya usa el checkout) y los porcentajes
// fijos de descuento/comisión — ver serviceFeeSubtotal() y
// recordAffiliateCommissionForOrder() más abajo.

import Stripe from 'stripe'
import { randomBytes } from 'node:crypto'
import { getSupabaseAdmin } from './supabase'
import { computeFormationTotal } from './pricing'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export const AFFILIATE_COMMISSION_DEFAULT_PERCENT = 15
export const AFFILIATE_COUPON_DISCOUNT_PERCENT = 10
export const AFFILIATE_PAYOUT_THRESHOLD_USD = 200
export const AFFILIATE_PAYOUT_MONTHS = 2

// Comisión por defecto de un "agente" aprobado — distinto del afiliado: gana
// por orden que asiste en persona (vía la intake asistida de OpaBiz Connect),
// no por un cupón de descuento. Esas órdenes NO llevan descuento al cliente.
// El cálculo/registro real de esta comisión (enganchado a `ordenes_opabiz`,
// no a un promotion code de Stripe) queda pendiente de otra sesión — por
// ahora solo se guarda el % en `affiliates.commission_percent` al aprobar.
export const AGENT_COMMISSION_DEFAULT_PERCENT = 25

// Cubre tanto "Florida State Filing Fee (LLC)" (formación) como "<servicio> —
// Florida State Fee" / "— Tarifa Estatal de Florida" (à la carte) — mismos
// labels ya usados por lib/pricing.ts y lib/services-pricing.ts.
const STATE_FEE_LABEL_RE = /(state (filing )?fee|tarifa estatal)/i

export function isStateFeeLine(label: string): boolean {
  return STATE_FEE_LABEL_RE.test(label)
}

export function serviceFeeSubtotal(lines: { label: string; amount: number }[]): number {
  return lines.filter(l => !isStateFeeLine(l.label)).reduce((sum, l) => sum + (l.amount || 0), 0)
}

// Código puramente aleatorio — a propósito NO se deriva del nombre del
// afiliado (antes sí, ej. "Maria Lopez" -> "MARIA482"; decisión revertida
// 2026-09-22, el founder no quiere que el código revele quién es el
// afiliado). Charset sin 0/O/1/I/L — evita confusión al leer/tipear el
// código en voz alta. No garantiza unicidad por sí solo — ver
// createPromotionCodeForAffiliate, que reintenta si Stripe ya tiene ese code.
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function generateCouponCodeCandidate(salt = 0): string {
  const bytes = randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length]
  return salt === 0 ? code : `${code}${salt}`
}

/**
 * Crea el Promotion Code de Stripe para un afiliado recién aprobado, sobre el
 * único Coupon compartido (10% off, STRIPE_AFFILIATE_COUPON_ID). Reintenta con
 * un código nuevo si el elegido ya existe en Stripe. No toca la DB — el caller
 * (ruta de aprobación) guarda el resultado en `affiliates`.
 */
export async function createPromotionCodeForAffiliate(): Promise<{ id: string; code: string }> {
  const couponId = process.env.STRIPE_AFFILIATE_COUPON_ID
  if (!couponId) throw new Error('STRIPE_AFFILIATE_COUPON_ID no está configurado')

  const stripe = getStripe()
  let lastErr: unknown
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCouponCodeCandidate(attempt)
    try {
      const promo = await stripe.promotionCodes.create({ promotion: { type: 'coupon', coupon: couponId }, code, active: true })
      return { id: promo.id, code: promo.code }
    } catch (err) {
      lastErr = err
      // Stripe devuelve 'resource_already_exists' si el code choca con uno
      // existente — reintentamos con otro candidato. Cualquier otro error corta.
      const code = (err as { code?: string } | null)?.code
      if (code !== 'resource_already_exists') throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('No se pudo generar un código de cupón único')
}

/**
 * Punto de enganche llamado desde el webhook de Stripe (handleFormationPaid /
 * handleServicesPaid), tras marcar la orden como pagada — ver ambos `after()`
 * en app/api/webhooks/stripe/route.ts. No-op silencioso si no se usó ningún
 * promotion code, o si el que se usó no pertenece a un afiliado aprobado (ej.
 * un cupón suelto de prueba). Puede lanzar (I/O a Stripe/Supabase) — el
 * caller la invoca dentro de su propio try/catch, mismo patrón que
 * provisionRaForOrder/createRecurringSubscriptionsForOrder: nunca debe poder
 * bloquear el procesamiento del pago ni los emails.
 */
export async function recordAffiliateCommissionForOrder(
  orderId: string,
  session: Stripe.Checkout.Session,
  kind: 'formation' | 'services',
  order: Record<string, unknown>
): Promise<void> {
  const stripe = getStripe()
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['discounts.promotion_code'],
  })
  const promoCode = (full.discounts ?? [])
    .map(d => d.promotion_code)
    .find((pc): pc is Stripe.PromotionCode => !!pc && typeof pc === 'object')
  if (!promoCode) return // sin cupón usado

  const supabase = getSupabaseAdmin()
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, commission_percent, first_order_at, total_commission_owed')
    .eq('stripe_promotion_code_id', promoCode.id)
    .eq('status', 'approved')
    .maybeSingle()
  if (!affiliate) return // el código usado no es de un afiliado aprobado

  // Idempotencia — protege contra reintentos del webhook de Stripe.
  const { data: existingCommission } = await supabase
    .from('affiliate_commissions')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (existingCommission) return

  let lines: { label: string; amount: number }[] = []
  if (kind === 'formation') {
    const addons = (order.addons ?? {}) as Record<string, boolean>
    const computed = computeFormationTotal({
      package: order.package as string,
      entityType: order.entityType as string,
      speed: order.speed as string,
      addons,
      registeredAgent: order.registeredAgent as string,
    })
    lines = computed.lines
  } else {
    // Órdenes de servicios à la carte ya guardan su desglose localizado en
    // addons.lines (mismo output de computeServicesTotal) — se reusa
    // directamente en vez de reconstruir bundleIds/newServicesByBundle acá.
    const addons = (order.addons ?? {}) as { lines?: { label: string; amount: number }[] }
    lines = Array.isArray(addons.lines) ? addons.lines : []
  }

  const subtotal = serviceFeeSubtotal(lines)
  if (subtotal <= 0) return // nada que comisionar (ej. orden 100% state fee)

  const commissionPercent = Number(affiliate.commission_percent) || AFFILIATE_COMMISSION_DEFAULT_PERCENT
  const netOfDiscount = subtotal * (1 - AFFILIATE_COUPON_DISCOUNT_PERCENT / 100)
  const commissionAmount = Math.round(netOfDiscount * (commissionPercent / 100) * 100) / 100

  const orderNumber = `FBFC-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const now = new Date().toISOString()

  await supabase.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    order_id: orderId,
    order_number: orderNumber,
    service_fee_subtotal: subtotal,
    discount_percent: AFFILIATE_COUPON_DISCOUNT_PERCENT,
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
  })

  await supabase
    .from('affiliates')
    .update({
      total_commission_owed: Number(affiliate.total_commission_owed || 0) + commissionAmount,
      first_order_at: affiliate.first_order_at ?? now,
      updated_at: now,
    })
    .eq('id', affiliate.id)
}

/** true si el afiliado ya debería cobrar (>= $200 acumulados, o >= 2 meses
 *  desde su primera orden con saldo pendiente) — usado solo para mostrar el
 *  badge en el admin, no dispara ningún pago real. */
export function isPayoutDue(affiliate: { total_commission_owed: number; first_order_at: string | null }): boolean {
  if (affiliate.total_commission_owed <= 0) return false
  if (affiliate.total_commission_owed >= AFFILIATE_PAYOUT_THRESHOLD_USD) return true
  if (!affiliate.first_order_at) return false
  const monthsSince = (Date.now() - new Date(affiliate.first_order_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  return monthsSince >= AFFILIATE_PAYOUT_MONTHS
}
