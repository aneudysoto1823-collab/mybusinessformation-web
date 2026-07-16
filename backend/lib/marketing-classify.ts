// Bloque 2 del sistema de marketing saliente (doc 31).
// Toma un batch de LLCs recien traidas de Sunbiz y las clasifica con Claude Haiku:
// - score (A/B/C)
// - vertical (una de VERTICALS)
// - owner_profile (likely_foreign / likely_us / unknown)
// - address_type (residential / commercial / virtual / unknown)
//
// Diseno de costo: Haiku es barato pero no gratis. Batching de 20 leads por
// prompt corta la latencia y el costo casi 20x vs una llamada por lead.

import Anthropic from '@anthropic-ai/sdk'
import { VERTICALS, VERTICAL_KEYS, VERTICAL_PRIORITY, isValidVertical, type VerticalKey } from './marketing-verticals'

const MODEL = 'claude-haiku-4-5-20251001'
const BATCH_SIZE = 20

let cachedClient: Anthropic | null = null
function getClient(): Anthropic {
  if (cachedClient) return cachedClient
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada')
  cachedClient = new Anthropic({ apiKey })
  return cachedClient
}

export interface LeadInput {
  document_number: string
  entity_name: string
  entity_type: string | null
  principal_addr1: string | null
  principal_addr2: string | null
  principal_city: string | null
  principal_state: string | null
  principal_zip: string | null
  principal_country: string | null
  agent_name: string | null
  agent_type: string | null       // 'P' persona / 'C' corporation
  officers_json: string | null    // JSON array de {title, type, name, addr...}
  fei_number: string | null
}

export type Score = 'A' | 'B' | 'C'
export type OwnerProfile = 'likely_foreign' | 'likely_us' | 'unknown'
export type AddressType = 'residential' | 'commercial' | 'virtual' | 'unknown'

export interface LeadClassification {
  document_number: string
  score: Score
  vertical: VerticalKey
  vertical_priority: number
  owner_profile: OwnerProfile
  address_type: AddressType
  has_good_address: boolean
  notes: string | null
}

function buildSystemPrompt(): string {
  const verticalList = VERTICALS.map(v =>
    `  - ${v.key}: ${v.label} (ejemplos: ${v.examples})`
  ).join('\n')

  return [
    'Sos un clasificador de LLCs recien creadas en Florida para una campana de marketing directo.',
    '',
    'Para cada LLC te llegan: nombre, direccion principal, agente registrado, dueños (officers) y algunos metadatos.',
    'Devolves 5 campos por LLC:',
    '',
    '1. **score** (A/B/C): que tan valioso es para nuestro negocio (formacion de LLC + servicios de compliance):',
    '   - A: LLC con dueños que probablemente necesitan multiples servicios (EIN, ITIN, agente registrado, licencias). Ej: extranjero recien llegado formando negocio.',
    '   - B: LLC con perfil normal, probablemente ya tiene algunos servicios pero puede necesitar otros.',
    '   - C: LLC con perfil que probablemente NO necesita nuestros servicios (ej: ya representada por abogado, holding solo de propiedades, sin dueño identificable).',
    '',
    '2. **vertical**: elegi UNA de esta lista cerrada (usa el key exacto):',
    verticalList,
    '',
    '   Si el nombre da senales claras (ej. "Miami Realty LLC" -> real_estate, "Torres Trucking LLC" -> trucking), usa ese vertical.',
    '   Si no hay senales, usa "unknown" (NO inventes, "unknown" es respuesta valida).',
    '',
    '3. **owner_profile**: mira el nombre del primer officer (dueño):',
    '   - likely_foreign: nombre latino/hispano/no anglosajon (ej. Javier Soto, Maria Rodriguez, Chen Wei)',
    '   - likely_us: nombre anglosajon claro (ej. John Smith, Michael Johnson)',
    '   - unknown: no hay officers o el nombre es ambiguo',
    '',
    '4. **address_type** (usa la direccion principal):',
    '   - residential: apartamento, casa, suite chica (ej. "APT 3B", "UNIT 12")',
    '   - commercial: edificio comercial, oficina, plaza',
    '   - virtual: sirve de PO Box, mailbox, virtual office (ej. "PMB", "SUITE 1000", "MAIL CENTER")',
    '   - unknown: no se puede determinar',
    '',
    '5. **has_good_address** (bool): true si la direccion parece completa y valida (calle + ciudad + estado + zip), false si esta incompleta o rara.',
    '',
    'Devolve SOLO un JSON array con este formato exacto, uno por LLC:',
    '```json',
    '[',
    '  {"document_number": "L26...", "score": "A", "vertical": "real_estate", "owner_profile": "likely_foreign", "address_type": "residential", "has_good_address": true, "notes": null},',
    '  ...',
    ']',
    '```',
    '',
    'notes es opcional: pone un string corto (max 80 chars) solo si detectas algo notable (ej. "posible abogado", "PO Box", "sin officers"). Sino null.',
    'NO agregues texto antes ni despues del JSON. NO uses markdown code fences. Solo el array JSON puro.',
  ].join('\n')
}

