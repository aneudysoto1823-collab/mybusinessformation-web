// GET /api/sunbiz/company?document_number=L23000123456
//
// Lookup PÚBLICO de empresa de Florida en Turso (3.5M, datos de registro
// público) por número de documento. Usado por el checkout del cliente
// (/servicios/checkout) para autollenar los datos de la empresa con solo el
// número de registro. Datos de registro público — no requiere auth.

import { NextRequest, NextResponse } from 'next/server'
import { lookupCompanyByDocument } from '@/lib/turso'

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
  const documentNumber = req.nextUrl.searchParams.get('document_number')?.trim()
  if (!documentNumber || documentNumber.length < 5) {
    return NextResponse.json({ error: 'document_number is required' }, { status: 400 })
  }

  try {
    const company = await lookupCompanyByDocument(documentNumber)
    if (!company) {
      return NextResponse.json({ found: false }, { status: 404 })
    }
    const STATUS_LABELS: Record<string, string> = { A: 'ACTIVE', I: 'INACTIVE', D: 'DISSOLVED' }
    const statusLabel = company.status ? (STATUS_LABELS[company.status.toUpperCase()] || company.status) : null

    return NextResponse.json({
      found: true,
      company: {
        ...company,
        status: statusLabel,
        entity_type_normalized: normalizeType(company.entity_type),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sunbiz/company]', msg)
    return NextResponse.json({ error: 'Lookup failed', detail: msg }, { status: 500 })
  }
}
