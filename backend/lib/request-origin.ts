// Resuelve el origin de una request contra una allowlist fija — NUNCA confiar
// en el header `Origin` crudo para armar un `return_url` de Stripe ni para
// decidir lógica de negocio (ej. qué marca/precio aplica). Sin esto, una
// llamada directa al endpoint (curl/Postman, sin pasar por el navegador) con
// un `Origin` falso podía: (a) lograr que Stripe redirija al comprador a un
// dominio ajeno tras pagar (open redirect, con el session_id real en la URL),
// y (b) en /api/checkout/embedded-services, forzar el precio de la marca
// equivocada (ej. EIN a $99 en vez de $161 fingiendo Origin: opabiz.com desde
// una compra de mybusinessformation.com). Hallazgo de auditoría 2026-08-17.
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = new Set([
  'https://opabiz.com',
  'https://www.opabiz.com',
  'https://mybusinessformation.com',
  'https://www.mybusinessformation.com',
  'http://localhost:3000',
])

/**
 * Devuelve el origin de la request SOLO si está en la allowlist; si no
 * (ausente, falsificado, o un dominio ajeno), devuelve `fallback`.
 */
export function resolveOrigin(req: NextRequest, fallback: string = 'https://opabiz.com'): string {
  const origin = req.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin
  return fallback
}

/** Marca derivada del origin YA VALIDADO (ver resolveOrigin) — nunca del header crudo. */
export function brandFromOrigin(origin: string): 'opabiz' | 'fbfc' {
  return origin.includes('mybusinessformation.com') ? 'fbfc' : 'opabiz'
}
