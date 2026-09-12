// Enformion (EnformionGO) — Contact Enrichment API. Bloque 3.5 del sistema de
// marketing (doc 31): busca email/telefono de un lead a partir de nombre +
// direccion. Corre DESPUES de validar la direccion con Google (solo sobre
// leads con address_validated=1) — mismo principio de "barato antes que caro"
// ya documentado: no pagar por buscar email de un lead cuya direccion ya se
// descarto.
//
// Docs: https://enformiongo.readme.io/reference/contact-enrichment-search
// Endpoint: POST https://devapi.enformion.com/Contact/Enrich
// Auth: headers galaxy-ap-name / galaxy-ap-password (Access Profile Name/Password
// del dashboard EnformionGO, seccion "Keys") + galaxy-search-type fijo.

const ENDPOINT = 'https://devapi.enformion.com/Contact/Enrich'
const SEARCH_TYPE = 'DevAPIContactEnrich'

export interface ContactEnrichInput {
  firstName: string | null
  lastName: string | null
  addr1: string | null
  addr2: string | null // Enformion espera "city, state" en addressLine2 (ver ejemplo de la doc)
}

export interface ContactEnrichResult {
  found: boolean
  email: string | null
  email_is_business: boolean | null
  email_validated: boolean | null // isValidated que devuelve el propio Enformion (no ZeroBounce)
  phone: string | null
  identity_score: number | null // 0-100, confianza del match de persona
  raw: unknown
  error?: string
}

export async function enrichContact(input: ContactEnrichInput): Promise<ContactEnrichResult> {
  const apName = process.env.ENFORMION_KEY_NAME
  const apPassword = process.env.ENFORMION_KEY_PASS
  if (!apName || !apPassword) {
    return {
      found: false, email: null, email_is_business: null, email_validated: null,
      phone: null, identity_score: null, raw: null,
      error: 'ENFORMION_KEY_NAME o ENFORMION_KEY_PASS no configuradas',
    }
  }

  // Best practice de la doc: al menos 2 de {Name, Phone, Address, Email}.
  // Acá siempre mandamos Name + Address (los 2 datos que ya tenemos de Sunbiz).
  if (!input.firstName || !input.lastName || !input.addr1) {
    return {
      found: false, email: null, email_is_business: null, email_validated: null,
      phone: null, identity_score: null, raw: null,
      error: 'faltan datos minimos: firstName, lastName o addr1',
    }
  }

  const body = {
    FirstName: input.firstName,
    LastName: input.lastName,
    Address: {
      addressLine1: input.addr1,
      addressLine2: input.addr2 ?? '',
    },
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'galaxy-ap-name': apName,
        'galaxy-ap-password': apPassword,
        'galaxy-search-type': SEARCH_TYPE,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text()
      return {
        found: false, email: null, email_is_business: null, email_validated: null,
        phone: null, identity_score: null, raw: null,
        error: `HTTP ${res.status}: ${txt.slice(0, 300)}`,
      }
    }

    const data = await res.json() as {
      person?: {
        emails?: { email: string; isValidated?: boolean; isBusiness?: boolean }[]
        phones?: { number: string; type?: string; isConnected?: boolean }[]
      }
      identityScore?: number
      isError?: boolean
      message?: string
      error?: { inputErrors?: string[]; warnings?: string[] }
    }

    if (data.isError) {
      return {
        found: false, email: null, email_is_business: null, email_validated: null,
        phone: null, identity_score: null, raw: data,
        error: data.message || (data.error?.inputErrors ?? []).join('; ') || 'Enformion devolvio isError:true',
      }
    }

    const emails = data.person?.emails ?? []
    // Preferimos un email personal (isBusiness:false) sobre uno generico de empresa;
    // si no hay ninguno marcado, tomamos el primero igual (mejor que nada para carta/email).
    const chosen = emails.find(e => e.isBusiness === false) ?? emails[0] ?? null
    const phones = data.person?.phones ?? []

    return {
      found: !!chosen,
      email: chosen?.email ?? null,
      email_is_business: chosen?.isBusiness ?? null,
      email_validated: chosen?.isValidated ?? null,
      phone: phones[0]?.number ?? null,
      identity_score: typeof data.identityScore === 'number' ? data.identityScore : null,
      raw: data,
    }
  } catch (e) {
    return {
      found: false, email: null, email_is_business: null, email_validated: null,
      phone: null, identity_score: null, raw: null,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

// Placeholder hasta confirmar el precio real del plan pago de EnformionGO
// (el trial gratis no lo muestra — revisar "Plans and Pricing" en el dashboard
// cuando se acabe el free tier). Se usa solo para el costo estimado que
// muestra el panel antes de disparar el enriquecimiento — no afecta el cobro
// real de Enformion.
export const ENFORMION_COST_PER_LEAD_USD = 0.10
