import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { email, confirmationNumber } = await request.json()

  if (!email || !confirmationNumber) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Confirmation number format: FBFC-XXXXXXXX (first 8 chars of order ID, uppercase)
  const match = String(confirmationNumber).toUpperCase().match(/^FBFC-([A-Z0-9]{8})$/)
  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const idPrefix = match[1].toLowerCase()

  try {
    // Busca directamente en la DB filtrando por email — nunca descarga todos los registros
    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    const order = (orders ?? []).find(
      o => o.id?.toLowerCase().startsWith(idPrefix)
    )

    // Respuesta genérica — no revela si el email existe o no
    if (!order) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
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
