// GET /api/admin/sunbiz-lookup?document_number=L23000123456
//
// Lookup de empresa de Florida en Turso (3.5M registros) por número de
// documento. Solo admin autenticado. Usado por el formulario autollenado de
// órdenes de servicios en el panel admin.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { lookupCompanyByDocument } from '@/lib/turso'

export const dynamic = 'force-dynamic'

// Normaliza el tipo de entidad al formato que usa el form (LLC / CORP)
function normalizeType(raw: string | null): string | null {
  if (!raw) return null
  if (/llc|limited liability/i.test(raw)) return 'LLC'
  if (/corp|incorporated|\binc\b/i.test(raw)) return 'CORP'
  if (/\bp\.?a\.?\b/i.test(raw)) return 'PA'
  if (/\bltd\.?\b/i.test(raw)) return 'LTD'
  return raw
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session?.value || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documentNumber = request.nextUrl.searchParams.get('document_number')?.trim()
  if (!documentNumber) {
    return NextResponse.json({ error: 'document_number is required' }, { status: 400 })
  }

  try {
    const company = await lookupCompanyByDocument(documentNumber)
    if (!company) {
      return NextResponse.json({ found: false }, { status: 404 })
    }
    // status en Turso es un código de 1 letra ('A' = ACTIVE). Lo hacemos legible.
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
    console.error('[admin/sunbiz-lookup]', msg)
    return NextResponse.json({ error: 'Lookup failed', detail: msg }, { status: 500 })
  }
}
