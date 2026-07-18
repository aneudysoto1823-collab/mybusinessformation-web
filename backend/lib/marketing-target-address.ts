// Algoritmo de seleccion de "mejor direccion" para carta fisica (doc 31, Opcion B v2).
//
// Prioridad (actualizado 2026-07-18 por decision founder — privacy fix):
//   1. Mail address de la LLC, SI difiere del Registered Agent
//      → es la direccion que el dueño DESIGNO EXPLICITAMENTE para correspondencia
//   2. Principal address de la LLC
//      → direccion del negocio declarada (a nombre de la LLC, no del owner personal)
//   3. Nada → target_addr_source='none', el lead queda descartado en Bloque 3
//
// NUNCA se usa:
// - Owner personal address (dentro de officers[]) — es la CASA del dueño, privada.
//   Si el dueño designo una mail_address distinta, es EXACTAMENTE porque no quiere
//   correspondencia comercial en su casa. Respetar eso es etico + legal + mejor para
//   la reputacion. La direccion personal en Sunbiz es dato publico pero usarla para
//   direct mail comercial es turbio.
// - Registered agent address — siempre es un intermediario legal (abogado/contador).

export type TargetSource = 'mail' | 'principal' | 'none'

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

export function pickTargetAddress(row: LeadForTargeting): TargetAddress {
  // 1) MAIL address — si tiene minimo Y difiere de RA
  // Es la direccion que el dueño designo EXPLICITAMENTE para correspondencia comercial.
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

  // 2) PRINCIPAL address (fallback)
  // Direccion declarada del negocio (a nombre de la LLC, no del owner personal).
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

  // 3) Sin mail ni principal usable — NO usamos la owner address personal a proposito.
  //    El lead queda con target='none' y sera descartado antes del Bloque 3.
  return { source: 'none', addr1: null, addr2: null, city: null, state: null, zip: null, country: null }
}
