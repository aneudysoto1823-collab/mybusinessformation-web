// ZeroBounce — validación avanzada de emails.
//
// Wrapper sobre el SDK OFICIAL @zerobounce/zero-bounce-sdk (mantenido por
// ZeroBounce). NO escribimos cliente HTTP a mano — usamos lo que ellos
// publican y mantienen.
//
// DORMIDO por defecto (ZEROBOUNCE_ENABLED !== 'true').
// En dormido: solo regex local, source='dormant', sin consumir crédito.
// Activo: SDK valida MX + SMTP probe + catch-all + disposable + spam-trap.
//
// Para activar en producción:
//   1. setear ZEROBOUNCE_ENABLED=true en Vercel env vars (Production)
//   2. setear ZEROBOUNCE_API_KEY=<tu-key>
//   3. Redeploy
//
// Ver doc: LOGICA_DE_NEGOCIO/27_verificacion_email_zerobounce.md

import ZeroBounceSDK from '@zerobounce/zero-bounce-sdk'

export type EmailValidationResult = {
  valid: boolean
  reason?: string
  source: 'dormant' | 'regex' | 'zerobounce'
  raw?: unknown
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function regexCheck(email: string): EmailValidationResult {
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, reason: 'Invalid email format', source: 'regex' }
  }
  return { valid: true, source: 'regex' }
}

// SDK singleton — se inicializa lazy en la primera llamada activa.
let _sdk: ZeroBounceSDK | null = null
function getSdk(apiKey: string): ZeroBounceSDK {
  if (_sdk) return _sdk
  _sdk = new ZeroBounceSDK()
  _sdk.init(apiKey)
  return _sdk
}

/**
 * Valida un email. Devuelve `valid` + razón si no, y `source` para saber
 * cómo se validó (útil para debug y para mostrar mensajes al usuario).
 *
 * Decisión sobre qué status ZeroBounce considera "válido" para aceptar:
 *   - VALID, CATCH_ALL, UNKNOWN → aceptamos (catch-all y unknown son
 *     casos donde el servidor no confirma 100% pero el email puede ser
 *     real; rechazar bloquearía a usuarios legítimos)
 *   - INVALID, SPAMTRAP, ABUSE, DO_NOT_MAIL → rechazamos
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const cleaned = (email || '').trim().toLowerCase()
  if (!cleaned) return { valid: false, reason: 'Email is required', source: 'regex' }

  const enabled = process.env.ZEROBOUNCE_ENABLED === 'true'
  const apiKey = process.env.ZEROBOUNCE_API_KEY
  if (!enabled || !apiKey) {
    const r = regexCheck(cleaned)
    return { ...r, source: 'dormant' }
  }

  try {
    const sdk = getSdk(apiKey)
    const data = await sdk.validateEmail(cleaned, { timeout: 8 })
    if (!data) {
      // SDK devolvió undefined: tratamos como error transient, NO bloqueamos al cliente
      const r = regexCheck(cleaned)
      return { ...r, source: 'regex' }
    }
    const status = String(data.status || '').toLowerCase()
    const isValid = status === 'valid' || status === 'catch-all' || status === 'unknown'
    return {
      valid: isValid,
      reason: isValid ? undefined : `${status}${data.sub_status ? ` (${data.sub_status})` : ''}`,
      source: 'zerobounce',
      raw: data,
    }
  } catch {
    // Network error / timeout / 5xx — fallback a regex (no bloqueamos al cliente)
    const r = regexCheck(cleaned)
    return { ...r, source: 'regex' }
  }
}

/**
 * Conecta ZeroBounce a los emails que trae Enformion (auditoría de marketing
 * 2026-09-13/14, punto 2 — nunca se había hecho). Enformion solo reporta si
 * SU búsqueda encontró un email "razonable" (isValidated propio, ver
 * lib/enformion.ts) — no es una prueba real de que el buzón exista y acepte
 * correo. ZeroBounce sí lo es (MX + SMTP probe).
 *
 * Si ZEROBOUNCE_ENABLED no está activo, `validateEmail()` cae a un chequeo
 * de formato (source 'dormant'/'regex') que NO es una prueba real de
 * entregabilidad — en ese caso no reemplazamos el dato de Enformion, dejamos
 * el `isValidated` que ya traía (comportamiento idéntico al de antes de
 * conectar esto). Solo cuando `source==='zerobounce'` hubo una prueba real.
 */
export async function validateEnformionEmail(
  email: string,
  enformionValidated: boolean | null
): Promise<{ validated: boolean | null; source: 'zerobounce' | 'enformion' }> {
  const result = await validateEmail(email)
  if (result.source === 'zerobounce') {
    return { validated: result.valid, source: 'zerobounce' }
  }
  return { validated: enformionValidated, source: 'enformion' }
}
