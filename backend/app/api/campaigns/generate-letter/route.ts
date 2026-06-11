import { NextRequest, NextResponse } from 'next/server'
import { generateNewBusinessLetter } from '@/lib/new-business-letter'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Florida entity type label a partir del company_type de Sunbiz
function entityLabel(companyType?: string): string {
  const map: Record<string, string> = {
    LLC:  'Florida LLC',
    CORP: 'Florida Corporation',
    PA:   'Florida P.A.',
    LTD:  'Florida Limited Partnership',
  }
  const key = (companyType || '').toUpperCase()
  return map[key] || (key ? `Florida ${key}` : 'Florida LLC')
}

// Formato largo "February 17, 2026". Date-only se parsea sin shift de timezone.
function formatLong(input?: string): string {
  if (!input) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(input)
  if (isNaN(d.getTime())) return input
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// POST /api/campaigns/generate-letter
// Body: { documentId, companyName, payUrl, registrationDate?, companyType? }
// Returns: PDF file
export async function POST(req: NextRequest) {
  // Admin-only — el generador produce PDFs con marca FBFC. Si quedara publico,
  // riesgo de phishing externo creando cartas falsas con nuestra marca.
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { documentId, companyName, payUrl, registrationDate, companyType, ownerName, address, city, zip } = body

  if (!documentId || !companyName || !payUrl) {
    return NextResponse.json({ error: 'Missing required fields: documentId, companyName, payUrl' }, { status: 400 })
  }

  const noticeDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateNewBusinessLetter({
      documentId,
      companyName,
      ownerName,
      address,
      city,
      zip,
      registrationDate: formatLong(registrationDate),
      noticeDate,
      entityType: entityLabel(companyType),
      payUrl,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-letter] PDF generation failed:', msg)
    return NextResponse.json({ error: `PDF generation failed: ${msg}` }, { status: 500 })
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="notice-${documentId}.pdf"`,
    },
  })
}
