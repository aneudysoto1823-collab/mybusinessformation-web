import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { generateTotpSecret, generateTotpUri } from '@/lib/totp'
import { saveTotpSecret } from '@/lib/twofa'
import QRCode from 'qrcode'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// POST — genera nuevo secreto TOTP y devuelve QR + clave en texto
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = generateTotpSecret()
  const adminUser = process.env.ADMIN_USER ?? 'admin'
  const uri = generateTotpUri(secret, adminUser)
  const qrDataUrl = await QRCode.toDataURL(uri)

  await saveTotpSecret(secret)

  return NextResponse.json({ qrDataUrl, secret, uri })
}
