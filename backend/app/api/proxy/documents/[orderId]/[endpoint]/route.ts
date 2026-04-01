import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { backendFetch } from '@/lib/backend'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; endpoint: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orderId, endpoint } = await params
  const res = await backendFetch(`/api/documents/${orderId}/${endpoint}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Document not found' }, { status: res.status })
  }
  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${endpoint}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
