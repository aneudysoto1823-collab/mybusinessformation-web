import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('document_id')?.trim().toUpperCase()

  if (!documentId) {
    return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
  }

  // 1. Check our prospective_companies table first
  try {
    const supabase = getSupabaseAdmin()
    const { data: existing } = await supabase
      .from('prospective_companies')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ source: 'database', company: existing })
    }
  } catch {
    // DB unavailable — fall through to Sunbiz
  }

  // 2. Fallback: scrape Sunbiz by document number
  try {
    const searchUrl = `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=DocumentNumber&inquiryDirectionType=ForwardList&masterDocumentNumber=${encodeURIComponent(documentId)}`

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) throw new Error('Sunbiz unavailable')

    const html = await res.text()

    // Extract company name from result link
    const nameMatch = html.match(/GetFilingInformation[^"]*"[^>]*>\s*([A-Z0-9][^<]{2,80}?)\s*<\/a>/i)
    const companyName = nameMatch ? nameMatch[1].trim() : null

    if (!companyName) {
      return NextResponse.json({ error: 'Document ID not found in Florida state records.' }, { status: 404 })
    }

    // Infer type from name suffix
    let companyType = 'LLC'
    if (/\b(corp|corporation|inc\.?|incorporated)\b/i.test(companyName)) companyType = 'CORP'
    else if (/\bp\.?a\.?\b/i.test(companyName)) companyType = 'PA'
    else if (/\bltd\.?\b/i.test(companyName)) companyType = 'LTD'

    return NextResponse.json({
      source: 'sunbiz',
      company: {
        document_id: documentId,
        company_name: companyName,
        company_type: companyType,
        owner_name: null,
        address: null,
        city: null,
        state: 'FL',
        zip: null,
        email: null,
        status: 'new',
      },
    })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    return NextResponse.json(
      { error: isTimeout ? 'State database timeout — try again in a moment.' : 'Could not retrieve company data.' },
      { status: 503 }
    )
  }
}
