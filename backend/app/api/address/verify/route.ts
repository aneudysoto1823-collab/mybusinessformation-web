// POST /api/address/verify
//
// Endpoint publico (sin auth) llamado desde el form de checkout al hacer
// click en Next de cada paso que contenga direcciones US (Negocio fisico,
// Registered Agent, Mailing, Members). Devuelve si Lob considera la
// direccion deliverable + sugerencia si la hay.
//
// Comportamiento depende del feature flag LOB_ENABLED:
//   - true (default) → llama al SDK oficial de Lob (consume credito en LIVE)
//   - 'false' → no llama, devuelve source='no-key' (degradacion silenciosa)
//
// El frontend interpreta el resultado:
//   - ok=true + source='lob' + sin suggested diferente → no popup, pasa
//   - ok=true + suggested diferente → popup "Use Entered / Use Suggested"
//   - ok=false (undeliverable) → popup "not found" + Use Entered / Re-enter
//   - source='no-key' | 'error' | 'timeout' → pasa silencioso (no bloquea)
//
// Ver: backend/lib/lob.ts y LOGICA_DE_NEGOCIO/28_verificacion_direccion_lob.md
//
// Body JSON:
//   { primary_line, secondary_line?, city?, state?, zip_code? }
//
// Respuesta JSON:
//   { ok, deliverability?, suggested?, source, raw? }

import { NextRequest, NextResponse } from 'next/server'
import { verifyAddress, AddressInput } from '@/lib/lob'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: AddressInput
  try {
    body = await request.json() as AddressInput
  } catch {
    return NextResponse.json(
      { ok: true, source: 'error', reason: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  if (!body || typeof body.primary_line !== 'string') {
    return NextResponse.json(
      { ok: true, source: 'no-key', reason: 'Missing primary_line' },
      { status: 200 },
    )
  }

  const result = await verifyAddress(body)
  return NextResponse.json(result)
}
