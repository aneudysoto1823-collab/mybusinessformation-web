import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  generateOperatingAgreement,
  generateEINSS4,
  generateBOIFiling,
  generateArticlesOfOrganization,
  generateDBA,
  type OrderForPdf,
} from '@/lib/pdf-generator'
import { decryptEinTaxId, formatEinTaxId } from '@/lib/ein-tax-id'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

function safeName(name: string): string {
  return (name || 'document').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()
}

const GENERATORS: Record<string, (order: OrderForPdf) => Promise<Buffer>> = {
  'operating-agreement': generateOperatingAgreement,
  'ein-ss4': generateEINSS4,
  'boi-filing': generateBOIFiling,
  'articles-of-organization': generateArticlesOfOrganization,
  'dba': generateDBA,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; endpoint: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, endpoint } = await params

  const generate = GENERATORS[endpoint]
  if (!generate) {
    return NextResponse.json({ error: 'Unknown document type' }, { status: 400 })
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('Order')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // El SSN/ITIN se guarda encriptado (einTaxIdEnc) — se desencripta acá porque
  // esta ruta ya exige sesión de admin (verifyAdmin arriba). Nunca se expone
  // al cliente ni se guarda desencriptado en ningún otro lugar.
  const decryptedDigits = decryptEinTaxId(order.einTaxIdEnc)
  const orderForPdf: OrderForPdf = {
    ...order,
    einTaxId: decryptedDigits ? formatEinTaxId(decryptedDigits) : null,
  }

  const buffer = await generate(orderForPdf)
  const inline = request.nextUrl.searchParams.get('view') === '1'
  const filename = `${endpoint}-${safeName(order.companyName)}.pdf`
  const disposition = inline
    ? `inline; filename="${filename}"`
    : `attachment; filename="${filename}"`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': 'no-store',
    },
  })
}
