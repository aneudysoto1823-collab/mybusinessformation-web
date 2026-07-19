// Prueba independiente v4 — POR BLOQUES SECUENCIALES (approach founder 2026-07-19).
// Cada query es LIVIANA (no trae officers JSON masivo). El pesado (officers)
// se pide solo para los doc_numbers que ya pasaron los filtros previos.
//
// Paso 1: 200 LLC con EIN, solo columnas ligeras. Filtrar por vertical en JS.
// Paso 2: Para los que pasan vertical, pedir officers en batches chicos (20 doc_numbers).
//         Filtrar por hombre americano + dirección en JS.
// Paso 3: Validar direcciones con Google.

import dotenv from 'dotenv'
import XLSX from 'xlsx'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const TURSO_URL = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://')
const TOKEN = process.env.TURSO_AUTH_TOKEN

async function turso(sql, args = [], timeoutMs = 120000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error(`timeout ${timeoutMs}ms`)), timeoutMs)
  try {
    const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: args.map(a => ({ type: typeof a === 'number' ? 'integer' : 'text', value: String(a) })) } },
          { type: 'close' },
        ],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const result = data.results?.[0]
    if (result?.type === 'error') throw new Error(result.error?.message || 'unknown')
    const cols = result.response.result.cols.map(c => c.name)
    return result.response.result.rows.map(row => {
      const o = {}; row.forEach((c, i) => { o[cols[i]] = c.value ?? null }); return o
    })
  } catch (e) { clearTimeout(timeout); throw e }
}

