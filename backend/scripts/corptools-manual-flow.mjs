// Fase 1 — flujo manual completo contra la cuenta de TEST.
//
// Ejecuta secuencialmente:
//   1) POST /companies       — crea una company con el nombre dado
//   2) POST /services        — asigna RA service para Florida (genera factura)
//   3) GET  /invoices        — busca la factura recien generada, obtiene invoice_id
//
// Sin flag --confirm: DRY-RUN. Solo imprime los bodies exactos que mandaria,
// no hace ningun POST. Con --confirm: ejecuta los 3 pasos de verdad.
//
// Seguridad (guarda triple):
//   - CORPTOOLS_ENV DEBE ser 'test' (no permite ejecutar contra PROD desde
//     este script). Si es 'prod' o falta, hace throw.
//   - El --name DEBE empezar con "TEST " (case-insensitive). Regla explicita
//     del acuerdo con RAI para que su equipo filtre las pruebas.
//   - --confirm es obligatorio para POSTs. Sin el flag, dry-run.
//
// Uso:
//   node scripts/corptools-manual-flow.mjs --name="TEST Acme Holdings LLC" [--entity=llc|corp]
//   node scripts/corptools-manual-flow.mjs --name="TEST Acme Holdings LLC" --confirm

import dotenv from 'dotenv'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SignJWT } from 'jose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const BASE_URL = 'https://api.corporatetools.com'

// ────────────────────────────────────────────────────────────────────────────
// Parse args
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const nameArg = args.find(a => a.startsWith('--name='))?.slice(7)
const entityArg = args.find(a => a.startsWith('--entity='))?.slice(9) || 'llc'
const confirmFlag = args.includes('--confirm')

if (!nameArg) {
  console.error('ERROR: falta --name="TEST <nombre de la LLC>"')
  console.error('Uso:')
  console.error('  node scripts/corptools-manual-flow.mjs --name="TEST Acme Holdings LLC"')
  console.error('  node scripts/corptools-manual-flow.mjs --name="TEST Acme Holdings LLC" --confirm')
  process.exit(1)
}

if (!['llc', 'corp'].includes(entityArg)) {
  console.error(`ERROR: --entity debe ser 'llc' o 'corp'. Actual: "${entityArg}"`)
  process.exit(1)
}

// ────────────────────────────────────────────────────────────────────────────
// Guarda triple
// ────────────────────────────────────────────────────────────────────────────

const CORPTOOLS_ENV = (process.env.CORPTOOLS_ENV || '').toLowerCase()
if (CORPTOOLS_ENV !== 'test') {
  console.error(`ERROR: CORPTOOLS_ENV debe ser 'test' para correr este script. Actual: "${CORPTOOLS_ENV}"`)
  console.error('Este script NO se puede ejecutar contra PROD desde acá.')
  process.exit(1)
}

if (!/^TEST /i.test(nameArg)) {
  console.error(`ERROR: --name debe empezar con "TEST " (regla de RAI para filtrar pruebas). Actual: "${nameArg}"`)
  process.exit(1)
}

const ACCESS_KEY = process.env.CORPTOOLS_ACCESS_KEY_TEST
const SECRET_KEY = process.env.CORPTOOLS_SECRET_KEY_TEST
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('ERROR: faltan CORPTOOLS_ACCESS_KEY_TEST / CORPTOOLS_SECRET_KEY_TEST en .env.local')
  process.exit(1)
}

// ────────────────────────────────────────────────────────────────────────────
// Firma + wrapper HTTP (mismo patron que corptools-test-fase0.mjs)
// ────────────────────────────────────────────────────────────────────────────

const ALLOWED_METHODS = new Set(['GET', 'POST'])

async function signJwt(pathOnly, hashInput) {
  const content = crypto.createHash('sha256').update(hashInput).digest('hex')
  const secret = new TextEncoder().encode(SECRET_KEY)
  return await new SignJWT({ path: pathOnly, content })
    .setProtectedHeader({ alg: 'HS256', access_key: ACCESS_KEY })
    .sign(secret)
}

async function ctFetch(method, pathOnly, { query = null, body = null } = {}) {
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`[SAFETY] Method ${method} not allowed in this script.`)
  }
  const queryString = query ? new URLSearchParams(query).toString() : ''
  const bodyString = body !== null && body !== undefined ? JSON.stringify(body) : ''
  const fullUrl = queryString ? `${BASE_URL}${pathOnly}?${queryString}` : `${BASE_URL}${pathOnly}`
  const token = await signJwt(pathOnly, queryString + bodyString)
  const res = await fetch(fullUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(bodyString ? { body: bodyString } : {}),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data, url: fullUrl }
}

function bar(label) {
  console.log(`\n${'='.repeat(78)}\n  ${label}\n${'='.repeat(78)}`)
}

// ────────────────────────────────────────────────────────────────────────────
// Bodies
// ────────────────────────────────────────────────────────────────────────────

