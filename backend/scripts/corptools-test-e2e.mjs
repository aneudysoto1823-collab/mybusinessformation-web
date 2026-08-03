// E2E test de la cadena provisionRaForOrder contra la cuenta TEST.
//
// Duplica la logica de lib/ra-provisioning.ts en formato .mjs (mismo criterio
// que corptools-manual-flow.mjs — ese archivo ya duplica el cliente JWT). El
// script se conecta directo a Supabase con service_role_key, crea una Order
// de test marcada claramente como TEST, y corre el flujo dos veces para
// verificar idempotencia.
//
// Uso:
//   node scripts/corptools-test-e2e.mjs                    (crea Order de test)
//   node scripts/corptools-test-e2e.mjs --order=<uuid>     (usa una existente)
//   node scripts/corptools-test-e2e.mjs --cleanup=<uuid>   (borra Order de test)
//
// Guardias:
//   - CORPTOOLS_ENV=test obligatorio (throw si prod)
//   - Solo opera sobre Orders cuyo companyName empiece con "TEST"
//     (asi no puede afectar ordenes reales por accidente)

import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SignJWT } from 'jose'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ────────────────────────────────────────────────────────────────────────────
// Parse args + guardias
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const orderArg = args.find(a => a.startsWith('--order='))?.slice(8)
const cleanupArg = args.find(a => a.startsWith('--cleanup='))?.slice(10)

if (cleanupArg && orderArg) {
  console.error('ERROR: no combinar --cleanup con --order')
  process.exit(1)
}

const CT_ENV = (process.env.CORPTOOLS_ENV || '').toLowerCase()
if (CT_ENV !== 'test') {
  console.error(`ERROR: CORPTOOLS_ENV debe ser 'test'. Actual: "${CT_ENV}"`)
  process.exit(1)
}