function leadToJson(lead: LeadInput): string {
  let officers = null
  try {
    if (lead.officers_json) officers = JSON.parse(lead.officers_json)
  } catch {}
  return JSON.stringify({
    document_number: lead.document_number,
    name: lead.entity_name,
    type: lead.entity_type,
    principal_address: [lead.principal_addr1, lead.principal_addr2, lead.principal_city, lead.principal_state, lead.principal_zip, lead.principal_country].filter(Boolean).join(', '),
    agent: { name: lead.agent_name, type: lead.agent_type },
    officers: officers ? officers.slice(0, 3) : null,
    fei: lead.fei_number,
  })
}

async function callHaikuBatch(leads: LeadInput[]): Promise<LeadClassification[]> {
  const client = getClient()
  const userMessage = 'Clasifica estas ' + leads.length + ' LLCs. Devolve el JSON array:\n\n' +
    leads.map(l => leadToJson(l)).join('\n')

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = resp.content
    .filter(c => c.type === 'text')
    .map(c => (c as { type: 'text'; text: string }).text)
    .join('')

  // Extraer JSON — puede venir con o sin markdown fences a pesar de la instruccion
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Haiku no devolvio JSON array: ' + text.slice(0, 200))

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    document_number: string
    score: string
    vertical: string
    owner_profile: string
    address_type: string
    has_good_address: boolean
    notes: string | null
  }>

  return parsed.map(row => {
    const vertical: VerticalKey = isValidVertical(row.vertical) ? row.vertical : 'unknown'
    const score: Score = (['A', 'B', 'C'] as const).includes(row.score as Score) ? row.score as Score : 'C'
    const owner: OwnerProfile = (['likely_foreign', 'likely_us', 'unknown'] as const).includes(row.owner_profile as OwnerProfile)
      ? row.owner_profile as OwnerProfile : 'unknown'
    const addr: AddressType = (['residential', 'commercial', 'virtual', 'unknown'] as const).includes(row.address_type as AddressType)
      ? row.address_type as AddressType : 'unknown'
    return {
      document_number: row.document_number,
      score,
      vertical,
      vertical_priority: VERTICAL_PRIORITY[vertical],
      owner_profile: owner,
      address_type: addr,
      has_good_address: Boolean(row.has_good_address),
      notes: row.notes ? String(row.notes).slice(0, 200) : null,
    }
  })
}

export async function classifyLeadsWithHaiku(leads: LeadInput[]): Promise<LeadClassification[]> {
  const out: LeadClassification[] = []
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE)
    const batchResult = await callHaikuBatch(batch)
    // Reordenar segun input (Haiku puede devolver en otro orden)
    const byDocnum = new Map(batchResult.map(r => [r.document_number, r]))
    for (const lead of batch) {
      const c = byDocnum.get(lead.document_number)
      if (c) out.push(c)
      // Si Haiku no clasifico alguno, se ignora silencioso — el UPDATE en DB solo toca los que si vinieron
    }
  }
  return out
}
