// Lob — verificación de direcciones US (USPS deliverability).
//
// Wrapper sobre el SDK OFICIAL @lob/lob-typescript-sdk. NO escribimos
// cliente HTTP a mano — usamos lo que Lob publica y mantiene.
//
// LIVE por default (LOB_ENABLED !== 'false'). Si la key local es 'test_'
// el SDK devuelve respuestas dummies sin consumir crédito. En Vercel
// Production debe estar la key 'live_'.
//
// Decisiones de seguridad anti-bug "form frizado":
//   - Timeout 5s con AbortController (jamás cuelga el form)
//   - try/catch total → cualquier error devuelve {ok:true, source:'error'}
//     que el frontend interpreta como "dejá pasar" (no bloquea al cliente)
//   - Si la API key falta o el flag está false → {ok:true, source:'no-key'}
//
// Ver doc: LOGICA_DE_NEGOCIO/28_verificacion_direccion_lob.md

import { UsVerificationsApi, Configuration, UsVerificationsWritable } from '@lob/lob-typescript-sdk'

export type AddressInput = {
  primary_line: string       // Street Address
  secondary_line?: string    // Apt / Suite
  city?: string
  state?: string
  zip_code?: string
}

export type AddressVerificationResult = {
  ok: boolean
  /** Lo que devuelve Lob como deliverability. */
  deliverability?: 'deliverable' | 'deliverable_unnecessary_unit' | 'deliverable_incorrect_unit' | 'deliverable_missing_unit' | 'undeliverable'
  /** Si Lob sugiere una versión normalizada distinta a la entrada, va acá. */
  suggested?: {
    primary_line: string
    secondary_line?: string
    city: string
    state: string
    zip_code: string
  }
  /** Cómo se resolvió: 'lob' (real), 'no-key' (flag off / sin key), 'error' (Lob falló) */
  source: 'lob' | 'no-key' | 'error' | 'timeout' | 'not-us'
  /** Para debug. */
  raw?: unknown
}

let _api: UsVerificationsApi | null = null
function getApi(apiKey: string): UsVerificationsApi {
  if (_api) return _api
  const config = new Configuration({ username: apiKey })
  _api = new UsVerificationsApi(config)
  return _api
}

/**
 * Verifica una dirección US contra USPS via Lob.
 *
 * Devuelve siempre con `ok` definido. NUNCA throws — los errores se
 * capturan y degradan a `source='error'` con `ok=true` (= dejá pasar al
 * cliente, no rompas el form).
 */
export async function verifyAddress(addr: AddressInput): Promise<AddressVerificationResult> {
  const enabled = process.env.LOB_ENABLED !== 'false'
  const apiKey = process.env.LOB_SECRET_KEY
  if (!enabled || !apiKey) {
    return { ok: true, source: 'no-key' }
  }

  if (!addr.primary_line || addr.primary_line.trim().length === 0) {
    return { ok: true, source: 'no-key' }
  }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 5000)
  try {
    const api = getApi(apiKey)
    const writable: UsVerificationsWritable = {
      primary_line: addr.primary_line.trim(),
      secondary_line: addr.secondary_line?.trim() || undefined,
      city: addr.city?.trim() || undefined,
      state: addr.state?.trim() || undefined,
      zip_code: addr.zip_code?.trim() || undefined,
    }
    const result = await api.verifySingle(writable, undefined, { signal: ctrl.signal })
    clearTimeout(timeout)

    const deliverability = result.deliverability as AddressVerificationResult['deliverability']

    const suggested = {
      primary_line: result.primary_line || writable.primary_line,
      secondary_line: result.secondary_line || undefined,
      city: result.components?.city || writable.city || '',
      state: result.components?.state || writable.state || '',
      zip_code: result.components?.zip_code || writable.zip_code || '',
    }

    return {
      ok: deliverability !== 'undeliverable',
      deliverability,
      suggested,
      source: 'lob',
      raw: result,
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))
    return { ok: true, source: isAbort ? 'timeout' : 'error' }
  }
}
