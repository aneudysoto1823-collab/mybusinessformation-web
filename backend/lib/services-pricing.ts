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
  /** una línea describiendo qué recibe el cliente — usada en el email de confirmación
   *  ("What's included"). Copy tomado/condensado de los bullets ya aprobados en
   *  /servicios (icEn/icEs en servicios/page.tsx), no texto nuevo. */
  desc_en: string
  desc_es: string
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
  'llc-formation':         { name_en: 'LLC Formation',                     name_es: 'Formación de LLC',                     desc_en: 'Articles of Organization filed with the State of Florida',            desc_es: 'Artículos de Organización presentados ante el Estado de Florida',                    serviceFee: 99,  stateFee: 125 },
  'corp-formation':        { name_en: 'Corporation Formation',             name_es: 'Formación de Corporation',             desc_en: 'Articles of Incorporation filed with the State of Florida',           desc_es: 'Artículos de Incorporación presentados ante el Estado de Florida',                    serviceFee: 99,  stateFee: 70 },
  'registered-agent':      { name_en: 'Registered Agent',                  name_es: 'Agente Registrado',                    desc_en: 'Official FL address to receive legal documents on your behalf',       desc_es: 'Dirección oficial en FL para recibir documentos legales en su nombre',                serviceFee: 99,  stateFee: 0,   billing: 'annual', freeWithOther: true, renewalFee: 99 },
  'ein':                   { name_en: 'EIN / Tax ID Number',               name_es: 'EIN / Número de Identificación Fiscal', desc_en: 'Federal Tax ID (EIN) application filed with the IRS',                desc_es: 'Solicitud del Número de Identificación Fiscal (EIN) ante el IRS',                     serviceFee: 99,  stateFee: 0 },
  'operating-agreement':   { name_en: 'Operating Agreement',               name_es: 'Acuerdo Operativo',                    desc_en: 'Custom, bank-ready LLC Operating Agreement',                          desc_es: 'Acuerdo Operativo personalizado, listo para el banco',                               serviceFee: 79,  stateFee: 0 },
  'itin':                  { name_en: 'ITIN Application',                   name_es: 'Solicitud de ITIN',                    desc_en: 'ITIN application (IRS Form W-7) filed on your behalf',                desc_es: 'Solicitud de ITIN (Formulario W-7 del IRS) presentada en su nombre',                  serviceFee: 135, stateFee: 0 },
  'dba':                   { name_en: 'DBA / Fictitious Name',             name_es: 'DBA / Nombre Ficticio',                desc_en: 'Fictitious Name registered with the FL Division of Corporations',     desc_es: 'Nombre Ficticio registrado ante la División de Corporaciones de FL',                  serviceFee: 49,  stateFee: 50 },
  'virtual-address':       { name_en: 'Virtual Mailing Address',           name_es: 'Dirección Postal Virtual',             desc_en: 'Professional FL mailing address with mail scanning & forwarding',     desc_es: 'Dirección postal profesional en FL con escaneo y reenvío de correo',                  serviceFee: 99,  stateFee: 0,   billing: 'monthly' },
  'annual-report':         { name_en: 'Annual Report Filing',              name_es: 'Declaración Anual',                    desc_en: 'Annual Report filed with Sunbiz to keep your entity active',          desc_es: 'Declaración Anual presentada ante Sunbiz para mantener su entidad activa',            serviceFee: 99,  stateFee: 139, billing: 'annual' },
  'amendment':             { name_en: 'Articles of Amendment',             name_es: 'Artículos de Enmienda',                desc_en: 'Articles of Amendment filed with the FL Division of Corporations',    desc_es: 'Artículos de Enmienda presentados ante la División de Corporaciones de FL',           serviceFee: 59,  stateFee: 25 },
  'banking-resolution':    { name_en: 'Banking Resolution',                name_es: 'Resolución Bancaria',                  desc_en: 'Authorizes opening a business bank account for your LLC/Corp',        desc_es: 'Autoriza la apertura de una cuenta bancaria para su LLC/Corp',                        serviceFee: 49,  stateFee: 0 },
  'business-tax-receipt':  { name_en: 'Local Business Tax Receipt',        name_es: 'Licencia Comercial Local',             desc_en: 'Local Business Tax Receipt application filed with your county',      desc_es: 'Solicitud de Licencia Comercial Local presentada ante su condado',                    serviceFee: 99,  stateFee: 0 },
  'sales-tax-registration':{ name_en: 'Sales Tax Registration',           name_es: 'Registro de Impuesto sobre Ventas',    desc_en: 'Sales tax certificate registered with the FL Dept. of Revenue',       desc_es: 'Certificado de impuesto sobre ventas registrado ante el FL Dept. of Revenue',         serviceFee: 99,  stateFee: 0 },
  'exclusive-guide':       { name_en: 'Exclusive Formation Guide',         name_es: 'Guía Exclusiva de Formación',          desc_en: 'Step-by-step post-formation checklist delivered by email',            desc_es: 'Lista de verificación post-formación entregada por correo',                           serviceFee: 49,  stateFee: 0 },
  'good-standing':         { name_en: 'Certificate of Good Standing',      name_es: 'Certificado de Buena Reputación',      desc_en: 'Certified Certificate of Good Standing from the State of Florida',    desc_es: 'Certificado de Buena Reputación certificado por el Estado de Florida',                serviceFee: 49,  stateFee: 9 },
  'scorp-election':        { name_en: 'S-Corp Election (Form 2553)',       name_es: 'Elección de S-Corp (Formulario 2553)', desc_en: 'S-Corp election filed with the IRS (Form 2553)',                      desc_es: 'Elección de S-Corp presentada ante el IRS (Formulario 2553)',                         serviceFee: 79,  stateFee: 0 },
  'foreign-llc':           { name_en: 'Foreign LLC / Corp Registration',   name_es: 'Registro de LLC / Corp Extranjera',    desc_en: 'Foreign qualification filed to operate in another state',             desc_es: 'Calificación extranjera presentada para operar en otro estado',                       serviceFee: 99,  stateFee: 0 },
  'business-license':      { name_en: 'Business License',                  name_es: 'Licencia de Negocios',                 desc_en: 'Business license application prepared for your industry & location',  desc_es: 'Solicitud de licencia de negocios preparada según su industria y ubicación',          serviceFee: 99,  stateFee: 0 },
  'dissolution':           { name_en: 'Business Dissolution',              name_es: 'Disolución del Negocio',               desc_en: 'Articles of Dissolution filed to formally close your entity',         desc_es: 'Artículos de Disolución presentados para cerrar formalmente su entidad',              serviceFee: 79,  stateFee: 25 },
  'cierre-fiscal':         { name_en: 'Tax Account Closure',               name_es: 'Cierre de Cuentas Fiscales',           desc_en: 'IRS & FL account closure letters prepared on your behalf',            desc_es: 'Cartas de cierre de cuentas ante el IRS y FL preparadas en su nombre',                serviceFee: 79,  stateFee: 0 },
  'certified-copy':        { name_en: 'Certified Copy of Articles',        name_es: 'Copia Certificada de Artículos',       desc_en: 'State-certified copy of your Articles from the FL Division of Corporations', desc_es: 'Copia certificada de sus Artículos por la División de Corporaciones de FL',    serviceFee: 59,  stateFee: 30 },
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
  // Hub 2 — Protección y cumplimiento. EN FORMACIÓN (LLC/Corp) estos 3 tiers se
  // usan tal cual, sin cambios. À LA CARTE (sin formación), Annual Report se
  // ofrece en su propio hub "Cumplimiento anual" junto al Agente Registrado
  // (decisión negocio 2026-07-02, ver bundle-compliance-*) — así este hub queda
  // solo con Virtual Address + Business Tax Receipt para no repetir el mismo
  // servicio en dos pasos (ver bundle-protect-va-btr más abajo).
  'bundle-protect-va':     { name_en: 'Virtual Mailing Address',              name_es: 'Dirección Virtual',                            services: ['virtual-address'], price: 99 },
  'bundle-protect-va-ar':  { name_en: 'Virtual Address + Annual Report',      name_es: 'Dirección Virtual + Declaración Anual',         services: ['virtual-address', 'annual-report'], price: 179 },
  'bundle-protect-full':   { name_en: 'Virtual Address + Annual Report + Local Business Tax Receipt', name_es: 'Dirección Virtual + Declaración Anual + Licencia Comercial Local', services: ['virtual-address', 'annual-report', 'business-tax-receipt'], price: 259 },
  'bundle-protect-va-btr': { name_en: 'Virtual Address + Local Business Tax Receipt', name_es: 'Dirección Virtual + Licencia Comercial Local', services: ['virtual-address', 'business-tax-receipt'], price: 179 },
  // Hub 3 — Cumplimiento anual (NUEVO, solo à la carte sin formación — en
  // formación el agente ya se decide en su propio paso obligatorio). Agrupa los
  // dos requisitos recurrentes de mayor valor (afiliación anual) para que no
  // queden diluidos dentro del hub de Protección. Mismo ~10% de descuento que
  // ya usan los demás combos de 2 servicios (bundle-protect-va-ar).
  'bundle-compliance-ra':    { name_en: 'Registered Agent',                    name_es: 'Agente Registrado',                           services: ['registered-agent'], price: 99 },
  'bundle-compliance-ra-ar': { name_en: 'Registered Agent + Annual Report',    name_es: 'Agente Registrado + Declaración Anual',       services: ['registered-agent', 'annual-report'], price: 179 },
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