const ACCESS_KEY = process.env.CORPTOOLS_ACCESS_KEY_TEST
const SECRET_KEY = process.env.CORPTOOLS_SECRET_KEY_TEST
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('ERROR: faltan CORPTOOLS_*_TEST en .env.local')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SR = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SR) {
  console.error('ERROR: faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(SUPABASE_URL, SUPABASE_SR, { auth: { persistSession: false } })

const BASE_URL = 'https://api.corporatetools.com'
const SCRATCHPAD = process.env.CLAUDE_SCRATCHPAD || path.join(os.tmpdir(), 'corptools-e2e')
if (!fs.existsSync(SCRATCHPAD)) fs.mkdirSync(SCRATCHPAD, { recursive: true })

// ────────────────────────────────────────────────────────────────────────────
// Cliente RAI (mismo patron que corptools-manual-flow.mjs)
// ────────────────────────────────────────────────────────────────────────────

async function signJwt(pathOnly, hashInput) {
  const content = crypto.createHash('sha256').update(hashInput).digest('hex')
  const secret = new TextEncoder().encode(SECRET_KEY)
  return await new SignJWT({ path: pathOnly, content })
    .setProtectedHeader({ alg: 'HS256', access_key: ACCESS_KEY })
    .sign(secret)
}

async function ctFetch(method, pathOnly, { query = null, body = null } = {}) {
  const queryString = query ? new URLSearchParams(query).toString() : ''
  const bodyString = body !== null && body !== undefined ? JSON.stringify(body) : ''
  const fullUrl = queryString ? `${BASE_URL}${pathOnly}?${queryString}` : `${BASE_URL}${pathOnly}`
  const token = await signJwt(pathOnly, queryString + bodyString)
  const res = await fetch(fullUrl, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(bodyString ? { body: bodyString } : {}),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data }
}

// ────────────────────────────────────────────────────────────────────────────
// Cadena provisionRaForOrder (duplicada en .mjs)
// ────────────────────────────────────────────────────────────────────────────

function extractAddressFromServiceResponse(raw) {
  const result = raw?.result
  const list = Array.isArray(result) ? result : (result && typeof result === 'object' ? [result] : [])
  const first = list[0]
  const addr = first?.registered_agent?.address
  if (!addr) return null
  const line1 = addr.line1 ?? ''
  const city = addr.city ?? ''
  const state = addr.state_province_region ?? ''
  const zip = addr.zip_postal_code ?? ''
  if (!line1 || !city || !state || !zip) return null
  return { line1, line2: addr.line2 || null, city, state, zip }
}

async function runProvisioning(orderId, opts = {}) {
  const { data: order, error: fetchErr } = await sb
    .from('Order')
    .select('id, firstName, lastName, email, companyName, entityType, addons, raCompanyId, raServiceId, raInvoiceId, raAddress, raProvisionedAt, raAddressEmailSentAt')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) return { ok: false, orderId, error: 'Order not found' }

  // Guardia: solo TEST
  if (!/^TEST\s/i.test(order.companyName)) {
    return { ok: false, orderId, error: `Refuso: companyName no empieza con "TEST " (era "${order.companyName}")` }
  }

  const hasRaAddon = order.addons?.ra === true
  if (!hasRaAddon) return { ok: true, orderId, skipped: 'no-ra-addon' }

  if (!opts.force && order.raProvisionedAt) {
    return {
      ok: true,
      orderId,
      companyId: order.raCompanyId,
      serviceId: order.raServiceId,
      invoiceId: order.raInvoiceId,
      address: order.raAddress,
      skipped: 'already-provisioned',
    }
  }

  const entityLabel = order.entityType === 'corp' ? 'Corporation' : 'Limited Liability Company'

  // Paso 1: POST /companies
  let companyId = order.raCompanyId
  if (!companyId) {
    const r = await ctFetch('POST', '/companies', {
      body: {
        companies: [{ name: order.companyName, entity_type: entityLabel, home_state: 'Florida' }],
        duplicate_name_allowed: false,
      },
    })
    if (!r.ok || r.data?.success === false) {
      return { ok: false, orderId, error: `POST /companies: ${JSON.stringify(r.data)}` }
    }
    const list = Array.isArray(r.data?.result) ? r.data.result : [r.data?.result]
    companyId = list[0]?.id || list[0]?.company_id
    if (!companyId) return { ok: false, orderId, error: 'POST /companies sin id' }
    await sb.from('Order').update({ raCompanyId: companyId }).eq('id', orderId)
  }

  // Paso 2: POST /services
  let serviceId = order.raServiceId
  let address = order.raAddress
  if (!serviceId || !address) {
    const r = await ctFetch('POST', '/services', {
      body: { company_id: companyId, jurisdictions: ['Florida'] },
    })
    if (!r.ok || r.data?.success === false) {
      return { ok: false, orderId, companyId, error: `POST /services: ${JSON.stringify(r.data)}` }
    }
    const list = Array.isArray(r.data?.result) ? r.data.result : [r.data?.result]
    serviceId = list[0]?.id || list[0]?.service_id
    address = extractAddressFromServiceResponse(r.data)
    await sb.from('Order').update({
      raServiceId: serviceId,
      raAddress: address,
      raProvisionedAt: new Date().toISOString(),
    }).eq('id', orderId)
  }

  // Paso 3: GET /invoices
  let invoiceId = order.raInvoiceId
  if (!invoiceId) {
    const r = await ctFetch('GET', '/invoices', { query: { company_id: companyId } })
    const invoices = Array.isArray(r.data?.result) ? r.data.result : []
    invoiceId = invoices[0]?.id || invoices[0]?.invoice_id || null
    if (invoiceId) {
      await sb.from('Order').update({ raInvoiceId: invoiceId }).eq('id', orderId)
    }
  }

  // Paso 4: marcar raAddressEmailSentAt (simulacion — no envia email real en E2E)
  if (!order.raAddressEmailSentAt && address) {
    await sb.from('Order').update({ raAddressEmailSentAt: new Date().toISOString() }).eq('id', orderId)
  }

  return { ok: true, orderId, companyId, serviceId, invoiceId, address }
}

// ────────────────────────────────────────────────────────────────────────────
// HTML preview del email (duplicado de sendRaAddressReady, EN only)
// ────────────────────────────────────────────────────────────────────────────

function renderEmailHtml(order, address) {
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const addrLine2Html = address.line2 ? `<div>${address.line2}</div>` : ''
  return `<!doctype html><html><body style="margin:0;padding:20px;background:#f1f5f9">
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:42px;padding-right:12px">
              <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
            </td>
            <td style="vertical-align:middle">
              <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
              <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
            </td>
          </tr></table>
        </div>
        <div style="padding:32px">
          <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">Registered Agent Service</p>
          <h2 style="color:#1C2E44;font-size:20px;margin-top:0">Your Registered Agent is active, ${order.firstName} ${order.lastName}</h2>
          <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
            <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">Order Number</div>
            <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:6px 0;font-size:14px"><strong>Company:</strong> ${order.companyName}</p>
            ${order.entityType ? `<p style="margin:6px 0 0;font-size:14px"><strong>Entity Type:</strong> ${order.entityType.toUpperCase()}</p>` : ''}
          </div>
          <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 10px">Your Registered Agent Address</p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:0 0 20px;font-size:15px;line-height:1.6;color:#0c4a6e">
            <div style="font-weight:700">${address.line1}</div>
            ${addrLine2Html}
            <div>${address.city}, ${address.state} ${address.zip}</div>
          </div>
          <p style="color:#475569;line-height:1.7">This is the official address your business will use to receive legal documents and government correspondence.</p>
          <p style="color:#475569;line-height:1.7">Any legal document that arrives at this address will be processed and forwarded to you by email the same day.</p>
        </div>
      </div>
    </div>
    <p style="text-align:center;margin-top:20px;font-family:monospace;font-size:11px;color:#94a3b8">[E2E PREVIEW — no fue enviado a Resend. To: ${order.email}]</p>
  </body></html>`
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de test
// ────────────────────────────────────────────────────────────────────────────

async function createTestOrder() {
  const id = randomUUID()
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const now = new Date().toISOString()
  const row = {
    id,
    firstName: 'Test',
    lastName: 'E2E User',
    email: process.env.INTERNAL_ALERT_EMAIL || 'alert@opabiz.com',
    phone: '4073091418',
    country: 'US',
    companyName: `TEST E2E RA ${timestamp} LLC`,
    entityType: 'llc',
    speed: 'standard',
    package: 'standard',
    amount: 199,
    addons: { ra: true },
    paymentStatus: 'paid',
    status: 'in_review',
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  }
  const { error } = await sb.from('Order').insert(row)
  if (error) {
    console.error('ERROR insertando Order de test:', error.message)
    process.exit(1)
  }
  return id
}

async function deleteTestOrder(orderId) {
  const { data: order } = await sb.from('Order').select('companyName').eq('id', orderId).single()
  if (!order) { console.log('Order no existe (ya borrada?)'); return }
  if (!/^TEST\s/i.test(order.companyName)) {
    console.error(`ERROR: refuso borrar Order que no empieza con "TEST " (era "${order.companyName}")`)
    process.exit(1)
  }
  const { error } = await sb.from('Order').delete().eq('id', orderId)
  if (error) { console.error('ERROR borrando:', error.message); process.exit(1) }
  console.log(`✓ Order ${orderId} borrada`)
}

async function fetchOrder(orderId) {
  const { data } = await sb.from('Order')
    .select('id, firstName, lastName, email, companyName, entityType, addons, raCompanyId, raServiceId, raInvoiceId, raInvoicePaid, raAddress, raProvisionedAt, raAddressEmailSentAt')
    .eq('id', orderId).single()
  return data
}

function fmt(label, value) {
  return `  ${label.padEnd(24)} ${value ?? '—'}`
}

function bar(label) { console.log(`\n${'='.repeat(78)}\n  ${label}\n${'='.repeat(78)}`) }

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  if (cleanupArg) {
    await deleteTestOrder(cleanupArg)
    return
  }

  let orderId = orderArg
  let wasCreated = false
  if (!orderId) {
    bar('Creando Order de test en Supabase')
    orderId = await createTestOrder()
    wasCreated = true
    console.log(`✓ Order creada: ${orderId}`)
  } else {
    console.log(`Usando Order existente: ${orderId}`)
    const existing = await fetchOrder(orderId)
    if (!existing) { console.error('Order no encontrada'); process.exit(1) }
    if (!/^TEST\s/i.test(existing.companyName)) {
      console.error(`ERROR: la Order no empieza con "TEST " (era "${existing.companyName}"). Refuso operar.`)
      process.exit(1)
    }
  }

  // ── CORRIDA 1 — deberia hacer todo el trabajo ─────────────────────────────
  bar('CORRIDA 1 — provisionRaForOrder(force:false) — deberia crear todo')
  const r1 = await runProvisioning(orderId)
  console.log('Resultado:', JSON.stringify(r1, null, 2))

  const order1 = await fetchOrder(orderId)
  console.log('\nEstado de la Order despues de la corrida 1:')
  console.log(fmt('raCompanyId', order1.raCompanyId))
  console.log(fmt('raServiceId', order1.raServiceId))
  console.log(fmt('raInvoiceId', order1.raInvoiceId))
  console.log(fmt('raProvisionedAt', order1.raProvisionedAt))
  console.log(fmt('raAddressEmailSentAt', order1.raAddressEmailSentAt))
  console.log(fmt('raAddress', order1.raAddress ? `${order1.raAddress.line1}, ${order1.raAddress.city}, ${order1.raAddress.state} ${order1.raAddress.zip}` : null))

  const success1 = !!(order1.raCompanyId && order1.raServiceId && order1.raAddress && order1.raProvisionedAt)
  console.log(`\n${success1 ? '✓' : '✗'} Corrida 1: ${success1 ? 'TODO OK' : 'FALLO — revisar arriba'}`)

  // ── CORRIDA 2 — deberia hacer NADA (idempotente) ──────────────────────────
  bar('CORRIDA 2 — provisionRaForOrder(force:false) — deberia SKIP')
  const r2 = await runProvisioning(orderId)
  console.log('Resultado:', JSON.stringify(r2, null, 2))

  const order2 = await fetchOrder(orderId)
  const identical = (
    order1.raCompanyId === order2.raCompanyId &&
    order1.raServiceId === order2.raServiceId &&
    order1.raInvoiceId === order2.raInvoiceId &&
    order1.raProvisionedAt === order2.raProvisionedAt &&
    order1.raAddressEmailSentAt === order2.raAddressEmailSentAt
  )
  const skipped = r2.skipped === 'already-provisioned'
  console.log(`\n${skipped ? '✓' : '✗'} skipped:'already-provisioned' → ${r2.skipped}`)
  console.log(`${identical ? '✓' : '✗'} Todos los IDs y timestamps IDENTICOS a corrida 1`)

  // ── Preview del email al cliente ──────────────────────────────────────────
  bar('Preview del email al cliente')
  if (order1.raAddress) {
    const html = renderEmailHtml(order1, order1.raAddress)
    const previewFile = path.join(SCRATCHPAD, 'ra-email-preview.html')
    fs.writeFileSync(previewFile, html)
    console.log(`✓ HTML del email guardado en: ${previewFile}`)
    console.log('  Abrilo en el browser para verificar:')
    console.log('  - NO menciona "RAI" ni "provisioning" ni "company created"')
    console.log('  - Direccion visible en la card azul')
    console.log('  - Order Number, saludo con nombre completo, tono factual')
  } else {
    console.log('✗ No se pudo renderizar el email (no hay raAddress)')
  }

  // ── Panel admin URL ───────────────────────────────────────────────────────
  bar('Verificar en el panel admin')
  console.log(`URL: https://opabiz.com/admin/orders/${orderId}`)
  console.log('(o localhost si el dev server esta corriendo: http://localhost:3000/admin/orders/' + orderId + ')')
  console.log('\nEn la seccion "🏢 Registered Agent (RAI Provisioning)" deberias ver:')
  console.log('  - Badge verde "Activo (dirección asignada)"')
  console.log('  - Timestamp de provisionado + timestamp de email al cliente')
  console.log('  - Company ID y Service ID')
  console.log('  - Invoice ID en su caja destacada + label "Sin pagar — el staff paga en el portal RAI"')
  console.log('  - Direccion asignada en card azul')
  console.log('  - Boton "Retry RA provisioning"')

  // ── Cleanup opcional ──────────────────────────────────────────────────────
  bar('LIMPIEZA')
  if (wasCreated) {
    console.log(`Para borrar esta Order de test cuando termines de verificar el admin:`)
    console.log(`  node scripts/corptools-test-e2e.mjs --cleanup=${orderId}`)
  } else {
    console.log('(Order pre-existente, no la borro automatico)')
  }
  console.log()
}

main().catch(err => { console.error('\nERROR:', err.message); process.exit(1) })
