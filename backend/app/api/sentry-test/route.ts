// ENDPOINT TEMPORAL DE SMOKE TEST DE SENTRY
// Borrar después de validar que Sentry captura el error en producción.
// Disparar visitando /api/sentry-test desde el browser.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const testTag = `[sentry-test-${new Date().toISOString().slice(0, 10)}]`
  throw new Error(`${testTag} Smoke test intencional desde /api/sentry-test`)
  // El return nunca se alcanza, pero TypeScript lo necesita
  return NextResponse.json({ ok: false })
}
