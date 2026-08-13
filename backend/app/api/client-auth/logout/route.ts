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
// viejo landing de login), preservando el idioma vía ?lang. Usa el origin de
// la request (no un BASE_URL fijo a opabiz.com) para que un cliente de
// mybusinessformation.com (separación de dominios 2026-08-13) vuelva a SU
// home, no al de OpaBiz.
export async function GET(request: NextRequest) {
  const home = request.nextUrl.searchParams.get('lang') === 'es' ? '/es' : '/'
  return clearCookie(NextResponse.redirect(new URL(home, request.nextUrl.origin)))
}

// POST: usado por el logout del home (fetch). Solo borra la cookie y devuelve
// JSON — el front refresca el header sin recargar la página entera.
export async function POST() {
  return clearCookie(NextResponse.json({ success: true }))
}
