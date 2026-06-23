import { NextRequest, NextResponse } from 'next/server'

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

// GET: usado por el botón "Cerrar Sesión" del portal. Redirige al HOME (no al
// viejo landing de login), preservando el idioma vía ?lang.
export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://opabiz.com'
  const home = request.nextUrl.searchParams.get('lang') === 'es' ? '/es' : '/'
  return clearCookie(NextResponse.redirect(new URL(home, base)))
}

// POST: usado por el logout del home (fetch). Solo borra la cookie y devuelve
// JSON — el front refresca el header sin recargar la página entera.
export async function POST() {
  return clearCookie(NextResponse.json({ success: true }))
}
