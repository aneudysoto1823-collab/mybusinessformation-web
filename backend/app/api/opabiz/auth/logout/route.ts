import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('opabiz_session', '', { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 0, path: '/' })
  return response
}
