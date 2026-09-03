#!/usr/bin/env node
/**
 * check-prices.mjs — guardián de sincronización de precios (2026-09-03).
 *
 * Los precios de opabiz.com viven server-side en lib/pricing.ts + lib/services-pricing.ts
 * (fuentes de verdad para el cobro, anti-tampering). Pero también están duplicados
 * en la UI (page.tsx, servicios/page.tsx) y en el prompt del chat (api/chat/route.ts)
 * porque el HTML del form del home es un template literal enorme donde interpolar
 * constantes es engorroso.
 *
 * Este script parsea las constantes centrales y verifica que los precios hardcoded
 * en UI/prompt coincidan. Si detecta discrepancia, falla el build (exit 1) — se
 * ejecuta como `prebuild` en package.json, o sea corre automáticamente en cada
 * deploy de Vercel.
 *
 * Cubre: EIN, Operating Agreement (OA), ITIN, Expedited. No cubre otros addons
 * porque no son parte del scope acordado — extender el objeto EXPECTED_UI abajo
 * si se quiere agregar más.
 *
 * NO es un parser TypeScript real — usa regex sobre el source. Si algún día cambia
 * la estructura de ADDON_PRICES o SERVICES_CATALOG, actualizar los regex acá.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const FILES = {
  pricing: join(ROOT, 'lib/pricing.ts'),
  servicesPricing: join(ROOT, 'lib/services-pricing.ts'),
  home: join(ROOT, 'app/page.tsx'),
  servicios: join(ROOT, 'app/servicios/page.tsx'),
  chat: join(ROOT, 'app/api/chat/route.ts'),
}

function read(path) {
  try { return readFileSync(path, 'utf8') }
  catch (err) {
    console.error(`[check-prices] no se pudo leer ${path}: ${err.message}`)
    process.exit(2)
  }
}

// ── 1. Parsear las fuentes de verdad ─────────────────────────────────────────

const pricingSrc = read(FILES.pricing)
const servicesSrc = read(FILES.servicesPricing)

// ADDON_PRICES = { ein: 79, oa: 79, itin: 99, ... }
function pickAddon(name) {
  const re = new RegExp(`${name}:\\s*(\\d+)`)
  const block = pricingSrc.match(/ADDON_PRICES\s*=\s*\{[\s\S]*?\}\s*as const/)?.[0] ?? ''
  const m = block.match(re)
  if (!m) { console.error(`[check-prices] ADDON_PRICES.${name} no encontrado en pricing.ts`); process.exit(2) }
  return Number(m[1])
}

// RA_FIRST_YEAR_FEE = 99 en lib/pricing.ts (cobro condicional del RA en Basic).
function pickRaFee() {
  const m = pricingSrc.match(/export\s+const\s+RA_FIRST_YEAR_FEE\s*=\s*(\d+)/)
  if (!m) { console.error('[check-prices] RA_FIRST_YEAR_FEE no encontrado en pricing.ts'); process.exit(2) }
  return Number(m[1])
}

// EXPEDITED_FEE = 49 (buscar la constante exportada)
function pickExpedited(src, label) {
  const m = src.match(/export\s+const\s+EXPEDITED_FEE\s*=\s*(\d+)/)
  if (!m) { console.error(`[check-prices] EXPEDITED_FEE no encontrado en ${label}`); process.exit(2) }
  return Number(m[1])
}

// SERVICES_CATALOG entry: 'ein': { ... serviceFee: 79, ... }
function pickServiceFee(id) {
  const re = new RegExp(`'${id}':\\s*\\{[^}]*?serviceFee:\\s*(\\d+)`, 's')
  const m = servicesSrc.match(re)
  if (!m) { console.error(`[check-prices] SERVICES_CATALOG['${id}'].serviceFee no encontrado`); process.exit(2) }
  return Number(m[1])
}

const CENTRAL = {
  ein_addon: pickAddon('ein'),
  oa_addon: pickAddon('oa'),
  itin_addon: pickAddon('itin'),
  expedited_home: pickExpedited(pricingSrc, 'pricing.ts'),
  ein_service: pickServiceFee('ein'),
  oa_service: pickServiceFee('operating-agreement'),
  itin_service: pickServiceFee('itin'),
  expedited_services: pickExpedited(servicesSrc, 'services-pricing.ts'),
  ra_fee: pickRaFee(),
}

// Consistencia interna: los precios de opabiz deben coincidir entre pricing.ts
// (formación / home) y services-pricing.ts (à la carte). FBFC tiene su propio
// override vía FBFC_PRICE_OVERRIDES — ese NO se compara acá.
const errors = []
function assertMatch(label, a, b) {
  if (a !== b) errors.push(`${label}: pricing.ts=${a} vs services-pricing.ts=${b}`)
}
assertMatch('EIN (opabiz)', CENTRAL.ein_addon, CENTRAL.ein_service)
assertMatch('OA', CENTRAL.oa_addon, CENTRAL.oa_service)
assertMatch('ITIN', CENTRAL.itin_addon, CENTRAL.itin_service)
assertMatch('Expedited', CENTRAL.expedited_home, CENTRAL.expedited_services)

// ── 2. Verificar UI vs central ───────────────────────────────────────────────

const homeSrc = read(FILES.home)
const serviciosSrc = read(FILES.servicios)
const chatSrc = read(FILES.chat)

/**
 * Verifica que una serie de "esperados" aparezca al menos una vez en el source.
 * Si alguno no aparece, es señal de que quedó un precio viejo hardcoded.
 * NO chequea que NO haya precios viejos — no podemos distinguir un "$99" que es
 * de EIN vs un "$99" que es de otro servicio sin más contexto. El check apunta
 * a detectar cuándo un cambio de la constante NO se propagó a la UI.
 */
