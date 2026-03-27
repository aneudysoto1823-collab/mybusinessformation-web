import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { user, password } = await request.json()

  if (
    user === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    })
    return response
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
