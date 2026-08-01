// SSN/ITIN del responsible party para el EIN — dato sensible, se guarda
// encriptado en Order.einTaxIdEnc (ver lib/encryption.ts) y solo se
// desencripta server-side en el admin al generar el SS-4 (ver
// app/api/proxy/documents/[orderId]/[endpoint]/route.ts).
import { encrypt, decrypt } from './encryption'

// Normaliza a 9 dígitos y encripta. Devuelve null si no aplica (idType
// 'none' o el valor no tiene 9 dígitos) — nunca guarda un valor a medias.
export function encryptEinTaxId(idType: string | null | undefined, raw: string | null | undefined): string | null {
  if (idType !== 'ssn' && idType !== 'itin') return null
  const digits = String(raw ?? '').replace(/[^0-9]/g, '')
  if (digits.length !== 9) return null
  return encrypt(digits)
}

export function decryptEinTaxId(enc: string | null | undefined): string | null {
  if (!enc) return null
  try { return decrypt(enc) } catch (e) {
    console.error('[ein-tax-id] decrypt error (non-fatal):', e)
    return null
  }
}

export function formatEinTaxId(digits: string): string {
  return digits.length === 9 ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : digits
}