const ENTITY_LABEL = { llc: 'Limited Liability Company', corp: 'Corporation' }

const bodyPostCompanies = {
  companies: [
    {
      name: nameArg,
      entity_type: ENTITY_LABEL[entityArg],
      home_state: 'Florida',
    },
  ],
  duplicate_name_allowed: false,
}

// El body de POST /services no lo podemos armar aca (depende del company_id
// que devuelve el paso 1). Se arma en runtime en el paso 2.

// ────────────────────────────────────────────────────────────────────────────
// Ejecucion
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Corporate Tools API — flujo manual (Fase 1, cuenta TEST)')
  console.log(`Env:        ${CORPTOOLS_ENV.toUpperCase()}`)
  console.log(`Company:    "${nameArg}"`)
  console.log(`Entity:     ${entityArg} (${ENTITY_LABEL[entityArg]})`)
  console.log(`Home State: Florida`)
  console.log(`Mode:       ${confirmFlag ? 'CONFIRMED (real POSTs)' : 'DRY-RUN (no POSTs)'}`)

  bar('PASO 1 — POST /companies')
  console.log(`URL:    POST ${BASE_URL}/companies`)
  console.log('Body:', JSON.stringify(bodyPostCompanies, null, 2))

  if (!confirmFlag) {
    console.log('\n[DRY-RUN] No se envia el request. Repetir con --confirm para ejecutar.')
    return
  }

  const step1 = await ctFetch('POST', '/companies', { body: bodyPostCompanies })
  console.log(`Status: ${step1.status}`)
  console.log('Response:', JSON.stringify(step1.data, null, 2))
  if (!step1.ok || step1.data?.success === false) {
    console.error('\nPASO 1 FALLO. Aborto.')
    process.exit(1)
  }

  const result1 = step1.data?.result
  const list1 = Array.isArray(result1) ? result1 : (result1 && typeof result1 === 'object' ? [result1] : [])
  const companyId = list1[0]?.id || list1[0]?.company_id
  if (!companyId) {
    console.error('\nPASO 1: no se pudo extraer company_id del response. Aborto.')
    process.exit(1)
  }
  console.log(`\n✓ company_id: ${companyId}`)

  bar('PASO 2 — POST /services')
  const bodyPostServices = {
    company_id: companyId,
    jurisdictions: ['Florida'],
  }
  console.log(`URL:    POST ${BASE_URL}/services`)
  console.log('Body:', JSON.stringify(bodyPostServices, null, 2))
  const step2 = await ctFetch('POST', '/services', { body: bodyPostServices })
  console.log(`Status: ${step2.status}`)
  console.log('Response:', JSON.stringify(step2.data, null, 2))
  if (!step2.ok || step2.data?.success === false) {
    console.error('\nPASO 2 FALLO. company_id creado pero servicio NO asignado.')
    console.error(`Anotar el company_id ${companyId} y reportar.`)
    process.exit(1)
  }

  const result2 = step2.data?.result
  const list2 = Array.isArray(result2) ? result2 : (result2 && typeof result2 === 'object' ? [result2] : [])
  const serviceId = list2[0]?.id || list2[0]?.service_id
  if (!serviceId) {
    console.error('\nPASO 2: no se pudo extraer service_id del response.')
    console.error(`Anotar el company_id ${companyId} y reportar.`)
    process.exit(1)
  }
  console.log(`\n✓ service_id: ${serviceId}`)

  bar('PASO 3 — GET /invoices?company_id=' + companyId)
  const step3 = await ctFetch('GET', '/invoices', { query: { company_id: companyId } })
  console.log(`URL:    ${step3.url}`)
  console.log(`Status: ${step3.status}`)
  console.log('Response:', JSON.stringify(step3.data, null, 2))

  const invoices = Array.isArray(step3.data?.result) ? step3.data.result : []
  const invoice = invoices[0]
  const invoiceId = invoice?.id || invoice?.invoice_id

  bar('RESUMEN')
  console.log(`Company:    "${nameArg}"`)
  console.log(`company_id: ${companyId}`)
  console.log(`service_id: ${serviceId}`)
  console.log(`invoice_id: ${invoiceId || '(NO se pudo extraer — revisar Response del PASO 3)'}`)
  console.log(`invoices totales para esta company: ${invoices.length}`)
  console.log()
  console.log('SIGUIENTE PASO MANUAL:')
  console.log('  1) Entrar al portal RAI de la cuenta TEST')
  console.log(`  2) Buscar la factura por invoice_id: ${invoiceId || '(ver arriba)'}`)
  console.log('  3) Pagarla con tarjeta real (monto pequeño de test)')
  console.log('  4) Avisar cuando este pagada, para consultar GET /services/:id/info y confirmar')
  console.log('     que llega la direccion asignada por RAI.')
  console.log()
}

main().catch(err => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
