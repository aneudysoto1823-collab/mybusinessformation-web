// Algoritmo de seleccion de "mejor direccion" para carta fisica (doc 31, Opcion B).
//
// Prioridad (2026-07-17):
//   1. Owner = primer officer type='P' (persona) con direccion completa parseable
//      → llega al dueño real, mejor conversion
//   2. Mail address de la LLC, SIEMPRE QUE no coincida con la del Registered Agent
//      → llega donde reciben correspondencia oficial (probable dueño)
//   3. Principal address (fallback)
//      → puede ser oficina virtual/abogado — menor conversion pero mejor que nada
//   4. Nada → target_addr_source='none', el lead queda descartado en Bloque 3
//
// Nunca se usa registered_agent_address (siempre es un intermediario legal).

export type TargetSource = 'owner' | 'mail' | 'principal' | 'none'

export interface TargetAddress {
  source: TargetSource
  addr1: string | null
  addr2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export interface LeadForTargeting {
  officers_json?: string | null                // JSON array [{name, first_name, last_name, title, type, address}, ...]
  mailing_addr1?: string | null
  mailing_addr2?: string | null
  mailing_city?: string | null
  mailing_state?: string | null
  mailing_zip?: string | null
  mailing_country?: string | null
  agent_addr1?: string | null                  // registered agent addr — comparamos con mail para descartar
  principal_addr1?: string | null
  principal_addr2?: string | null
  principal_city?: string | null
  principal_state?: string | null
  principal_zip?: string | null
  principal_country?: string | null
}

function normalize(s: string | null | undefined): string {
  return s ? String(s).trim().toUpperCase().replace(/\s+/g, ' ') : ''
}

// Parsea el address string de un officer (formato Sunbiz: "STREET, [SUITE], CITY, STATE, ZIP")
// Devuelve null si no se puede armar addr+city+state min viable.
function parseOfficerAddress(addrStr: string): TargetAddress | null {
  if (!addrStr) return null
  const parts = addrStr.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 3) return null

  // Zip: ultima parte si matchea 5 digitos (o 5+4)
  const last = parts[parts.length - 1]
  const isZip = /^\d{5}(-\d{4})?$/.test(last)
  const zip = isZip ? last : null
  const noZip = isZip ? parts.slice(0, -1) : parts
  if (noZip.length < 3) return null

  // State: ultima antes del zip, debe ser 2 letras uppercase
  const stateIdx = noZip.length - 1
  const state = noZip[stateIdx]
  if (!/^[A-Z]{2}$/.test(state)) return null

  const city = noZip[stateIdx - 1]
  const addrParts = noZip.slice(0, stateIdx - 1)
  if (addrParts.length === 0) return null
  const addr1 = addrParts[0]
  const addr2 = addrParts.length > 1 ? addrParts.slice(1).join(', ') : null

  return {
    source: 'owner',
    addr1, addr2, city, state, zip, country: 'US',
  }
}

export function pickTargetAddress(row: LeadForTargeting): TargetAddress {
  // 1) OWNER — primer officer type='P' con address parseable
  if (row.officers_json) {
    try {
      const officers = JSON.parse(row.officers_json) as Array<{
        type?: string; address?: string; title?: string; name?: string
      }>
      if (Array.isArray(officers)) {
        for (const off of officers) {
          if (off?.type === 'P' && off.address) {
            const parsed = parseOfficerAddress(off.address)
            if (parsed && parsed.addr1 && parsed.city && parsed.state) {
              return parsed
            }
          }
        }
      }
    } catch {
      // JSON invalido — ignoro y sigo con mail/principal
    }
  }

  // 2) MAIL address — si tiene minimo Y difiere de RA
  const raAddr = normalize(row.agent_addr1)
  const mailAddr = normalize(row.mailing_addr1)
  const mailIsRA = raAddr && mailAddr && raAddr === mailAddr
  if (row.mailing_addr1 && row.mailing_city && row.mailing_state && !mailIsRA) {
    return {
      source: 'mail',
      addr1: row.mailing_addr1,
      addr2: row.mailing_addr2 ?? null,
      city:  row.mailing_city,
      state: row.mailing_state,
      zip:   row.mailing_zip ?? null,
      country: row.mailing_country ?? 'US',
    }
  }

  // 3) PRINCIPAL address (fallback)
  if (row.principal_addr1 && row.principal_city && row.principal_state) {
    return {
      source: 'principal',
      addr1: row.principal_addr1,
      addr2: row.principal_addr2 ?? null,
      city:  row.principal_city,
      state: row.principal_state,
      zip:   row.principal_zip ?? null,
      country: row.principal_country ?? 'US',
    }
  }

  // 4) Nada usable
  return { source: 'none', addr1: null, addr2: null, city: null, state: null, zip: null, country: null }
}
