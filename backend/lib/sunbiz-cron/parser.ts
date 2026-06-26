// Port literal de scripts/ingest/florida_sftp.py (proyecto datallc).
// NO modificar offsets. NO "mejorar" la logica del parser. Si Florida
// cambia el layout, actualizar este archivo MAS el Python original juntos.
//
// Layout oficial: https://dos.sunbiz.org/data-definitions/cor.html
// Record fixed-width 1440 chars. Officers hasta 6 × 128 bytes a partir
// del offset 668. Sub-campos del name del officer verificados empiricamente
// 2026-05-29 por el founder (last:0-20, first:20-34, middle:34-42).

export const RECORD_LEN = 1440
const OFFICER_START = 668
const OFFICER_LEN = 128
const MAX_OFFICERS = 6

// Header field offsets (mismo orden que el Python)
const F: Record<string, [number, number]> = {
  doc_number:    [0, 12],
  name:          [12, 204],
  status:        [204, 205],
  filing_type:   [205, 220],
  addr1:         [220, 262],
  addr2:         [262, 304],
  city:          [304, 332],
  state:         [332, 334],
  zip:           [334, 344],
  country:       [344, 346],
  mail_addr1:    [346, 388],
  mail_addr2:    [388, 430],
  mail_city:     [430, 458],
  mail_state:    [458, 460],
  mail_zip:      [460, 470],
  mail_country:  [470, 472],
  file_date:     [472, 480],
  fei:           [480, 494],
  more_than_six: [494, 495],
  last_tx_date:  [495, 503],
  state_country: [503, 505],
  ra_name:       [544, 586],
  ra_type:       [586, 587],
  ra_addr:       [587, 629],
  ra_city:       [629, 657],
  ra_state:      [657, 659],
  ra_zip:        [659, 668],
}

// Sub-campos dentro del bloque de 128 bytes de cada officer
const OFF: Record<string, [number, number]> = {
  title: [0, 4],
  type:  [4, 5],
  name:  [5, 47],
  addr:  [47, 89],
  city:  [89, 117],
  state: [117, 119],
  zip:   [119, 128],
}

// Sub-campos del name field de 42 chars (verificado por el founder)
const NAME_SUB = {
  last:   [0, 20] as [number, number],
  first:  [20, 34] as [number, number],
  middle: [34, 42] as [number, number],
}

const FILING_TYPE_MAP: Record<string, string> = {
  FLAL: 'LLC', FORL: 'LLC',
  DOMLP: 'LP', FORLP: 'LP',
  DOMP: 'Corp', FORP: 'Corp',
  DOMNP: 'Corp', FORNP: 'Corp',
  FLLLP: 'LLP', FORLLP: 'LLP',
}

function s(record: string, key: keyof typeof F): string {
  const [a, b] = F[key]
  return record.slice(a, b).trim()
}

function sub(block: string, key: keyof typeof OFF): string {
  const [a, b] = OFF[key]
  return block.slice(a, b).trim()
}

function nameSub(nameField: string, key: keyof typeof NAME_SUB): string {
  const [a, b] = NAME_SUB[key]
  return nameField.slice(a, b).trim()
}

export function normalizeEntityType(filingType: string): string {
  const ft = filingType.trim().toUpperCase()
  if (ft in FILING_TYPE_MAP) return FILING_TYPE_MAP[ft]
  if (ft.includes('FIC') || ft.includes('DBA')) return 'DBA'
  if (ft.endsWith('L') || ft.includes('LLC')) return 'LLC'
  if (ft.endsWith('P') || ft.includes('CORP')) return 'Corp'
  return 'Other'
}

export function parseFloridaDate(mmddyyyy: string): string | null {
  const v = mmddyyyy.trim()
  if (v.length !== 8 || !/^\d{8}$/.test(v)) return null
  const m = parseInt(v.slice(0, 2), 10)
  const d = parseInt(v.slice(2, 4), 10)
  const y = parseInt(v.slice(4, 8), 10)
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1800 || y > 2200) return null
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
}

function combineAddress(parts: string[]): string | null {
  const cleaned = parts.map(p => p.trim()).filter(Boolean)
  return cleaned.length ? cleaned.join(', ') : null
}

export interface Officer {
  name: string
  first_name: string
  last_name: string
  middle: string
  title: string
  type: string  // 'P' = persona, 'C' = company
  address: string | null
}

