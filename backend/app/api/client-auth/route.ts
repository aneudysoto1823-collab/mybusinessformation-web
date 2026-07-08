import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ClientAuthInputSchema, parseOr400 } from '@/lib/schemas'
import { checkClientAuthRateLimit, getClientIp } from '@/lib/rate-limit'

function setSession(orderId: string, isDraft?: boolean) {
  const response = NextResponse.json({ success: true, isDraft: isDraft === true })
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
  const ip = getClientIp(request)
  const rl = await checkClientAuthRateLimit(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const raw = await request.json()

  // ── Modo password: email + password (sin número de orden) ──────────────────
  if (raw.password && raw.email && !raw.confirmationNumber) {
    const email = (raw.email as string).toLowerCase().trim()
    const password = raw.password as string

    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, email, client_password_hash, isDraft')
      .eq('email', email)
      .limit(10)

    if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

    const order = (orders ?? []).find(
      (o: { client_password_hash?: string }) => o.client_password_hash &&
        bcrypt.compareSync(password, o.client_password_hash)
    )

    if (!order) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    return setSession(order.id, order.isDraft)
  }

  // ── Modo número de orden: FBFC-XXXXXXXX alcanza por sí solo (decisión negocio
  //    2026-07-02 — antes exigía también el email). El código tiene suficiente
  //    entropía (8 caracteres al azar) y checkClientAuthRateLimit arriba limita
  //    los intentos por hora, así que no hace falta el segundo factor.
  const parsed = parseOr400(ClientAuthInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const { confirmationNumber } = parsed.data

  // Guion opcional (ver ClientAuthInputSchema): acepta FBFC-XXXXXXXX o FBFCXXXXXXXX.
  const match = confirmationNumber.toUpperCase().match(/^(?:FBFC|FBNB)-?([A-Z0-9]{8})$/)
  if (!match) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const idPrefix = match[1].toLowerCase()

  try {
    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, email, isDraft')
      .ilike('id', `${idPrefix}%`)
      .limit(5)

    if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })

    const order = (orders ?? [])[0]
    if (!order) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    return setSession(order.id, order.isDraft)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
