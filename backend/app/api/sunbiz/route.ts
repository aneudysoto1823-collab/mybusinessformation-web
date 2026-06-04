import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('document_id')?.trim().toUpperCase()

  if (!documentId) {
    return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Consulta ambas tablas en paralelo para minimizar latencia
  const [prospectiveResult, sunbizResult] = await Promise.all([
    supabase
      .from('prospective_companies')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle(),
    supabase
      .from('sunbiz_corps')
      .select('document_number, entity_name, entity_type, status, filing_date, principal_address, principal_city, principal_state, principal_zip, registered_agent_name')
      .eq('document_number', documentId)
      .maybeSingle(),
  ])

  const prospective = prospectiveResult.data
  const sunbiz = sunbizResult.data

  if (!prospective && !sunbiz) {
    return NextResponse.json(
      { error: 'Document ID not found in Florida state records.' },
      { status: 404 }
    )
  }

  // Normaliza el tipo de entidad al formato que usa el auto-relleno del formulario
  const rawType = prospective?.company_type || sunbiz?.entity_type || ''
  let companyType = rawType
  if (/llc|limited liability/i.test(rawType))         companyType = 'LLC'
  else if (/corp|corporation|inc\b|incorporated/i.test(rawType)) companyType = 'CORP'
  else if (/\bp\.?a\.?\b/i.test(rawType))             companyType = 'PA'
  else if (/\bltd\.?\b/i.test(rawType))               companyType = 'LTD'

  // prospective_companies gana en datos de marketing (owner, email)
  // sunbiz_corps aporta datos oficiales de FL (dirección, agente, estado)
  const company = {
    document_id:      documentId,
    company_name:     prospective?.company_name || sunbiz?.entity_name || null,
    company_type:     companyType || null,
    status:           sunbiz?.status || null,
    owner_name:       prospective?.owner_name || null,
    address:          prospective?.address || sunbiz?.principal_address || null,
    city:             prospective?.city    || sunbiz?.principal_city    || null,
    state:            prospective?.state   || sunbiz?.principal_state   || 'FL',
    zip:              prospective?.zip     || sunbiz?.principal_zip     || null,
    email:            prospective?.email   || null,
    registered_agent: sunbiz?.registered_agent_name || null,
    filing_date:      sunbiz?.filing_date  || null,
  }

  const source = prospective && sunbiz ? 'both' : prospective ? 'database' : 'sunbiz_corps'

  return NextResponse.json({ source, company })
}
