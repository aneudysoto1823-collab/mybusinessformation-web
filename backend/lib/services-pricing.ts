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
  /** cadencia de cobro. Ausente = pago único. 'monthly'/'annual' = se autorrenueva
   *  hasta cancelar (HOY solo es etiqueta/aviso: el cobro sigue siendo único — la
   *  renovación se gestiona aparte / se cableará a Stripe subscriptions más adelante). */
  billing?: 'monthly' | 'annual'
  /** gratis el primer período SOLO si el carrito incluye AL MENOS otro servicio
   *  o combo (cualquiera, no solo formación). Comprado suelto se cobra `serviceFee`,
   *  por lo que nunca llega a Stripe en $0. Ej: Agente Registrado — gratis al
   *  combinar con cualquier otro servicio, $99/año comprado solo. */
  freeWithOther?: boolean
  /** precio de renovación a mostrar (display) para servicios recurrentes. */
  renewalFee?: number
}

export const SERVICES_CATALOG: Record<string, ServiceDef> = {
  // Formación de empresa nueva (à la carte). stateFee = tarifa de presentación
  // de Florida (LLC $125 / Corp $70), igual que lib/pricing.ts del home.
  'llc-formation':         { name_en: 'LLC Formation',                     name_es: 'Formación de LLC',                     serviceFee: 99,  stateFee: 125 },
  'corp-formation':        { name_en: 'Corporation Formation',             name_es: 'Formación de Corporation',             serviceFee: 99,  stateFee: 70 },
  'registered-agent':      { name_en: 'Registered Agent',                  name_es: 'Agente Registrado',                    serviceFee: 99,  stateFee: 0,   billing: 'annual', freeWithOther: true, renewalFee: 99 },
  'ein':                   { name_en: 'EIN / Tax ID Number',               name_es: 'EIN / Número de Identificación Fiscal', serviceFee: 99,  stateFee: 0 },
  'operating-agreement':   { name_en: 'Operating Agreement',               name_es: 'Acuerdo Operativo',                    serviceFee: 79,  stateFee: 0 },
  'itin':                  { name_en: 'ITIN Application',                   name_es: 'Solicitud de ITIN',                    serviceFee: 135, stateFee: 0 },
  'dba':                   { name_en: 'DBA / Fictitious Name',             name_es: 'DBA / Nombre Ficticio',                serviceFee: 49,  stateFee: 50 },
  'virtual-address':       { name_en: 'Virtual Mailing Address',           name_es: 'Dirección Postal Virtual',             serviceFee: 99,  stateFee: 0,   billing: 'monthly' },
  'annual-report':         { name_en: 'Annual Report Filing',              name_es: 'Declaración Anual',                    serviceFee: 99,  stateFee: 139, billing: 'annual' },
  'amendment':             { name_en: 'Articles of Amendment',             name_es: 'Artículos de Enmienda',                serviceFee: 59,  stateFee: 25 },
  'banking-resolution':    { name_en: 'Banking Resolution',                name_es: 'Resolución Bancaria',                  serviceFee: 49,  stateFee: 0 },
  'business-tax-receipt':  { name_en: 'Local Business Tax Receipt',        name_es: 'Licencia Comercial Local',             serviceFee: 99,  stateFee: 0 },
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
  'bundle-protect-full':   { name_en: 'Virtual Address + Annual Report + Local Business Tax Receipt', name_es: 'Dirección Virtual + Declaración Anual + Licencia Comercial Local', services: ['virtual-address', 'annual-report', 'business-tax-receipt'], price: 259 },
}

export interface PriceLine {
  label: string
  /** monto en dólares */
  amount: number
  /** cadencia de cobro de esta línea (se autorrenueva). Ausente = pago único. */
  billing?: 'monthly' | 'annual'
  /** primer período gratis (amount = 0 hoy; renovación = renewalFee/período). */
  firstYearFree?: boolean
  /** precio de renovación a mostrar cuando firstYearFree es true. */
  renewalFee?: number
}

// El display de cadencia (/mes, /año) y el aviso de autorrenovación viven en el
// cliente del checkout (coBillingSuffix / coAutoRenewNote en servicios/checkout).

export interface ServicesPrice {
  total: number
  cents: number
  lines: PriceLine[]
  /** true si algún servicio (individual o dentro de un combo) se autorrenueva. */
  recurring: boolean
}

/**
 * Recalcula el total de una orden de servicios à la carte a partir de la lista
 * de IDs + bundles elegidos. Ignora IDs desconocidos. Los servicios cubiertos por
 * un bundle se cobran al precio del bundle (no individualmente), pero sus tarifas
 * estatales sí se suman. Itemiza tarifa de servicio + tarifa estatal.
 */
// Procesamiento acelerado: una sola vez por orden, aplica a toda la orden.
// ⚠️ Precio placeholder — revisar antes de LIVE.
export const EXPEDITED_FEE = 79
export function computeServicesTotal(serviceIds: string[], bundleIds: string[] = [], expedited = false): ServicesPrice {
  // Tarifas de servicio primero; las tarifas estatales se agrupan al final
  // (antes del total), no intercaladas tras cada servicio.
  const lines: PriceLine[] = []
  const stateLines: PriceLine[] = []
  const bundled = new Set<string>()
  let recurring = false

  // 1) Bundles primero (precio combo + tarifas estatales de sus servicios)
  const seenBundle = new Set<string>()
  for (const bid of bundleIds) {
    if (seenBundle.has(bid)) continue
    seenBundle.add(bid)
    const b = SERVICE_BUNDLES[bid]
    if (!b) continue
    // Cadencia del combo: si todos sus servicios recurrentes comparten una sola
    // cadencia, se etiqueta así; si hay mezcla (ej. mensual + anual), va sin
    // sufijo y el aviso de autorrenovación explica el detalle.
    const cadences = new Set(b.services.map(s => SERVICES_CATALOG[s]?.billing).filter(Boolean))
    if (cadences.size > 0) recurring = true
    const bundleBilling = cadences.size === 1 ? [...cadences][0] as 'monthly' | 'annual' : undefined
    lines.push({ label: b.name_en, amount: b.price, billing: bundleBilling })
    for (const s of b.services) {
      bundled.add(s)
      const svc = SERVICES_CATALOG[s]
      if (svc && svc.stateFee > 0) {
        stateLines.push({ label: `${svc.name_en} — Florida State Fee`, amount: svc.stateFee })
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
    if (svc.billing) recurring = true
    // freeWithOther (ej. Agente Registrado): gratis el primer período si el carrito
    // incluye al menos otro servicio o combo; suelto se cobra normal.
    const hasOther = serviceIds.some(o => o !== id && !!SERVICES_CATALOG[o]) || bundleIds.length > 0
    const free = !!svc.freeWithOther && hasOther
    lines.push({ label: svc.name_en, amount: free ? 0 : svc.serviceFee, billing: svc.billing, firstYearFree: free, renewalFee: svc.renewalFee })
    if (svc.stateFee > 0) {
      stateLines.push({ label: `${svc.name_en} — Florida State Fee`, amount: svc.stateFee })
    }
  }

  if (expedited) lines.push({ label: 'Expedited Processing', amount: EXPEDITED_FEE })
  const allLines = lines.concat(stateLines)
  const total = allLines.reduce((sum, l) => sum + l.amount, 0)
  return { total, cents: Math.round(total * 100), lines: allLines, recurring }
}
