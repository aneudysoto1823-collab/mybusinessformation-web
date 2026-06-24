// GET /api/email/validate?email=<email>
//
// Endpoint público (sin auth) llamado desde el form de checkout (onblur del
// campo email). Devuelve si el email es válido + razón si no lo es.
//
// Comportamiento depende del feature flag ZEROBOUNCE_ENABLED:
//   - false (default, modo dormido) → solo regex local, sin costo
//   - true → llama al SDK oficial de ZeroBounce (~$0.008/validación)
//
// Ver: backend/lib/zerobounce.ts y LOGICA_DE_NEGOCIO/27_verificacion_email_zerobounce.md
//
// Respuesta JSON:
//   { valid: boolean, reason?: string, source: 'dormant'|'regex'|'zerobounce' }

import { NextRequest, NextResponse } from 'next/server'
import { validateEmail } from '@/lib/zerobounce'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { valid: false, reason: 'Missing ?email param', source: 'regex' },
      { status: 400 },
    )
  }
  const result = await validateEmail(email)
  return NextResponse.json(result)
}
