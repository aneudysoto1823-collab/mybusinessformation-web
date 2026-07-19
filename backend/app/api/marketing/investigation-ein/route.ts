// Endpoint de investigación temporal (2026-07-19).
// Trae 20 LLC de Florida que cumplan: con EIN + dueño hombre americano + vertical claro + dir. validada.
// Corre desde Vercel (aws-us-east-1) donde la latencia a Turso es <5ms — el mismo script desde local
// (RD → aws-us-east-1) tarda >3 min y hace timeout.
//
// Uso: GET /api/marketing/investigation-ein → descarga XLSX
// Auth: admin session obligatoria.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'
import { getTurso } from '@/lib/turso'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

function inferVertical(name: string): string | null {
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

interface ParsedAddress { addr1: string; addr2: string | null; city: string; state: string; zip: string | null }

function parseOfficerAddress(addrStr: string): ParsedAddress | null {
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

interface GoogleResult { valid: boolean; formatted: string | null; is_residential: boolean; is_business: boolean; is_pobox: boolean }

async function validateWithGoogle(addr: ParsedAddress): Promise<GoogleResult> {
  const key = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY
  if (!key) return { valid: false, formatted: null, is_residential: false, is_business: false, is_pobox: false }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: { addressLines: [addr.addr1, addr.addr2].filter(Boolean), locality: addr.city, administrativeArea: addr.state, postalCode: addr.zip || '', regionCode: 'US' } }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return { valid: false, formatted: null, is_residential: false, is_business: false, is_pobox: false }
    const data = await res.json() as { result?: { verdict?: { possibleNextAction?: string; addressComplete?: boolean }; metadata?: { residential?: boolean; business?: boolean; poBox?: boolean }; address?: { formattedAddress?: string } } }
    const v = data.result?.verdict || {}
    const m = data.result?.metadata || {}
    return {
      valid: v.possibleNextAction === 'ACCEPT' && v.addressComplete === true,
      formatted: data.result?.address?.formattedAddress || null,
      is_residential: m.residential === true, is_business: m.business === true, is_pobox: m.poBox === true,
    }
  } catch { clearTimeout(timeout); return { valid: false, formatted: null, is_residential: false, is_business: false, is_pobox: false } }
}

