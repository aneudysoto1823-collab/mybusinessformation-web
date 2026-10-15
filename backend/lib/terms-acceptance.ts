// Registro de la aceptación de Términos (2026-10-09, pedido founder).
//
// La casilla de Términos de cada checkout solo bloqueaba el pago en pantalla;
// no quedaba constancia de cuándo ni qué aceptó el cliente. Ante un contracargo
// ("no sabía que se renovaba"), Stripe pide evidencia: fecha y hora, IP y el
// texto exacto aceptado. Se guarda en Order.termsAcceptances (jsonb, lista:
// una orden puede acumular varias, ej. la compra original y una reactivación).
// Migración: supabase_migration_terms_acceptances.sql.

import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from './supabase'

export type TermsContext = 'formation' | 'services' | 'reactivation'

export interface TermsAcceptance {
  at: string
  context: TermsContext
  text: string
  ip: string | null
  userAgent: string | null
  // Solo en reactivaciones: qué servicio se reactivó.
  service?: string
  // Aceptada en la casilla del Embedded Checkout de Stripe (lib/checkout-terms.ts).
  stripeSessionId?: string
}

export function requestIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || null
  return req.headers.get('x-real-ip')
}

// No bloqueante: si falla (ej. la migración no corrió), se loguea y sigue.
export async function appendTermsAcceptance(
  orderId: string,
  entry: Omit<TermsAcceptance, 'at'>,
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('Order').select('termsAcceptances').eq('id', orderId).maybeSingle()
    if (error) throw error
    if (!data) return false
    const list: TermsAcceptance[] = Array.isArray(data.termsAcceptances) ? data.termsAcceptances : []
    // Stripe reintenta webhooks: la misma sesión se registra una sola vez.
    if (entry.stripeSessionId && list.some(a => a.stripeSessionId === entry.stripeSessionId)) return true
    list.push({ ...entry, text: entry.text.slice(0, 3000), at: new Date().toISOString() })
    const { error: upErr } = await supabase.from('Order').update({ termsAcceptances: list }).eq('id', orderId)
    if (upErr) throw upErr
    return true
  } catch (err) {
    console.error('[terms-acceptance] no se pudo registrar la aceptación (non-fatal):', orderId, err instanceof Error ? err.message : err)
    return false
  }
}
