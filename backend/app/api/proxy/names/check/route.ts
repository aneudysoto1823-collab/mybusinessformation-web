import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { backendFetch } from '@/lib/backend'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = request.nextUrl
  const names = searchParams.get('names') ?? ''
  const res = await backendFetch(`/api/names/check?names=${encodeURIComponent(names)}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
