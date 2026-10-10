// POST /api/orders/accept-terms — registra que el cliente marcó la casilla de
// Términos en un checkout (formulario de formación del home o
// /servicios/checkout). Ver lib/terms-acceptance.ts.
//
// Sin sesión: lo llama el navegador del cliente en pleno checkout (todavía no
// tiene cuenta). Por eso solo acepta órdenes que siguen sin pagar: no se puede
// agregar una aceptación a una orden ya pagada de otra persona.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { appendTermsAcceptance, requestIp } from '@/lib/terms-acceptance'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let orderId = '', text = '', context: 'formation' | 'services' = 'formation'
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : ''
    text = typeof body?.text === 'string' ? body.text.trim() : ''
    context = body?.context === 'services' ? 'services' : 'formation'
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!orderId || !text) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data: order } = await getSupabaseAdmin()
    .from('Order')
    .select('id, paymentStatus')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  if (order.paymentStatus !== 'pending') return NextResponse.json({ error: 'La orden ya no está pendiente' }, { status: 409 })

  const ok = await appendTermsAcceptance(orderId, {
    context,
    text,
    ip: requestIp(req),
    userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  })
  return NextResponse.json({ success: ok })
}
