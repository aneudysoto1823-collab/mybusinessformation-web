import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ClientAuthInputSchema, parseOr400 } from '@/lib/schemas'

function setSession(orderId: string) {
  const response = NextResponse.json({ success: true })
  response.cookies.set('client_session', orderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}

export async function POST(request: NextRequest) {
  const raw = await request.json()

  // ── Modo password: email + password (sin número de orden) ──────────────────
  if (raw.password && raw.email && !raw.confirmationNumber) {
    const email = (raw.email as string).toLowerCase().trim()
    const password = raw.password as string

    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, email, client_password_hash')
      .eq('email', email)
      .limit(10)

    if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

    const order = (orders ?? []).find(
      (o: { client_password_hash?: string }) => o.client_password_hash &&
        bcrypt.compareSync(password, o.client_password_hash)
    )

    if (!order) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    return setSession(order.id)
  }

  // ── Modo número de orden: email + FBFC-XXXXXXXX (flujo original) ───────────
  const parsed = parseOr400(ClientAuthInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const { email, confirmationNumber } = parsed.data

  const match = confirmationNumber.toUpperCase().match(/^(?:FBFC|FBNB)-([A-Z0-9]{8})$/)
  if (!match) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const idPrefix = match[1].toLowerCase()

  try {
    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .limit(10)

    if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

    const order = (orders ?? []).find(
      (o: { id: string }) => o.id?.toLowerCase().startsWith(idPrefix)
    )

    if (!order) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    return setSession(order.id)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