// El acelerado solo tiene sentido si algo en el carrito realmente se presenta
// ante el estado (una formación, o un servicio con stateFee > 0, ej. Annual
// Report, DBA). Comprar solo un Operating Agreement (documento privado, sin
// presentación estatal) no tiene nada que "acelerar" — cobrar el fee ahí sería
// engañoso. Server-side es la fuente de verdad anti-tampering; el cliente
// (checkout/page.tsx) espeja esta misma regla para no ofrecer el paso.
export function isExpeditedApplicable(serviceIds: string[], bundleIds: string[] = []): boolean {
  if (serviceIds.includes('llc-formation') || serviceIds.includes('corp-formation')) return true
  const bundledServices = bundleIds.flatMap(bid => SERVICE_BUNDLES[bid]?.services ?? [])
  return [...serviceIds, ...bundledServices].some(id => (SERVICES_CATALOG[id]?.stateFee ?? 0) > 0)
}

export function computeServicesTotal(serviceIds: string[], bundleIds: string[] = [], expedited = false, lang: 'en' | 'es' = 'en'): ServicesPrice {
  const isEs = lang === 'es'
  const stateFeeLabel = (name: string) => isEs ? `${name} — Tarifa Estatal de Florida` : `${name} — Florida State Fee`
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
    lines.push({ label: isEs ? b.name_es : b.name_en, amount: b.price, billing: bundleBilling })
    for (const s of b.services) {
      bundled.add(s)
      const svc = SERVICES_CATALOG[s]
      if (svc && svc.stateFee > 0) {
        stateLines.push({ label: stateFeeLabel(isEs ? svc.name_es : svc.name_en), amount: svc.stateFee })
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
    lines.push({ label: isEs ? svc.name_es : svc.name_en, amount: free ? 0 : svc.serviceFee, billing: svc.billing, firstYearFree: free, renewalFee: svc.renewalFee })
    if (svc.stateFee > 0) {
      stateLines.push({ label: stateFeeLabel(isEs ? svc.name_es : svc.name_en), amount: svc.stateFee })
    }
  }

  if (expedited && isExpeditedApplicable(serviceIds, bundleIds)) lines.push({ label: isEs ? 'Procesamiento Acelerado' : 'Expedited Processing', amount: EXPEDITED_FEE })
  const allLines = lines.concat(stateLines)
  const total = allLines.reduce((sum, l) => sum + l.amount, 0)
  return { total, cents: Math.round(total * 100), lines: allLines, recurring }
}