export interface ParsedRecord {
  document_number: string
  entity_name: string
  entity_type: string                  // normalizado: LLC/Corp/LP/LLP/DBA/Other
  filing_type_raw: string              // codigo bruto (FLAL/FORL/DOMP/etc.)
  status: string | null
  filing_date: string | null           // ISO YYYY-MM-DD o null
  // Header crudo
  principal_addr1: string | null
  principal_addr2: string | null
  principal_city: string | null
  principal_state: string | null
  principal_zip: string | null
  principal_country: string | null
  mail_addr1: string | null
  mail_addr2: string | null
  mail_city: string | null
  mail_state: string | null
  mail_zip: string | null
  mail_country: string | null
  // Concatenadas (compatibilidad con cols viejas)
  principal_address: string | null
  mailing_address: string | null
  // Scalars crudos
  fei: string | null
  last_tx_date: string | null          // ISO YYYY-MM-DD o null
  state_country: string | null
  more_than_six: number                // 0/1
  // RA
  registered_agent_name: string | null
  registered_agent_type: string | null
  registered_agent_address: string | null
  registered_agent_city: string | null
  registered_agent_state: string | null
  registered_agent_zip: string | null
  // Officers JSON
  officers: Officer[]
  officer_count: number
}

export function parseOfficers(record: string): Officer[] {
  const officers: Officer[] = []
  for (let i = 0; i < MAX_OFFICERS; i++) {
    const base = OFFICER_START + i * OFFICER_LEN
    const block = record.slice(base, base + OFFICER_LEN)
    if (block.length < OFFICER_LEN) break

    const nameField = block.slice(OFF.name[0], OFF.name[1])
    const lastName = nameSub(nameField, 'last')
    const firstName = nameSub(nameField, 'first')
    const middle = nameSub(nameField, 'middle')
    if (!lastName && !firstName) continue

    const combined = [lastName, firstName, middle].filter(Boolean).join(' ')
    const title = sub(block, 'title')
    const otype = sub(block, 'type')
    const addr = combineAddress([
      sub(block, 'addr'),
      sub(block, 'city'),
      sub(block, 'state'),
      sub(block, 'zip'),
    ])

    officers.push({
      name: combined,
      first_name: firstName,
      last_name: lastName,
      middle,
      title,
      type: otype,
      address: addr,
    })
  }
  return officers
}

export function parseRecord(record: string): ParsedRecord | null {
  if (record.length < 668) return null

  const docNumber = s(record, 'doc_number')
  const name = s(record, 'name')
  if (!docNumber || !name) return null

  const filingTypeRaw = s(record, 'filing_type')
  const officers = parseOfficers(record)

  // Principal address concatenada (compatibilidad con col vieja)
  const principal = combineAddress([
    s(record, 'addr1'), s(record, 'addr2'),
    s(record, 'city'), s(record, 'state'), s(record, 'zip'),
  ])
  // Mailing address concatenada (compatibilidad con col vieja)
  const mailing = combineAddress([
    s(record, 'mail_addr1'), s(record, 'mail_addr2'),
    s(record, 'mail_city'), s(record, 'mail_state'), s(record, 'mail_zip'),
  ])

  const mtsRaw = s(record, 'more_than_six')

  return {
    document_number: docNumber,
    entity_name: name,
    entity_type: normalizeEntityType(filingTypeRaw),
    filing_type_raw: filingTypeRaw,
    status: s(record, 'status') || null,
    filing_date: parseFloridaDate(s(record, 'file_date')),

    principal_addr1:   s(record, 'addr1') || null,
    principal_addr2:   s(record, 'addr2') || null,
    principal_city:    s(record, 'city') || null,
    principal_state:   s(record, 'state') || null,
    principal_zip:     s(record, 'zip') || null,
    principal_country: s(record, 'country') || null,

    mail_addr1:    s(record, 'mail_addr1') || null,
    mail_addr2:    s(record, 'mail_addr2') || null,
    mail_city:     s(record, 'mail_city') || null,
    mail_state:    s(record, 'mail_state') || null,
    mail_zip:      s(record, 'mail_zip') || null,
    mail_country:  s(record, 'mail_country') || null,

    principal_address: principal,
    mailing_address:   mailing,

    fei:           s(record, 'fei') || null,
    last_tx_date:  parseFloridaDate(s(record, 'last_tx_date')),
    state_country: s(record, 'state_country') || null,
    more_than_six: mtsRaw === 'Y' || mtsRaw === '1' ? 1 : 0,

    registered_agent_name:    s(record, 'ra_name') || null,
    registered_agent_type:    s(record, 'ra_type') || null,
    registered_agent_address: s(record, 'ra_addr') || null,
    registered_agent_city:    s(record, 'ra_city') || null,
    registered_agent_state:   s(record, 'ra_state') || null,
    registered_agent_zip:     s(record, 'ra_zip') || null,

    officers,
    officer_count: officers.length,
  }
}

export function parseFile(content: string): ParsedRecord[] {
  const out: ParsedRecord[] = []
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/[\x00\r]+$/, '')
    if (line.length < 668) continue
    const parsed = parseRecord(line)
    if (parsed) out.push(parsed)
  }
  return out
}
