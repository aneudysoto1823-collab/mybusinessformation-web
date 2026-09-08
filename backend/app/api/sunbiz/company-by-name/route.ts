// GET /api/sunbiz/company-by-name?name=ACME%20LLC
//
// Lookup PÚBLICO de empresa de Florida en Turso (3.5M, datos de registro
// público) por nombre exacto. Usado por el checkout del cliente
// (/servicios/checkout) para autocompletar el Document Number + dirección
// cuando el cliente no tiene su número a mano y en cambio escribe el nombre
// legal de la empresa. Solo devuelve resultado si hay exactamente UN match
// (ver lookupCompanyByName) — un nombre ambiguo no autocompleta nada, el
// cliente sigue llenando a mano. Datos de registro público — no requiere auth.

import { NextRequest, NextResponse } from 'next/server'
import { lookupCompanyByName } from '@/lib/turso'

export const dynamic = 'force-dynamic'

function normalizeType(raw: string | null): string | null {
  if (!raw) return null
  if (/llc|limited liability/i.test(raw)) return 'LLC'
  if (/corp|incorporated|\binc\b/i.test(raw)) return 'CORP'
  if (/\bp\.?a\.?\b/i.test(raw)) return 'PA'
  if (/\bltd\.?\b/i.test(raw)) return 'LTD'
  return raw
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name || name.length < 3) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  try {
    const company = await lookupCompanyByName(name)
    if (!company) {
      return NextResponse.json({ found: false }, { status: 404 })
    }
    return NextResponse.json({
      found: true,
      company: {
        ...company,
        status: 'ACTIVE',
        entity_type_normalized: normalizeType(company.entity_type),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sunbiz/company-by-name]', msg)
    return NextResponse.json({ error: 'Lookup failed', detail: msg }, { status: 500 })
  }
}
