import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeFormationTotal, withBasicDisplayLine } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

// GET /api/orders/summary-by-fbfc?fbfc=FBFC-XXXXXXXX — resuelve el número de
// orden al Order real, setea client_session (mismo patrón que el modo
// confirmationNumber de /api/client-auth) y devuelve el resumen para la
// pantalla de "revisar y pagar" (/confirm/[fbfc], flujo de intake asistida).
// Endpoint propio en vez de reusar /api/client-auth + un GET separado: es un
// link de un solo uso (clic desde el email), no una sesión de portal — un
// solo request es más simple y no toca el endpoint compartido del portal.
export async function GET(req: NextRequest) {
  const fbfc = req.nextUrl.searchParams.get('fbfc') || ''
  const match = fbfc.toUpperCase().match(/^(?:FBFC|FBNB)-?([A-Z0-9]{8})$/)
  if (!match) return NextResponse.json({ error: 'Número de orden inválido' }, { status: 400 })

  const idPrefix = match[1].toLowerCase()
  const supabase = getSupabaseAdmin()

  const { data: orders, error } = await supabase
    .from('Order')
    .select('id, firstName, lastName, email, companyName, entityType, package, speed, addons, paymentStatus')
    .ilike('id', `${idPrefix}%`)
    .limit(1)

  if (error) return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  const order = (orders ?? [])[0]
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  const { total, lines } = computeFormationTotal({
    package: order.package, entityType: order.entityType, speed: order.speed,
    addons: order.addons as Record<string, unknown> | null,
  })

  const response = NextResponse.json({
    orderId: order.id,
    fbfc: `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    companyName: order.companyName,
    entityType: order.entityType,
    package: order.package,
    paymentStatus: order.paymentStatus,
    lines: withBasicDisplayLine(order.package, lines),
    total,
  })

  response.cookies.set('client_session', order.id, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    maxAge: 60 * 60 * 24, path: '/',
  })

  return response
}
