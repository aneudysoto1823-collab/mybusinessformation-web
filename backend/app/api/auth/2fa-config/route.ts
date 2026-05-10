import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getTwoFAConfig, updateTwoFAConfig } from '@/lib/twofa'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const config = await getTwoFAConfig()
  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const fields: Record<string, boolean> = {}
  if (typeof body.totp_enabled === 'boolean') fields.totp_enabled = body.totp_enabled
  if (typeof body.email_enabled === 'boolean') fields.email_enabled = body.email_enabled
  await updateTwoFAConfig(fields)
  return NextResponse.json({ ok: true })
}
