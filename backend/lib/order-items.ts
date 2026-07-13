// ─────────────────────────────────────────────────────────────────────────────
// Resuelve las claves de `Order.addons` a etiquetas humanas, sin importar el
// shape que tenga (que difiere según `Order.package`):
//
//   - formación (basic/standard/premium): addons = {ein:true, oa:true, ...}
//     (mapa de booleanos, ver lib/pricing.ts ADDON_PRICES)
//   - à la carte (package:'services', de /servicios/checkout): addons =
//     {services: string[], bundles: string[], intake: {...}, lines: [...], lang}
//     (ver lib/services-pricing.ts SERVICES_CATALOG / SERVICE_BUNDLES)
//   - marketing (package:'addon', de /new-business vía /api/sunbiz/checkout):
//     addons = string[] plano (ej. ['ein','labor_law_poster'] o ['bundle'])
//
// Antes cada lugar que mostraba "qué compró el cliente" (checklist admin,
// email de aprobación, portal del cliente) asumía el shape de formación y
// hacía Object.keys(addons) sin más — para órdenes de servicios eso devolvía
// las claves de categoría ("services","bundles","intake","lines") como si
// fueran ítems comprados, y para órdenes de marketing (addons es un array)
// devolvía índices ("0","1"). Este módulo es la única fuente de verdad para
// no repetir ese bug en cada lugar nuevo.
// ─────────────────────────────────────────────────────────────────────────────

import { SERVICES_CATALOG, SERVICE_BUNDLES } from './services-pricing'

export type Lang = 'en' | 'es'

export const FORMATION_ADDON_NAMES: Record<string, { en: string; es: string }> = {
  ein:  { en: 'EIN / Tax ID Number', es: 'EIN / Número de Identificación Fiscal' },
  oa:   { en: 'Operating Agreement', es: 'Acuerdo Operativo' },
  itin: { en: 'ITIN Application', es: 'Solicitud de ITIN' },
  btr:  { en: 'Local Business Tax Receipt', es: 'Licencia Comercial Local' },
  str:  { en: 'Sales Tax Registration', es: 'Registro de Impuesto sobre Ventas' },
  cc:   { en: 'Certified Copy', es: 'Copia Certificada' },
  dba:  { en: 'DBA / Fictitious Name', es: 'DBA / Nombre Ficticio' },
  br:   { en: 'Banking Resolution', es: 'Resolución Bancaria' },
  gd:   { en: 'Exclusive Formation Guide', es: 'Guía Exclusiva de Formación' },
  gs:   { en: 'Certificate of Good Standing', es: 'Certificado de Buena Reputación' },
  sc:   { en: 'S-Corp Election (Form 2553)', es: 'Elección de S-Corp (Formulario 2553)' },
  bl:   { en: 'Business License Research & Filing', es: 'Investigación y Presentación de Licencias de Negocio' },
}

// Servicios ofrecidos en el flujo de marketing /new-business (ver
// app/api/sunbiz/checkout/route.ts SERVICES).
export const MARKETING_ADDON_NAMES: Record<string, { en: string; es: string }> = {
  ein:                   { en: 'EIN / Tax ID Number', es: 'EIN / Número de Identificación Fiscal' },
  labor_law_poster:      { en: 'Labor Law Poster (2026)', es: 'Póster de Ley Laboral (2026)' },
  certificate_of_status: { en: 'Certificate of Status (FL)', es: 'Certificado de Buena Reputación (FL)' },
  bundle:                { en: 'Business Essentials Bundle (EIN + Labor Poster + Certificate)', es: 'Paquete Esencial (EIN + Póster + Certificado)' },
}

export function formationItemLabel(entityType: string | undefined, lang: Lang): string {
  const isCorp = (entityType ?? 'llc').toLowerCase() === 'corp'
  if (lang === 'es') return isCorp ? 'Formación de Corporation (Artículos de Incorporación)' : 'Formación de LLC (Artículos de Organización)'
  return isCorp ? 'Corporation Formation (Articles of Incorporation)' : 'LLC Formation (Articles of Organization)'
}

/**
 * Claves normalizadas de los ítems comprados en una orden. El prefijo indica
 * de dónde sale la etiqueta ('svc:', 'bundle:', 'mkt:') o es una clave plana
 * ('formation' o una clave de FORMATION_ADDON_NAMES) para órdenes de formación.
 * Nunca devuelve categorías crudas de addons ('services','bundles','intake','lines')
 * ni índices de array.
 */
export function getOrderItemKeys(pkg: string | null | undefined, addons: unknown): string[] {
  const pkgKey = (pkg ?? '').toLowerCase().trim()

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
    // Servicios ya cubiertos por un bundle no se listan también sueltos.
    const bundledServices = new Set(bundleIds.flatMap(b => SERVICE_BUNDLES[b].services))
    return [
      ...bundleIds.map(b => `bundle:${b}`),
      ...serviceIds.filter(s => !bundledServices.has(s)).map(s => `svc:${s}`),
    ]
  }

  if (pkgKey === 'addon') {
    const ids = Array.isArray(addons) ? addons.filter((s): s is string => typeof s === 'string') : []
    return ids.map(id => `mkt:${id}`)
  }

  // Formación (basic/standard/premium): shape legacy de booleanos.
  const a = (addons && typeof addons === 'object' && !Array.isArray(addons))
    ? addons as Record<string, boolean>
    : {}
  return ['formation', ...Object.keys(a).filter(k => a[k] === true && FORMATION_ADDON_NAMES[k])]
}

export function getOrderItemLabel(key: string, opts: { entityType?: string; lang?: Lang } = {}): string {
  const lang = opts.lang ?? 'en'
  if (key === 'formation') return formationItemLabel(opts.entityType, lang)
  if (key.startsWith('svc:')) {
    const s = SERVICES_CATALOG[key.slice(4)]
    return s ? (lang === 'es' ? s.name_es : s.name_en) : key
  }
  if (key.startsWith('bundle:')) {
    const b = SERVICE_BUNDLES[key.slice(7)]
    return b ? (lang === 'es' ? b.name_es : b.name_en) : key
  }
  if (key.startsWith('mkt:')) {
    const id = key.slice(4)
    return MARKETING_ADDON_NAMES[id]?.[lang] ?? id
  }
  return FORMATION_ADDON_NAMES[key]?.[lang] ?? key
}
