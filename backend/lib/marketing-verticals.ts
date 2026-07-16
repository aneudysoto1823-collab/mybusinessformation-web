// Lista canonica de verticales para clasificar LLCs nuevas (doc 31, Bloque 2).
// El orden importa: es la prioridad de campana (los primeros venden mas).
// Las que Haiku no puede clasificar quedan como 'unknown' con prioridad 999
// para que caigan al final de cualquier ordenamiento.

export type VerticalKey =
  | 'real_estate'
  | 'construction'
  | 'trucking'
  | 'restaurant'
  | 'ecommerce'
  | 'professional_services'
  | 'cleaning'
  | 'beauty'
  | 'healthcare'
  | 'tech'
  | 'import_export'
  | 'other'
  | 'unknown'

export interface Vertical {
  key: VerticalKey
  label: string
  priority: number
  examples: string
}

export const VERTICALS: Vertical[] = [
  { key: 'real_estate',           priority: 1,  label: 'Real Estate',           examples: 'holdings, property management, house flipping, investments, realty' },
  { key: 'construction',          priority: 2,  label: 'Construction',          examples: 'contractors, builders, remodeling, roofing, electrical, plumbing, HVAC' },
  { key: 'trucking',              priority: 3,  label: 'Trucking',              examples: 'transportation, logistics, freight, hauling, moving, delivery' },
  { key: 'restaurant',            priority: 4,  label: 'Restaurantes',         examples: 'restaurants, food service, catering, cafe, bakery, food truck' },
  { key: 'ecommerce',             priority: 5,  label: 'E-commerce / Retail',   examples: 'online store, retail, amazon FBA, dropshipping, merchandise' },
  { key: 'professional_services', priority: 6,  label: 'Servicios profesionales', examples: 'consulting, marketing, coaching, advisory, agency' },
  { key: 'cleaning',              priority: 7,  label: 'Cleaning',              examples: 'cleaning services, janitorial, property maintenance, landscaping' },
  { key: 'beauty',                priority: 8,  label: 'Beauty / Spa',          examples: 'salons, spa, nails, hair, aesthetics, barbershop' },
  { key: 'healthcare',            priority: 9,  label: 'Healthcare',            examples: 'dental, medical, nursing, home care, therapy, chiropractic' },
  { key: 'tech',                  priority: 10, label: 'Tech / Software',       examples: 'software, IT, tech, digital, apps, SaaS' },
  { key: 'import_export',         priority: 11, label: 'Import / Export',       examples: 'trading, wholesale, import, export, international' },
  { key: 'other',                 priority: 12, label: 'Otros',                 examples: 'cualquier otra actividad no listada arriba' },
  { key: 'unknown',               priority: 999, label: 'No definido',          examples: 'el nombre no da senales para inferir un vertical' },
]

export const VERTICAL_KEYS = VERTICALS.map(v => v.key)
export const VERTICAL_PRIORITY: Record<VerticalKey, number> = Object.fromEntries(
  VERTICALS.map(v => [v.key, v.priority])
) as Record<VerticalKey, number>

export function isValidVertical(k: unknown): k is VerticalKey {
  return typeof k === 'string' && (VERTICAL_KEYS as string[]).includes(k)
}
