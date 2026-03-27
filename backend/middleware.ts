import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session')
    if (!session) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/client-portal/dashboard')) {
    const session = request.cookies.get('client_session')
    if (!session) return NextResponse.redirect(new URL('/client-portal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/client-portal/dashboard/:path*'],
}