// ── Filtros ─────────────────────────────────────────────────────────────────
const AMERICAN_MALE_NAMES = new Set([
  'JOHN','ROBERT','MICHAEL','WILLIAM','DAVID','RICHARD','JOSEPH','THOMAS',
  'CHARLES','CHRISTOPHER','DANIEL','MATTHEW','ANTHONY','DONALD','MARK','PAUL',
  'STEVEN','ANDREW','KENNETH','GEORGE','JOSHUA','KEVIN','BRIAN','EDWARD',
  'RONALD','TIMOTHY','JASON','JEFFREY','RYAN','JACOB','GARY','NICHOLAS',
  'ERIC','JONATHAN','STEPHEN','LARRY','JUSTIN','SCOTT','BRANDON','BENJAMIN',
  'SAMUEL','GREGORY','ALEXANDER','RAYMOND','PATRICK','JACK','DENNIS','JERRY',
  'TYLER','AARON','HENRY','DOUGLAS','PETER','ADAM','NATHAN','ZACHARY',
  'WALTER','KYLE','HAROLD','JEREMY','KEITH','ROGER','GERALD','ETHAN',
  'ARTHUR','TERRY','CHRISTIAN','SEAN','LAWRENCE','AUSTIN','NOAH','JESSE',
  'ALBERT','BRYAN','BRUCE','WILLIE','DYLAN','ALAN','RALPH','GABRIEL',
  'ROY','WAYNE','EUGENE','LOGAN','LOUIS','RUSSELL','VINCENT','PHILIP',
  'BOBBY','COLIN','CRAIG','NATHANIEL','CLIFFORD','EVERETT','TREVOR','BLAKE',
  'GRANT','CODY','ELLIOT','DEAN','CURTIS','GLENN','RANDALL',
  'CLINTON','CLAYTON','WESLEY','JEROME','TODD','JEFFERY','HARVEY',
  'STANLEY','LEONARD','MARVIN','FLOYD','LEO','SIDNEY','TRAVIS','CLARENCE',
])
const HISPANIC_LAST_NAMES = new Set([
  'GARCIA','RODRIGUEZ','MARTINEZ','HERNANDEZ','LOPEZ','GONZALEZ','GONZALES',
  'PEREZ','SANCHEZ','RAMIREZ','TORRES','FLORES','RIVERA','GOMEZ','DIAZ',
  'CRUZ','MORALES','REYES','GUTIERREZ','ORTIZ','CHAVEZ','RUIZ','ALVAREZ',
  'CASTILLO','JIMENEZ','MENDOZA','VASQUEZ','VAZQUEZ','SOTO','CONTRERAS',
  'GUERRERO','MEDINA','AGUILAR','HERRERA','FERNANDEZ','ROJAS','CARDENAS',
  'ESPINOZA','MARIN','MOLINA','LUGO','NUNEZ','ACOSTA','DELGADO','CASTRO',
  'QUINTERO','MONTOYA','RAMOS','SILVA','SANTIAGO','MENDEZ','RIOS',
  'BAUTISTA','SUAREZ','VALDEZ','SANDOVAL','CABRERA','VARGAS','VELAZQUEZ',
  'ROMERO','GALINDO','PACHECO','ORTEGA','FIGUEROA','ROSALES','CERVANTES',
  'MARQUEZ','GUERRA','SALAZAR','MONTES','SOLIS','SERRANO','GARZA','SANTOS',
  'ARIAS','ESCOBAR','MEJIA','GALLARDO','ARANGO','LEON','LUNA','CARRILLO',
  'CORTEZ','CORDOVA','CANO','TREVINO','LARA','MURILLO','ZUNIGA','LEAL',
  'FRANCO','MENA','CAMPOS','NAVARRO','VILLARREAL','MALDONADO','VILLA',
  'SALCEDO','TAPIA','PENA','VELASQUEZ','PADILLA',
])
const ASIAN_LAST_NAMES = new Set([
  'NGUYEN','TRAN','LE','PHAM','HUYNH','HOANG','VU','VO','PHAN','TRUONG',
  'CHEN','WANG','ZHANG','LIU','YANG','HUANG','ZHAO','WU','ZHOU','XU','SUN','MA',
  'ZHU','HU','GUO','HE','LIN','LUO','ZHENG','SONG','TANG','FAN','FENG','DENG',
  'KIM','LEE','PARK','CHOI','JUNG','KANG','JANG','YOON','LIM','HAN','SHIN',
  'OH','SEO','KWON','HWANG','BAEK','HONG','JEON','JO','MOON',
  'PATEL','SINGH','KUMAR','SHAH','GUPTA','SHARMA','MEHTA','JOSHI','MISHRA',
  'YADAV','REDDY','RAO','IYER','KHAN','AHMED','HUSSAIN','ALI','RAHMAN',
])
const HISPANIC_CITIES = new Set([
  'MIAMI','HIALEAH','DORAL','MIAMI BEACH','MIAMI GARDENS','CORAL GABLES',
  'HOMESTEAD','KENDALL','KENDALE LAKES','TAMIAMI','WESTCHESTER',
  'CUTLER BAY','PALMETTO BAY','PINECREST','SWEETWATER','MEDLEY',
  'HIALEAH GARDENS','NORTH MIAMI','NORTH MIAMI BEACH','OPA LOCKA','OPA-LOCKA',
  'AVENTURA','SUNNY ISLES BEACH','WEST MIAMI','FOUNTAINEBLEAU',
  'THE HAMMOCKS','WESTWOOD LAKES','GLENVAR HEIGHTS','FLORIDA CITY',
  'KISSIMMEE','BUENA VENTURA LAKES','POINCIANA','CELEBRATION',
  'LEHIGH ACRES','GOLDEN GLADES','WEST PARK','BROWNSVILLE',
  'WEST LITTLE RIVER','GLADEVIEW','OJUS','IVES ESTATES','NORLAND',
  'SOUTH MIAMI HEIGHTS','PRINCETON','LEISURE CITY','GOULDS','NARANJA',
  'ROCKDALE','RICHMOND WEST','THREE LAKES','COUNTRY WALK','COUNTRY CLUB',
  'MIRAMAR','WESTON','PEMBROKE PINES','HOLLYWOOD','DAVIE','TAMARAC',
  'LAUDERHILL','PLANTATION','FORT LAUDERDALE',
])

function inferVertical(name) {
  const n = (name || '').toUpperCase()
  if (/REAL ESTATE|REALTY|PROPERTIES|PROPERTY|HOMES|INVESTMENTS|LAND HOLDINGS|VENTURES|REAL PROPERTY|RENTAL|LEASING/.test(n)) return 'real_estate'
  if (/CONSTRUCTION|BUILDERS|REMODEL|CONTRACTING|CONTRACTOR|HVAC|PLUMBING|ROOFING|ELECTRIC|CARPENTRY|MASONRY|PAINTING|LANDSCAPING/.test(n)) return 'construction'
  if (/TRUCKING|LOGISTICS|TRANSPORT|FREIGHT|HAULING|LOGISTIC|CARRIER|MOVING|DELIVERY|EXPRESS/.test(n)) return 'trucking'
  if (/RESTAURANT|GRILL|KITCHEN|CATERING|BAKERY|CAFE|FOOD TRUCK|DELI|PIZZERIA|BURGERS|FOOD SERVICES/.test(n)) return 'restaurant'
  if (/E-COMMERCE|ECOMMERCE|SHOP|STORE|MARKETPLACE|RETAIL|BOUTIQUE|OUTLET/.test(n)) return 'ecommerce'
  if (/CONSULTING|ADVISORY|SOLUTIONS|STRATEGY|COACHING|MARKETING/.test(n)) return 'professional_services'
  if (/CLEANING|JANITORIAL|MAINTENANCE|LAWN|POWER WASH/.test(n)) return 'cleaning'
  if (/SALON|SPA|BEAUTY|BARBER|NAILS|AESTHETICS/.test(n)) return 'beauty'
  if (/MEDICAL|DENTAL|HEALTH|CLINIC|WELLNESS|CHIROPRAC|NURSING|CARE/.test(n)) return 'healthcare'
  if (/TECH|SOFTWARE|DIGITAL|AI |APP |IT SERVICES|CYBER|CODE|DEV /.test(n)) return 'tech'
  if (/IMPORT|EXPORT|WHOLESALE|TRADING/.test(n)) return 'import_export'
  return null
}

