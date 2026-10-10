// "Reactivar servicio" desde el portal del cliente. La lógica vive en
// lib/subscription-reactivate.ts; acá solo va la autenticación del cliente y
// el registro de la aceptación de Términos.
//
// GET  ?orderId=&service=   precio actual + tarjeta guardada (para la ventana)
// POST { orderId, service, termsText, paymentMethodId? }   cobra y reactiva
// POST { orderId, service, confirm: true }   después de la verificación del banco

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { appendTermsAcceptance, requestIp } from '@/lib/terms-acceptance'
import {
  reactivateService, reactivationQuote, getCustomerCard,
  REACTIVATION_ORDER_SELECT, REACTIVATABLE_SERVICES, type ReactivationOrder,
} from '@/lib/subscription-reactivate'

export const dynamic = 'force-dynamic'

// Mismo patrón que /api/subscriptions/cancel: la cookie da la orden de sesión
// y la orden objetivo tiene que compartir el mismo email.
async function loadAuthorizedOrder(req: NextRequest, orderId: string): Promise<ReactivationOrder | NextResponse> {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const supabase = getSupabaseAdmin()
  const { data: sessionOrder } = await supabase.from('Order').select('email').eq('id', sessionOrderId).maybeSingle()
  if (!sessionOrder) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data: order } = await supabase.from('Order').select(REACTIVATION_ORDER_SELECT).eq('id', orderId || sessionOrderId).maybeSingle()
  if (!order || order.email !== sessionOrder.email) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  return order as ReactivationOrder
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId') ?? ''
  const service = req.nextUrl.searchParams.get('service') ?? ''
  if (!REACTIVATABLE_SERVICES.includes(service)) return NextResponse.json({ error: 'Este servicio no se puede reactivar' }, { status: 400 })
  const order = await loadAuthorizedOrder(req, orderId)
  if (order instanceof NextResponse) return order
  const quote = reactivationQuote(service, order.sourceBrand === 'fbfc' ? 'fbfc' : 'opabiz')
  if (!quote) return NextResponse.json({ error: 'Servicio sin precio' }, { status: 400 })
  const card = await getCustomerCard(order.stripeCustomerId)
  return NextResponse.json({
    lines: quote.lines,
    total: quote.total,
    card: card ? { brand: card.brand, last4: card.last4 } : null,
  })
}

export async function POST(req: NextRequest) {
  let orderId = '', service = '', termsText = '', paymentMethodId: string | undefined, confirm = false
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : ''
    service = typeof body?.service === 'string' ? body.service : ''
    termsText = typeof body?.termsText === 'string' ? body.termsText.trim() : ''
    paymentMethodId = typeof body?.paymentMethodId === 'string' && body.paymentMethodId ? body.paymentMethodId : undefined
    confirm = body?.confirm === true
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!confirm && !termsText) return NextResponse.json({ error: 'Debe aceptar los Términos' }, { status: 400 })

  const order = await loadAuthorizedOrder(req, orderId)
  if (order instanceof NextResponse) return order

  if (!confirm) {
    await appendTermsAcceptance(order.id, {
      context: 'reactivation',
      service,
      text: termsText,
      ip: requestIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
  }

  try {
    const result = await reactivateService({ order, service, paymentMethodId, confirmOnly: confirm })
    if (result.status === 'error') return NextResponse.json({ error: result.error }, { status: result.httpStatus })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscriptions/reactivate-service]', order.id, service, msg)
    return NextResponse.json({ error: 'No se pudo reactivar el servicio', detail: msg }, { status: 500 })
  }
}
