import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export async function POST(request: NextRequest) {
  const { email, confirmationNumber } = await request.json()

  if (!email || !confirmationNumber) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Confirmation number format: FBFC-XXXXXXXX (first 8 chars of order ID, uppercase)
  const match = String(confirmationNumber).toUpperCase().match(/^FBFC-([A-Z0-9]{8})$/)
  if (!match) {
    return NextResponse.json({ error: 'Invalid confirmation number format' }, { status: 401 })
  }
  const idPrefix = match[1].toLowerCase()

  try {
    const res = await backendFetch('/api/orders', { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    const data = await res.json()
    const orders: Array<{ id: string; email: string }> = data.orders ?? data.data ?? data ?? []

    const order = orders.find(
      o =>
        o.email?.toLowerCase() === email.toLowerCase() &&
        o.id?.toLowerCase().startsWith(idPrefix)
    )

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('client_session', order.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
