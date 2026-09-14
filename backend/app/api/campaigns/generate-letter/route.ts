import { NextRequest, NextResponse } from 'next/server'
import { generateNewBusinessLetter, entityLabelForLetter, formatLongDateForLetter, type Lang } from '@/lib/new-business-letter'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST /api/campaigns/generate-letter
// Body: { documentId, companyName, payUrl, registrationDate?, companyType?, lang? }
// Returns: PDF file
export async function POST(req: NextRequest) {
  // Admin-only — el generador produce PDFs con marca FBFC. Si quedara publico,
  // riesgo de phishing externo creando cartas falsas con nuestra marca.
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { documentId, companyName, payUrl, registrationDate, companyType, ownerName, address, city, zip } = body
  const lang: Lang = body.lang === 'es' ? 'es' : 'en'

  if (!documentId || !companyName || !payUrl) {
    return NextResponse.json({ error: 'Missing required fields: documentId, companyName, payUrl' }, { status: 400 })
  }

  const noticeDate = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateNewBusinessLetter({
      documentId,
      companyName,
      ownerName,
      address,
      city,
      zip,
      registrationDate: formatLongDateForLetter(registrationDate, lang),
      noticeDate,
      entityType: entityLabelForLetter(companyType, lang),
      payUrl,
      lang,
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
