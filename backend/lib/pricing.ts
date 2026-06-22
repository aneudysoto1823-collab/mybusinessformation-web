// ─────────────────────────────────────────────────────────────────────────────
// Precios autoritativos del lado servidor para órdenes de formación (Florida).
//
// Espeja la lógica del formulario del home (backend/app/page.tsx, fmBuildPayload /
// updateTotal) pero ES la fuente de verdad para el cobro: el monto se recalcula
// aquí a partir de los datos guardados de la orden, de modo que NUNCA se confía
// en el `amount` que envía el navegador (anti-tampering).
//
// Si cambian los precios del formulario, actualizar también estas constantes.
// ─────────────────────────────────────────────────────────────────────────────

export type EntityType = 'llc' | 'corp'
export type Speed = 'standard' | 'expedited'
export type PackageId = 'basic' | 'standard' | 'premium'

export const PACKAGE_PRICES: Record<PackageId, number> = { basic: 0, standard: 199, premium: 299 }

// Precio de "lista" del paquete Basic, para mostrarlo como OFERTA en el checkout
// de Stripe: se incluye como line item a este precio y un cupón (-este mismo
// monto) lo deja en $0. El cliente ve "Basic Formation Package $99 → -$99".
// ⚠️ Si cambias este número, ajusta también el cupón en Stripe: su amount_off
// debe ser exactamente igual (ver STRIPE_BASIC_COUPON_ID en /api/checkout/embedded).
export const BASIC_PACKAGE_LIST_PRICE = 99

// Add-ons cobrables (igual que fmBuildPayload en page.tsx). `ar` y `raInfo` NO
// se cobran aquí — coinciden con el cálculo del formulario.
export const ADDON_PRICES = { ein: 79, oa: 59, itin: 69, btr: 79, str: 79, cc: 49 } as const
export type AddonKey = keyof typeof ADDON_PRICES

export const EXPEDITED_FEE = 99
export const STATE_FEE: Record<EntityType, number> = { llc: 125, corp: 70 }

const ADDON_LABELS: Record<AddonKey, string> = {
  ein:  'EIN / Tax ID Number',
  oa:   'Operating Agreement',
  itin: 'ITIN Application',
  btr:  'Business Tax Receipt',
  str:  'Sales Tax Registration',
  cc:   'Certified Copy',
}

const PACKAGE_LABELS: Record<PackageId, string> = {
  basic:    'Basic Formation Package',
  standard: 'Standard Formation Package',
  premium:  'Premium Formation Package',
}

export interface FormationPricingInput {
  package?: string | null
  entityType?: string | null
  speed?: string | null
  addons?: Record<string, unknown> | null
}

export interface PriceLine {
  label: string
  /** monto en dólares (entero) */
  amount: number
}

export interface FormationPrice {
  /** total en dólares */
  total: number
  /** total en centavos (para Stripe unit_amount) */
  cents: number
  /** desglose itemizado (para line_items de Stripe / recibo) */
  lines: PriceLine[]
}

/**
 * Recalcula el total de una orden de formación a partir de sus datos guardados.
 * Replica exactamente updateTotal()/fmBuildPayload() del formulario.
 */
export function computeFormationTotal(input: FormationPricingInput): FormationPrice {
  const pkg: PackageId = (input.package as PackageId) in PACKAGE_PRICES
    ? (input.package as PackageId)
    : 'standard'
  const entity: EntityType = input.entityType === 'corp' ? 'corp' : 'llc'
  const speed: Speed = input.speed === 'expedited' ? 'expedited' : 'standard'
  const addons = (input.addons ?? {}) as Record<string, unknown>

  const lines: PriceLine[] = []

  // Paquete (omitir si $0 — ej. Basic — porque Stripe no acepta line items en 0)
  const base = PACKAGE_PRICES[pkg]
  if (base > 0) lines.push({ label: PACKAGE_LABELS[pkg], amount: base })

  // Cargo estatal de Florida (siempre > 0)
  lines.push({
    label: `Florida State Filing Fee (${entity.toUpperCase()})`,
    amount: STATE_FEE[entity],
  })

  // Procesamiento acelerado: gratis con Premium (igual que el form)
  if (speed === 'expedited' && pkg !== 'premium') {
    lines.push({ label: 'Expedited Processing', amount: EXPEDITED_FEE })
  }

  // Add-ons
  for (const key of Object.keys(ADDON_PRICES) as AddonKey[]) {
    if (addons[key]) lines.push({ label: ADDON_LABELS[key], amount: ADDON_PRICES[key] })
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  return { total, cents: total * 100, lines }
}
