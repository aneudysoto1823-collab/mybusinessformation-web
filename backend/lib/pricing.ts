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

import { FORMATION_ADDON_NAMES } from './order-items'

export type EntityType = 'llc' | 'corp'
export type Speed = 'standard' | 'expedited'
export type PackageId = 'basic' | 'standard' | 'premium'

// Basic pasó de $0 a $39 (2026-08-25, decisión founder) — dejó de ser el tier
// gratis de entrada. Antes tenía un mecanismo especial (BASIC_PACKAGE_LIST_PRICE
// + cupón de Stripe STRIPE_BASIC_COUPON_ID + withBasicDisplayLine) para mostrar
// "$99 → -$99 = gratis"; con un precio real > 0 ya no hace falta ninguno de
// esos trucos — Basic ahora se comporta exactamente igual que Standard/Premium
// (line item normal a su precio de lista, sin cupón).
export const PACKAGE_PRICES: Record<PackageId, number> = { basic: 39, standard: 199, premium: 299 }

// Add-ons cobrables (igual que fmBuildPayload en page.tsx). `raInfo` no se
// cobra acá (es solo la dirección cuando el cliente es su propio agente).
export const ADDON_PRICES = {
  ein: 79, oa: 79, itin: 99, btr: 79, str: 79, cc: 49,
  // Nuevos 2026-06-26 (seccion expandible "Ver todos los servicios" del paso 5)
  dba: 49, br: 49, gd: 49, gs: 49, sc: 79, bl: 99,
  // Annual Report — antes no se cobraba en el checkout (comentario viejo
  // decía "ar NO se cobra aquí"); founder decidió 2026-08-04 empezar a
  // cobrarlo como los demás addons.
  ar: 99,
} as const
export type AddonKey = keyof typeof ADDON_PRICES

export const EXPEDITED_FEE = 49
export const STATE_FEE: Record<EntityType, number> = { llc: 125, corp: 70 }

// Registered Agent — cobro condicional por paquete (2026-09-03).
// Basic: cobra $99 el primer año si el cliente elige nuestro servicio (ra='us').
// Standard/Premium: el primer año va incluido gratis, la renovación (a $99/año)
// se cobra fuera del checkout de formación. Basic no incluye ese año gratis para
// diferenciarse de los tiers superiores. Si el cliente elige ser su propio agente
// (ra='own') no se cobra en ningún paquete — solo se guarda la dirección.
export const RA_FIRST_YEAR_FEE = 99

// DBA / Fictitious Name es el único addon que implica un filing estatal
// propio ante la Florida Division of Corporations, aparte de ADDON_PRICES.dba
// (que es solo el fee de servicio). Antes no se cobraba — corregido 2026-08-04.
export const DBA_STATE_FEE = 50

// Etiquetas EN — derivadas de FORMATION_ADDON_NAMES (lib/order-items.ts), única
// fuente de verdad bilingüe. Antes se duplicaban acá y quedaron desincronizadas
// (ver auditoría 2026-07-12, hallazgo #1).
const ADDON_LABELS: Record<AddonKey, string> = Object.fromEntries(
  (Object.keys(ADDON_PRICES) as AddonKey[]).map(key => [key, FORMATION_ADDON_NAMES[key].en])
) as Record<AddonKey, string>

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
  /** 'us' = OpaBiz es el agente registrado; 'own' = cliente es su propio agente.
   *  Solo cobra el fee en el tier Basic con 'us' — ver RA_FIRST_YEAR_FEE arriba. */
  registeredAgent?: string | null
  /** Idioma para el label del line item — 'es' devuelve etiqueta en español,
   *  cualquier otro valor (o ausente) usa inglés. Solo afecta el texto que ve
   *  el cliente en Stripe/emails/complete; no cambia el monto. */
  lang?: string | null
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
  // Antes un `package` no reconocido caía en silencio a 'standard' — enmascaraba
  // bugs de datos (orden corrupta/legacy) cobrando o mostrando un precio
  // inventado en vez de fallar visible (auditoría 2026-07-12, hallazgo #2).
  if (!(input.package as string in PACKAGE_PRICES)) {
    throw new Error(`computeFormationTotal: package no reconocido: ${JSON.stringify(input.package)}`)
  }
  const pkg = input.package as PackageId
  const entity: EntityType = input.entityType === 'corp' ? 'corp' : 'llc'
  const speed: Speed = input.speed === 'expedited' ? 'expedited' : 'standard'
  const addons = (input.addons ?? {}) as Record<string, unknown>

  const lines: PriceLine[] = []

  // Paquete (omitir si algún día un tier vuelve a valer $0 — Stripe no acepta line items en 0)
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

  // Registered Agent — solo en Basic con 'us'. En Standard/Premium el primer
  // año va incluido gratis y la renovación se cobra fuera del checkout de
  // formación (ver comentario de RA_FIRST_YEAR_FEE arriba).
  const isEs = input.lang === 'es'
  if (pkg === 'basic' && input.registeredAgent === 'us') {
    lines.push({
      label: isEs ? 'Agente Registrado — Primer Año' : 'Registered Agent — First Year',
      amount: RA_FIRST_YEAR_FEE,
    })
  }

  // Add-ons
  for (const key of Object.keys(ADDON_PRICES) as AddonKey[]) {
    if (addons[key]) lines.push({ label: ADDON_LABELS[key], amount: ADDON_PRICES[key] })
  }
  if (addons.dba) lines.push({ label: 'DBA / Fictitious Name — Florida State Fee', amount: DBA_STATE_FEE })

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  return { total, cents: total * 100, lines }
}
