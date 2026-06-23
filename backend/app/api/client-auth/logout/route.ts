import { NextResponse } from 'next/server'

function clearCookie(response: NextResponse) {
  response.cookies.set('client_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}

// GET: usado por links del portal (redirige a la página de login).
export async function GET() {
  return clearCookie(NextResponse.redirect(
    new URL('/client-portal', process.env.NEXT_PUBLIC_BASE_URL || 'https://opabiz.com')
  ))
}

// POST: usado por el logout del home (fetch). Solo borra la cookie y devuelve
// JSON — el front refresca el header sin recargar la página entera.
export async function POST() {
  return clearCookie(NextResponse.json({ success: true }))
}