function parseOfficerAddress(addrStr) {
  if (!addrStr) return null
  const parts = addrStr.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 3) return null
  const last = parts[parts.length - 1]
  const isZip = /^\d{5}(-\d{4})?$/.test(last)
  const zip = isZip ? last : null
  const noZip = isZip ? parts.slice(0, -1) : parts
  if (noZip.length < 3) return null
  const stateIdx = noZip.length - 1
  const state = noZip[stateIdx]
  if (!/^[A-Z]{2}$/.test(state)) return null
  const city = noZip[stateIdx - 1]
  const addrParts = noZip.slice(0, stateIdx - 1)
  if (addrParts.length === 0) return null
  return { addr1: addrParts[0], addr2: addrParts.length > 1 ? addrParts.slice(1).join(', ') : null, city, state, zip }
}

async function validateWithGoogle(addr) {
  const key = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY
  if (!key) return { valid: false }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: { addressLines: [addr.addr1, addr.addr2].filter(Boolean), locality: addr.city, administrativeArea: addr.state, postalCode: addr.zip || '', regionCode: 'US' } }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return { valid: false }
    const data = await res.json()
    const v = data.result?.verdict || {}
    const m = data.result?.metadata || {}
    return {
      valid: v.possibleNextAction === 'ACCEPT' && v.addressComplete === true,
      formatted: data.result?.address?.formattedAddress || null,
      is_residential: m.residential === true, is_business: m.business === true, is_pobox: m.poBox === true,
    }
  } catch { clearTimeout(timeout); return { valid: false } }
}