function assertContains(label, source, expected) {
  for (const e of expected) {
    if (!source.includes(e)) errors.push(`${label}: falta "${e}" en el archivo`)
  }
}

// Home (app/page.tsx)
assertContains('home OA rows', homeSrc, [
  // Rows de Basic + Standard: "+ $79" (OA)
  `+ $${CENTRAL.oa_addon}</span></div>`,
])
assertContains('home Expedited card', homeSrc, [
  `fms6-exp-price">+$${CENTRAL.expedited_home}</span>`,
])
assertContains('home EIN paso 7', homeSrc, [
  `addon-ein-price"><span class="fm-addon-was">$99</span>$${CENTRAL.ein_addon}</div>`,
])
assertContains('home OA paso 7', homeSrc, [
  `addon-oa-price"><span class="fm-addon-was">$99</span>$${CENTRAL.oa_addon}</div>`,
])
assertContains('home ITIN paso 7', homeSrc, [
  `addon-itin-price"><span class="fm-addon-was">$135</span>$${CENTRAL.itin_addon}</div>`,
])

// Registered Agent condicional (2026-09-03):
// - Basic mantiene "+ $99/year" en la tabla y cobra $99 real en el summary/payload
// - Standard/Premium cambian a "Included (1st year free)" en la tabla — se pagan
//   como "Incluido" (primer año gratis, renueva a $99/año) via fmRenderRaPricing
assertContains('home tabla RA Basic', homeSrc, [
  // Fila de Basic: mantiene la promesa de "+ $${RA_FEE}/year"
  `<span class="svc-status s-add" data-en="+ $${CENTRAL.ra_fee}/year" data-es="+ $${CENTRAL.ra_fee}/año">+ $${CENTRAL.ra_fee}/year</span>`,
])
assertContains('home tabla RA Std/Prem', homeSrc, [
  // Standard y Premium ya no prometen "+ $99/year" — pasan a "Included (1st year free)"
  `<span class="svc-status s-check" data-en="Included (1st year free)" data-es="Incluido (1er año gratis)">Included (1st year free)</span>`,
])
assertContains('home fmUpdateSummary RA', homeSrc, [
  // Suma condicional del RA en Basic con ra='us' (espeja RA_FIRST_YEAR_FEE server-side)
  `if(pkg === 'basic' && raIsUs) extras += ${CENTRAL.ra_fee};`,
])
assertContains('home fmBuildOrderPayload RA', homeSrc, [
  // Mismo cargo en el payload (aunque no se usa para cobrar, se guarda en Order.amount)
  `if(pkg === 'basic' && ra === 'us') extras += ${CENTRAL.ra_fee};`,
])
assertContains('home summary line RA', homeSrc, [
  // Fila HTML del summary lateral (show/hide dinamico segun paquete + eleccion)
  `class="fm-sum-line sum-ra-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-ra">Registered Agent (First Year)</span><span class="fm-sum-val">$${CENTRAL.ra_fee}</span>`,
])

