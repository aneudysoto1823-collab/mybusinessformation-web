// ─────────────────────────────────────────────────────────────────────────────
// Precios autoritativos del lado servidor para órdenes à la carte de /servicios.
//
// Igual que lib/pricing.ts (formación), ESTA es la fuente de verdad del cobro:
// el total se recalcula aquí desde los IDs de servicio guardados, nunca se
// confía en el monto del navegador (anti-tampering).
//
// ⚠️ PRECIOS PLACEHOLDER (Fase 1): los 3 servicios sin precio fijo (registered
// -agent, virtual-address, annual-report) están en $99 temporalmente — ajustar
// al precio real antes de LIVE. Las tarifas estatales (stateFee) son montos
// aproximados tomados de los summary boxes de los formularios; confirmarlas
// antes de LIVE. Si cambia un precio en /servicios (page.tsx), actualizar aquí.
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceDef {
  name_en: string
  name_es: string
  /** tarifa de servicio (lo que cobramos nosotros), en dólares */
  serviceFee: number
  /** tarifa estatal aprox. en dólares (0 = no aplica / se paga aparte) */
  stateFee: number
}

export const SERVICES_CATALOG: Record<string, ServiceDef> = {
  // Formación de empresa nueva (à la carte). stateFee = tarifa de presentación
  // de Florida (LLC $125 / Corp $70), igual que lib/pricing.ts del home.
  'llc-formation':         { name_en: 'LLC Formation',                     name_es: 'Formación de LLC',                     serviceFee: 99,  stateFee: 125 },
  'corp-formation':        { name_en: 'Corporation Formation',             name_es: 'Formación de Corporation',             serviceFee: 99,  stateFee: 70 },
  'registered-agent':      { name_en: 'Registered Agent (Florida)',        name_es: 'Agente Registrado (Florida)',          serviceFee: 99,  stateFee: 0 },
  'ein':                   { name_en: 'EIN / Tax ID Number',               name_es: 'EIN / Número de Identificación Fiscal', serviceFee: 99,  stateFee: 0 },
  'operating-agreement':   { name_en: 'Operating Agreement',               name_es: 'Acuerdo Operativo',                    serviceFee: 79,  stateFee: 0 },
  'itin':                  { name_en: 'ITIN Application',                   name_es: 'Solicitud de ITIN',                    serviceFee: 135, stateFee: 0 },
  'dba':                   { name_en: 'DBA / Fictitious Name',             name_es: 'DBA / Nombre Ficticio',                serviceFee: 49,  stateFee: 50 },
  'virtual-address':       { name_en: 'Virtual Mailing Address',           name_es: 'Dirección Postal Virtual',             serviceFee: 99,  stateFee: 0 },
  'annual-report':         { name_en: 'Annual Report Filing',              name_es: 'Declaración Anual',                    serviceFee: 99,  stateFee: 139 },
  'amendment':             { name_en: 'Articles of Amendment',             name_es: 'Artículos de Enmienda',                serviceFee: 59,  stateFee: 25 },
  'banking-resolution':    { name_en: 'Banking Resolution',                name_es: 'Resolución Bancaria',                  serviceFee: 49,  stateFee: 0 },
  'business-tax-receipt':  { name_en: 'Business Tax Receipt',              name_es: 'Recibo de Impuesto Empresarial',       serviceFee: 99,  stateFee: 0 },
  'sales-tax-registration':{ name_en: 'Sales Tax Registration',           name_es: 'Registro de Impuesto sobre Ventas',    serviceFee: 99,  stateFee: 0 },
  'exclusive-guide':       { name_en: 'Exclusive Formation Guide',         name_es: 'Guía Exclusiva de Formación',          serviceFee: 49,  stateFee: 0 },
  'good-standing':         { name_en: 'Certificate of Good Standing',      name_es: 'Certificado de Buena Reputación',      serviceFee: 49,  stateFee: 9 },
  'scorp-election':        { name_en: 'S-Corp Election (Form 2553)',       name_es: 'Elección de S-Corp (Formulario 2553)', serviceFee: 79,  stateFee: 0 },
  'foreign-llc':           { name_en: 'Foreign LLC / Corp Registration',   name_es: 'Registro de LLC / Corp Extranjera',    serviceFee: 99,  stateFee: 0 },
  'business-license':      { name_en: 'Business License',                  name_es: 'Licencia de Negocios',                 serviceFee: 99,  stateFee: 0 },
  'dissolution':           { name_en: 'Business Dissolution',              name_es: 'Disolución del Negocio',               serviceFee: 79,  stateFee: 25 },
  'cierre-fiscal':         { name_en: 'Tax Account Closure',               name_es: 'Cierre de Cuentas Fiscales',           serviceFee: 79,  stateFee: 0 },
  'certified-copy':        { name_en: 'Certified Copy of Articles',        name_es: 'Copia Certificada de Artículos',       serviceFee: 59,  stateFee: 30 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Bundles (combos estilo LegalZoom) — se ofrecen en los "hubs" de 3 tiers del
// checkout. Cada bundle agrupa servicios a un precio con descuento. Si se elige
// un bundle, sus servicios NO se cobran individualmente (se cobra el precio del
// bundle + las tarifas estatales de esos servicios). PRECIOS CONFIRMADOS 2026-06-26.
// ─────────────────────────────────────────────────────────────────────────────
export interface BundleDef {
  name_en: string
  name_es: string
  /** servicios incluidos en el combo */
  services: string[]
  /** precio del combo en dólares (reemplaza la suma de serviceFee individuales) */
  price: number
}

export const SERVICE_BUNDLES: Record<string, BundleDef> = {
  // Hub 1 — Documentos esenciales (después de Dueños)
  'bundle-docs-oa':     { name_en: 'Operating Agreement',                      name_es: 'Acuerdo Operativo',                            services: ['operating-agreement'], price: 79 },
  'bundle-docs-oa-ein': { name_en: 'Operating Agreement + EIN',                name_es: 'Acuerdo Operativo + EIN',                      services: ['operating-agreement', 'ein'], price: 149 },
  'bundle-docs-full':   { name_en: 'Operating Agreement + EIN + Banking Resolution', name_es: 'Acuerdo Operativo + EIN + Resolución Bancaria', services: ['operating-agreement', 'ein', 'banking-resolution'], price: 189 },
  // Hub 2 — Protección y cumplimiento (antes de pagar)
  'bundle-protect-va':     { name_en: 'Virtual Mailing Address',              name_es: 'Dirección Virtual',                            services: ['virtual-address'], price: 99 },
  'bundle-protect-va-ar':  { name_en: 'Virtual Address + Annual Report',      name_es: 'Dirección Virtual + Declaración Anual',         services: ['virtual-address', 'annual-report'], price: 179 },
  'bundle-protect-full':   { name_en: 'Virtual Address + Annual Report + Business Tax Receipt', name_es: 'Dirección Virtual + Declaración Anual + Recibo de Impuesto', services: ['virtual-address', 'annual-report', 'business-tax-receipt'], price: 259 },
}

export interface PriceLine {
  label: string
  /** monto en dólares */
  amount: number
}

export interface ServicesPrice {
  total: number
  cents: number
  lines: PriceLine[]
}

/**
 * Recalcula el total de una orden de servicios à la carte a partir de la lista
 * de IDs + bundles elegidos. Ignora IDs desconocidos. Los servicios cubiertos por
 * un bundle se cobran al precio del bundle (no individualmente), pero sus tarifas
 * estatales sí se suman. Itemiza tarifa de servicio + tarifa estatal.
 */
export function computeServicesTotal(serviceIds: string[], bundleIds: string[] = []): ServicesPrice {
  const lines: PriceLine[] = []
  const bundled = new Set<string>()

  // 1) Bundles primero (precio combo + tarifas estatales de sus servicios)
  const seenBundle = new Set<string>()
  for (const bid of bundleIds) {
    if (seenBundle.has(bid)) continue
    seenBundle.add(bid)
    const b = SERVICE_BUNDLES[bid]
    if (!b) continue
    lines.push({ label: b.name_en, amount: b.price })
    for (const s of b.services) {
      bundled.add(s)
      const svc = SERVICES_CATALOG[s]
      if (svc && svc.stateFee > 0) {
        lines.push({ label: `${svc.name_en} — Florida State Fee`, amount: svc.stateFee })
      }
    }
  }

  // 2) Servicios individuales no cubiertos por un bundle
  const seen = new Set<string>()
  for (const id of serviceIds) {
    if (seen.has(id) || bundled.has(id)) continue
    seen.add(id)
    const svc = SERVICES_CATALOG[id]
    if (!svc) continue
    lines.push({ label: svc.name_en, amount: svc.serviceFee })
    if (svc.stateFee > 0) {
      lines.push({ label: `${svc.name_en} — Florida State Fee`, amount: svc.stateFee })
    }
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  return { total, cents: Math.round(total * 100), lines }
}