interface OfficerRaw { type?: string; first_name?: string; last_name?: string; name?: string; title?: string; address?: string }
interface Candidate {
  document_number: string; entity_name: string; filing_date: string | null; ein: string
  owner_first_name: string; owner_last_name: string; owner_full_name: string; officer_title: string
  address: string; addr2: string; city: string; state: string; zip: string; vertical: string
}
interface Validated extends Candidate {
  google_valid: string; google_formatted: string
  google_is_residential: string; google_is_business: string; google_is_pobox: string
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function GET() {
  const started = Date.now()
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const ok = token ? await verifyAdminToken(token) : false
  if (!ok) return jsonError(401, 'unauthorized')

  const sunbiz = getTurso()
  const logs: string[] = []
  const log = (m: string) => { logs.push(`[${Date.now() - started}ms] ${m}`); console.log(m) }

  // ═══ PASO 1 ═══ Traer 2000 LLC recientes ordenadas por filing_date (usa index existente).
  // Filtro fei se aplica en JS (no hay indice en fei y hacer scan explota Turso).
  log('PASO 1: query 2000 LLC recientes ORDER BY filing_date DESC (usa index)')
  const recientes = await sunbiz.execute({
    sql: `SELECT document_number, entity_name, filing_date, fei
          FROM sunbiz_corps
          WHERE filing_date >= date('now', '-60 days')
            AND status = 'A'
          ORDER BY filing_date DESC LIMIT 2000`,
    args: [],
  })
  log(`  ${recientes.rows.length} recientes traidas`)

  // Filtro EIN en JS (rapido, ya en memoria)
  const withEIN = { rows: recientes.rows.filter(r => {
    const f = String(r.fei || '').trim().toUpperCase()
    return f && f !== 'NONE' && f !== 'APPLIED FOR'
  }).slice(0, 300) }
  log(`  ${withEIN.rows.length} con EIN (filtrado en JS)`)

  // ═══ PASO 2 ═══ filter por vertical
  type RawRow = { document_number: string; entity_name: string; filing_date: string | null; fei: string; vertical: string | null }
  const withVertical: RawRow[] = withEIN.rows.map(r => ({
    document_number: String(r.document_number),
    entity_name: String(r.entity_name),
    filing_date: r.filing_date as string | null,
    fei: String(r.fei),
    vertical: inferVertical(String(r.entity_name)),
  })).filter((r): r is RawRow & { vertical: string } => r.vertical !== null)
  log(`PASO 2: ${withVertical.length} con vertical claro`)

  // ═══ PASO 3 ═══ traer officers en batches de 30
  log('PASO 3: traer officers en batches de 30')
  const officersMap = new Map<string, string>()
  for (let i = 0; i < withVertical.length; i += 30) {
    const batch = withVertical.slice(i, i + 30)
    const docs = batch.map(r => String(r.document_number))
    const placeholders = docs.map(() => '?').join(',')
    const officersRows = await sunbiz.execute({
      sql: `SELECT document_number, officers FROM sunbiz_corps WHERE document_number IN (${placeholders})`,
      args: docs,
    })
    officersRows.rows.forEach(r => officersMap.set(String(r.document_number), String(r.officers)))
  }
  log(`  officers traidos para ${officersMap.size} LLC`)

  // ═══ PASO 4 ═══ filter por hombre americano
  const candidates: Candidate[] = []
  for (const row of withVertical) {
    const officersJson = officersMap.get(String(row.document_number))
    if (!officersJson) continue
    let officers: OfficerRaw[]
    try { officers = JSON.parse(officersJson) as OfficerRaw[] } catch { continue }
    if (!Array.isArray(officers) || officers.length === 0) continue

    let hit: { off: OfficerRaw; parsed: ParsedAddress } | null = null
    for (const off of officers) {
      if (off?.type !== 'P') continue
      const first = String(off.first_name || '').trim().toUpperCase()
      const last  = String(off.last_name || '').trim().toUpperCase()
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
      owner_first_name: hit.off.first_name || '',
      owner_last_name: hit.off.last_name || '',
      owner_full_name: hit.off.name || `${hit.off.first_name} ${hit.off.last_name}`,
      officer_title: hit.off.title || '',
      address: hit.parsed.addr1,
      addr2: hit.parsed.addr2 || '',
      city: hit.parsed.city, state: hit.parsed.state, zip: hit.parsed.zip || '',
      vertical: row.vertical as string,
    })
    if (candidates.length >= 40) break
  }
  log(`PASO 4: ${candidates.length} candidatos (hombre americano + FL + no barrio hispano)`)

  // ═══ PASO 5 ═══ validar con Google
  log('PASO 5: validar direcciones con Google Address Validation')
  const validated: Validated[] = []
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const g = await validateWithGoogle({ addr1: c.address, addr2: c.addr2 || null, city: c.city, state: c.state, zip: c.zip || null })
    validated.push({
      ...c,
      google_valid: g.valid ? 'SI' : 'NO',
      google_formatted: g.formatted || '',
      google_is_residential: g.is_residential ? 'SI' : '',
      google_is_business: g.is_business ? 'SI' : '',
      google_is_pobox: g.is_pobox ? 'SI' : '',
    })
    if (validated.filter(v => v.google_valid === 'SI').length >= 20) break
  }
  const final = validated.filter(v => v.google_valid === 'SI').slice(0, 20)
  log(`PASO 5: ${final.length} validados por Google`)

  // ═══ PASO 6 ═══ generar XLSX
  const wb = XLSX.utils.book_new()
  const rows = (final.length > 0 ? final : validated).map((r, i) => ({
    '#': i + 1, 'Doc Number': r.document_number, 'LLC': r.entity_name,
    'Filing Date': r.filing_date, 'EIN': r.ein,
    'Owner Name': r.owner_full_name, 'First Name': r.owner_first_name, 'Last Name': r.owner_last_name,
    'Title': r.officer_title, 'Vertical': r.vertical,
    'Address': r.address, 'City': r.city, 'State': r.state, 'ZIP': r.zip,
    'Google Verified': r.google_valid, 'Google Formatted': r.google_formatted,
    'Residential': r.google_is_residential, 'Business': r.google_is_business, 'PO Box': r.google_is_pobox,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 4 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 11 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 45 }, { wch: 12 }, { wch: 10 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Prueba EIN')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  log(`FINAL: ${final.length} leads en Excel, ${Date.now() - started}ms total`)

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="opabiz-investigation-ein-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      'X-Investigation-Log': logs.join(' | '),
    },
  })
}
