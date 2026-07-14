import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, verifyPendingToken } from '@/lib/session'
import { verifyEmployeeToken } from '@/lib/opabiz-session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ['/admin/:path*', '/login/verify', '/client-portal/dashboard/:path*', '/opabiz/dashboard/:path*'],
}
