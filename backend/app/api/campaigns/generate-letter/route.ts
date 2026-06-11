import { NextRequest, NextResponse } from 'next/server'
import { generateNewBusinessLetter } from '@/lib/new-business-letter'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST /api/campaigns/generate-letter
// Body: { documentId, ownerName, companyName, address, city, zip, payUrl }
// Returns: PDF file
export async function POST(req: NextRequest) {
  // Admin-only — el generador produce PDFs con marca FBFC. Si quedara publico,
  // riesgo de phishing externo creando cartas falsas con nuestra marca.
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { documentId, ownerName, companyName, address, city, zip, payUrl } = body

  if (!documentId || !ownerName || !companyName || !payUrl) {
    return NextResponse.json({ error: 'Missing required fields: documentId, ownerName, companyName, payUrl' }, { status: 400 })
  }

  const now = new Date()
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
  const respondBy = new Date(now)
  respondBy.setDate(respondBy.getDate() + 21)

  // Total fee = sum of all 3 services
  const totalFee = '$360.00'

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateNewBusinessLetter({
      documentId,
      ownerName,
      companyName,
      address,
      city,
      zip,
      noticeDate: fmt(now),
      respondBy: fmt(respondBy),
      totalFee,
      payUrl,
      year: now.getFullYear(),
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
