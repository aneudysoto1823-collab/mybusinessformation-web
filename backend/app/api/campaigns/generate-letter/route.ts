import { NextRequest, NextResponse } from 'next/server'
import { generateNewBusinessLetter } from '@/lib/new-business-letter'

export const dynamic = 'force-dynamic'

// POST /api/campaigns/generate-letter
// Body: { documentId, ownerName, companyName, address, city, zip, payUrl }
// Returns: PDF file
export async function POST(req: NextRequest) {
  const body = await req.json()

  const { documentId, ownerName, companyName, address, city, zip, payUrl } = body

  if (!documentId || !ownerName || !companyName || !address || !city || !zip || !payUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const now = new Date()
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
  const respondBy = new Date(now)
  respondBy.setDate(respondBy.getDate() + 21)

  // Total fee = sum of all 3 services
  const totalFee = '$360.00'

  const pdfBytes = await generateNewBusinessLetter({
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

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="notice-${documentId}.pdf"`,
    },
  })
}
