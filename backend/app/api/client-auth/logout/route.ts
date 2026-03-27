import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(
    new URL('/client-portal', process.env.NEXT_PUBLIC_BASE_URL || 'https://mybusinessformation-web.vercel.app')
  )
  response.cookies.set('client_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
