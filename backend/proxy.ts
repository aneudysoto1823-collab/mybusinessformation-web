import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, verifyPendingToken } from '@/lib/session'
import { verifyEmployeeToken } from '@/lib/opabiz-session'

// Países de habla hispana (ISO 3166-1 alpha-2, códigos que manda
// x-vercel-ip-country) — LATAM + España + Puerto Rico. Usado para la
// auto-detección de idioma de abajo (2026-09-07).
const SPANISH_SPEAKING_COUNTRIES = new Set([
  'MX', 'ES', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR',
])

function prefersSpanish(request: NextRequest): boolean {
  const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase()
  if (SPANISH_SPEAKING_COUNTRIES.has(country)) return true
  // Fallback: primer idioma que manda el navegador (ej. "es-MX,es;q=0.9,en;q=0.8")
  // — cubre el caso de alguien con VPN/geo distinto a su idioma real.
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const firstTag = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? ''
  return firstTag.startsWith('es')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auto-detección de idioma en la home de opabiz.com (2026-09-07) — antes el
  // sitio arrancaba siempre en inglés sin importar desde dónde entrara el
  // cliente. Solo corre en la home raíz ("/", no en mybusinessformation.com,
  // que tiene su propio mapeo de host en next.config.ts) y solo la primera
  // vez — una cookie (`lang_choice`) recuerda la decisión para no forzar
  // español de nuevo si el cliente ya vio/prefirió inglés en una visita
  // anterior. El toggle manual EN/ES del home sigue funcionando igual
  // (navega entre "/" y "/es" directamente, sin pasar por esta lógica).
  if (pathname === '/') {
    const host = request.headers.get('host') ?? ''
    const isOpabiz = host === 'opabiz.com' || host === 'www.opabiz.com'
    const alreadyDecided = request.cookies.get('lang_choice')?.value
    if (isOpabiz && !alreadyDecided) {
      if (prefersSpanish(request)) {
        const response = NextResponse.redirect(new URL('/es', request.url), 307)
        response.cookies.set('lang_choice', 'es', { maxAge: 60 * 60 * 24 * 365, path: '/' })
        return response
      }
      const response = NextResponse.next()
      response.cookies.set('lang_choice', 'en', { maxAge: 60 * 60 * 24 * 365, path: '/' })
      return response
    }
  }

  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session')
    if (!session?.value || !(await verifyAdminToken(session.value))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname === '/login/verify') {
    const pending = request.cookies.get('admin_pending')
    if (!pending?.value) return NextResponse.redirect(new URL('/login', request.url))
    const { valid } = await verifyPendingToken(pending.value)
    if (!valid) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/client-portal/dashboard')) {
    const session = request.cookies.get('client_session')
    if (!session) return NextResponse.redirect(new URL('/client-portal', request.url))
  }

  if (pathname.startsWith('/opabiz/dashboard')) {
    const session = request.cookies.get('opabiz_session')
    if (!session?.value || !(await verifyEmployeeToken(session.value))) {
      return NextResponse.redirect(new URL('/opabiz/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/login/verify', '/client-portal/dashboard/:path*', '/opabiz/dashboard/:path*'],
}