async function main() {
  // ═══ PASO 1 ═══ Traer 200 LLC con EIN, columnas ligeras (sin officers JSON)
  // Filtro por rango de filing_date reciente para reducir el scan sobre 3.99M rows.
  console.log('\n═══ PASO 1: 200 LLC con EIN (ligeras, ultimos 6 meses) ═══')
  let t0 = Date.now()
  const withEIN = await turso(
    `SELECT document_number, entity_name, filing_date, fei
     FROM sunbiz_corps
     WHERE filing_date >= date('now', '-180 days')
       AND status = 'ACTIVE'
       AND fei IS NOT NULL AND fei != '' AND fei != 'NONE' AND fei != 'APPLIED FOR'
       AND officers IS NOT NULL AND officers != '[]'
     ORDER BY filing_date DESC LIMIT 200`,
    [], 180000
  )
  console.log(`✓ ${withEIN.length} traidas en ${Date.now()-t0}ms`)

  // ═══ PASO 2 ═══ Filtrar por vertical del nombre de la LLC (JS puro, gratis)
  console.log('\n═══ PASO 2: filtrar por vertical inferible ═══')
  const withVertical = withEIN
    .map(r => ({ ...r, vertical: inferVertical(r.entity_name) }))
    .filter(r => r.vertical !== null)
  console.log(`✓ ${withVertical.length} con vertical claro`)

  // ═══ PASO 3 ═══ Traer officers en batches de 25 para los que pasaron
  console.log('\n═══ PASO 3: traer officers de los filtrados (batches de 25) ═══')
  const officersMap = new Map()
  for (let i = 0; i < withVertical.length; i += 25) {
    const batch = withVertical.slice(i, i + 25)
    const docs = batch.map(r => r.document_number)
    const placeholders = docs.map(() => '?').join(',')
    t0 = Date.now()
    try {
      const officersRows = await turso(
        `SELECT document_number, officers FROM sunbiz_corps WHERE document_number IN (${placeholders})`,
        docs
      )
      officersRows.forEach(r => officersMap.set(r.document_number, r.officers))
      console.log(`  batch ${i}-${i + batch.length}: ${officersRows.length} en ${Date.now()-t0}ms`)
    } catch (e) {
      console.log(`  batch ${i} FALLO: ${e.message}`)
    }
  }
  console.log(`✓ officers traidos para ${officersMap.size} LLC`)

  // ═══ PASO 4 ═══ Filtrar por hombre americano con dirección utilizable
  console.log('\n═══ PASO 4: filtrar por dueño hombre americano ═══')
  const candidates = []
  for (const row of withVertical) {
    const officersJson = officersMap.get(row.document_number)
    if (!officersJson) continue
    let officers; try { officers = JSON.parse(officersJson) } catch { continue }
    if (!Array.isArray(officers) || officers.length === 0) continue

    let hit = null
    for (const off of officers) {
      if (off?.type !== 'P') continue
      const first = String(off.first_name || '').trim().toUpperCase()
      const last = String(off.last_name || '').trim().toUpperCase()
      if (!first || !last) continue
      if (!AMERICAN_MALE_NAMES.has(first)) continue
      if (HISPANIC_LAST_NAMES.has(last)) continue
      if (ASIAN_LAST_NAMES.has(last)) continue
      const parsed = parseOfficerAddress(off.address || '')
      if (!parsed || parsed.state !== 'FL') continue
      if (HISPANIC_CITIES.has(parsed.city.toUpperCase())) continue
      hit = { off, parsed }; break
    }
    if (!hit) continue

    candidates.push({
      document_number: row.document_number,
      entity_name: row.entity_name,
      filing_date: row.filing_date,
      ein: row.fei,
      owner_first_name: hit.off.first_name,
      owner_last_name: hit.off.last_name,
      owner_full_name: hit.off.name,
      officer_title: hit.off.title || '',
      address: hit.parsed.addr1,
      addr2: hit.parsed.addr2 || '',
      city: hit.parsed.city, state: hit.parsed.state, zip: hit.parsed.zip || '',
      vertical: row.vertical,
    })
    if (candidates.length >= 40) break
  }
  console.log(`✓ ${candidates.length} candidatos post-filtros (hombre americano + FL + no barrio hispano)`)

  // ═══ PASO 5 ═══ Validar direcciones con Google
  console.log('\n═══ PASO 5: validar direcciones con Google ═══')
  const validated = []
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const g = await validateWithGoogle({ addr1: c.address, addr2: c.addr2, city: c.city, state: c.state, zip: c.zip })
    validated.push({
      ...c,
      google_valid: g.valid ? 'SI' : 'NO',
      google_formatted: g.formatted || '',
      google_is_residential: g.is_residential ? 'SI' : '',
      google_is_business: g.is_business ? 'SI' : '',
      google_is_pobox: g.is_pobox ? 'SI' : '',
    })
    process.stdout.write(g.valid ? '.' : 'x')
    if (validated.filter(v => v.google_valid === 'SI').length >= 20) break
  }
  console.log()
  const final = validated.filter(v => v.google_valid === 'SI').slice(0, 20)
  console.log(`✓ ${final.length} validos por Google (target: 20)`)

  // ═══ PASO 6 ═══ Exportar Excel
  const desktopES = path.join(os.homedir(), 'Escritorio')
  const desktopEN = path.join(os.homedir(), 'Desktop')
  const desktop = fs.existsSync(desktopEN) ? desktopEN : (fs.existsSync(desktopES) ? desktopES : os.homedir())
  const outPath = path.join(desktop, 'opabiz-prueba-20-con-ein.xlsx')

  const wb = XLSX.utils.book_new()
  const rows = (final.length > 0 ? final : validated).map((r, i) => ({
    '#': i + 1, 'Doc Number': r.document_number, 'LLC': r.entity_name,
    'Filing Date': r.filing_date, 'EIN': r.ein,
    'Owner Name': r.owner_full_name, 'First Name': r.owner_first_name, 'Last Name': r.owner_last_name,
    'Title': r.officer_title, 'Vertical': r.vertical,
    'Address': r.address, 'City': r.city, 'State': r.state, 'ZIP': r.zip,
    'Google Verified': r.google_valid || '', 'Google Formatted': r.google_formatted || '',
    'Residential': r.google_is_residential || '', 'Business': r.google_is_business || '',
    'PO Box': r.google_is_pobox || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 4 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 11 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 45 }, { wch: 12 }, { wch: 10 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Prueba EIN')
  XLSX.writeFile(wb, outPath)
  console.log(`\n✅ Excel guardado: ${outPath}`)
  process.exit(0)
}

main().catch(e => { console.error('ERR', e); process.exit(1) })