// Catálogo /servicios (app/servicios/page.tsx)
assertContains('servicios JSON-LD', serviciosSrc, [
  `id: 'ein', name: 'EIN / Tax ID Number', description: 'IRS-issued business tax identification number, required to open a bank account, hire employees, and file taxes.', priceUsd: ${CENTRAL.ein_service}`,
  `id: 'operating-agreement', name: 'Operating Agreement', description: 'Internal LLC document defining ownership, management structure, and member responsibilities. Required by most banks.', priceUsd: ${CENTRAL.oa_service}`,
  `id: 'itin', name: 'ITIN Application', description: 'IRS Individual Taxpayer Identification Number for non-US founders without a Social Security Number.', priceUsd: ${CENTRAL.itin_service}`,
])
assertContains('servicios card EIN', serviciosSrc, [
  `id: 'ein', icon: 'hash', name: 'EIN / Tax ID Number', name_es: 'EIN / Número de Identificación Fiscal', price: '$${CENTRAL.ein_service}'`,
  `btn_en: 'Order EIN — $${CENTRAL.ein_service} &#8594;', btn_es: 'Ordenar EIN — $${CENTRAL.ein_service} &#8594;'`,
])
assertContains('servicios card OA', serviciosSrc, [
  `id: 'operating-agreement', icon: 'file-text', name: 'Operating Agreement', name_es: 'Acuerdo Operativo', price: '$${CENTRAL.oa_service}'`,
])
assertContains('servicios card ITIN', serviciosSrc, [
  `id: 'itin', icon: 'globe', name: 'ITIN Application', name_es: 'Solicitud de ITIN', price: '$${CENTRAL.itin_service}'`,
  `btn_en: 'Order ITIN Application — $${CENTRAL.itin_service} &#8594;', btn_es: 'Ordenar solicitud de ITIN — $${CENTRAL.itin_service} &#8594;'`,
])
assertContains('servicios modal EIN', serviciosSrc, [
  `title:'EIN / Tax ID Number — $${CENTRAL.ein_service}'`,
  `title_es:'Número EIN / ID Fiscal — $${CENTRAL.ein_service}'`,
  `Order EIN — $${CENTRAL.ein_service} &#8594;</button>`,
])
assertContains('servicios modal ITIN', serviciosSrc, [
  `title:'ITIN Application — $${CENTRAL.itin_service}'`,
  `title_es:'Solicitud de ITIN — $${CENTRAL.itin_service}'`,
  `Order ITIN Application — $${CENTRAL.itin_service} &#8594;</button>`,
])

// Chat prompt (app/api/chat/route.ts)
assertContains('chat prompt EIN', chatSrc, [
  `• EIN / Tax ID — $${CENTRAL.ein_service}. Required to open a business bank account.`,
  `EIN / Tax ID ($${CENTRAL.ein_service})`,
])
assertContains('chat prompt ITIN', chatSrc, [
  `• ITIN Application — $${CENTRAL.itin_service} standalone.`,
  `recommend ITIN Application ($${CENTRAL.itin_service})`,
  `ITIN ($${CENTRAL.itin_service})`,
])

// ── 3. Reportar ──────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error('\n[check-prices] ❌ Precios desincronizados:\n')
  for (const e of errors) console.error(`  • ${e}`)
  console.error(`\nPrecios centrales detectados: EIN=$${CENTRAL.ein_addon}, OA=$${CENTRAL.oa_addon}, ITIN=$${CENTRAL.itin_addon}, Expedited=$${CENTRAL.expedited_home}, RA=$${CENTRAL.ra_fee}`)
  console.error('Actualizar lib/pricing.ts + lib/services-pricing.ts + los archivos UI para que coincidan.')
  console.error('Si el patrón de UI cambió a propósito, actualizar los "assertContains" de este script.\n')
  process.exit(1)
}

console.log(`[check-prices] ✅ Precios sincronizados: EIN=$${CENTRAL.ein_addon}, OA=$${CENTRAL.oa_addon}, ITIN=$${CENTRAL.itin_addon}, Expedited=$${CENTRAL.expedited_home}, RA=$${CENTRAL.ra_fee}`)
