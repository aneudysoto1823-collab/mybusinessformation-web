// Google Address Validation API — Bloque 3 del sistema de marketing (doc 31).
// Solo dirección: NO buscamos email (Enformion descartado 2026-07-16 por costo).
//
// Costo: 1,000 llamadas/mes GRATIS (Free Tier permanente, no depende del trial).
// Después: $25 por cada 1,000 adicionales prorrateado = $0.025/lookup.
// Docs: https://developers.google.com/maps/documentation/address-validation

const ENDPOINT = 'https://addressvalidation.googleapis.com/v1:validateAddress'

export interface AddressInput {
  addr1: string | null
  addr2?: string | null
  city: string | null
  state: string | null
  zip: string | null
  country?: string | null
}

export interface ValidationResult {
  is_valid: boolean                 // pasa nuestros filtros de calidad para carta
  address_type: 'residential' | 'commercial' | 'poBox' | 'unknown'
  granularity: string | null        // ROUTE, PREMISE, SUB_PREMISE, etc.
  address_complete: boolean
  has_unconfirmed: boolean
  has_inferred: boolean
  raw: unknown                      // respuesta cruda de Google para debugging
  error?: string                    // si la API falló, guardamos el motivo
}

export async function validateAddress(input: AddressInput): Promise<ValidationResult> {
  const key = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY
  if (!key) {
    return {
      is_valid: false, address_type: 'unknown', granularity: null,
      address_complete: false, has_unconfirmed: false, has_inferred: false,
      raw: null, error: 'GOOGLE_ADDRESS_VALIDATION_API_KEY no configurada',
    }
  }

  const addressLines = [input.addr1, input.addr2].filter(Boolean) as string[]
  if (addressLines.length === 0 || !input.city || !input.state) {
    return {
      is_valid: false, address_type: 'unknown', granularity: null,
      address_complete: false, has_unconfirmed: false, has_inferred: false,
      raw: null, error: 'direccion incompleta: falta addr1, city o state',
    }
  }

  const body = {
    address: {
      addressLines,
      locality: input.city,
      administrativeArea: input.state,
      postalCode: input.zip ?? '',
      regionCode: (input.country && input.country.length === 2) ? input.country : 'US',
    },
  }

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text()
      return {
        is_valid: false, address_type: 'unknown', granularity: null,
        address_complete: false, has_unconfirmed: false, has_inferred: false,
        raw: null, error: `HTTP ${res.status}: ${txt.slice(0, 200)}`,
      }
    }

    const data = await res.json() as {
      result?: {
        verdict?: {
          inputGranularity?: string
          validationGranularity?: string
          hasReplacedComponents?: boolean
          hasInferredComponents?: boolean
          addressComplete?: boolean
          hasUnconfirmedComponents?: boolean
          possibleNextAction?: 'ACCEPT' | 'CONFIRM' | 'FIX' | string
        }
        metadata?: { business?: boolean; residential?: boolean; poBox?: boolean }
      }
    }

    const verdict = data.result?.verdict ?? {}
    const meta = data.result?.metadata ?? {}
    const granularity = verdict.validationGranularity ?? null
    const addressComplete = verdict.addressComplete === true
    const hasUnconfirmed = verdict.hasUnconfirmedComponents === true
    const hasInferred = verdict.hasInferredComponents === true
    const nextAction = verdict.possibleNextAction ?? null

    // Criterio de "direccion buena para carta": Google recomienda `possibleNextAction === 'ACCEPT'`
    // (docs oficiales — significa que la direccion es aceptable aunque tenga componentes inferidos
    // menores). El fallback para respuestas sin next_action es: completa + granularity al nivel
    // calle o mas fino + sin componentes no confirmados.
    const goodGranularities = new Set(['ROUTE', 'PREMISE', 'PREMISE_PROXIMITY', 'SUB_PREMISE'])
    const isValid = nextAction
      ? (nextAction === 'ACCEPT' && addressComplete)
      : (addressComplete && !hasUnconfirmed && goodGranularities.has(granularity ?? ''))

    let addressType: ValidationResult['address_type'] = 'unknown'
    if (meta.poBox) addressType = 'poBox'
    else if (meta.business) addressType = 'commercial'
    else if (meta.residential) addressType = 'residential'

    return {
      is_valid: isValid,
      address_type: addressType,
      granularity,
      address_complete: addressComplete,
      has_unconfirmed: hasUnconfirmed,
      has_inferred: hasInferred,
      raw: { verdict, metadata: meta, possibleNextAction: nextAction, formattedAddress: (data.result as { address?: { formattedAddress?: string } })?.address?.formattedAddress ?? null },
    }
  } catch (e) {
    return {
      is_valid: false, address_type: 'unknown', granularity: null,
      address_complete: false, has_unconfirmed: false, has_inferred: false,
      raw: null, error: e instanceof Error ? e.message : String(e),
    }
  }
}

// Costo unitario despues del free tier: $25 por cada 1,000 requests = $0.025/lookup.
// Primeras 1,000 llamadas/mes: gratis (Free Tier permanente).
export const GOOGLE_ADDR_COST_PER_LEAD_USD = 0.025
