import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Consulta el estado de una sesión de Checkout (para la página de retorno del
// Embedded Checkout). NO crea ni modifica nada — el webhook es el que cumple la
// orden. Esto solo permite mostrar al cliente si su pago se completó.
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      status:        session.status,         // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      email:         session.customer_details?.email ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout/status]', msg)
    return NextResponse.json({ error: 'No se pudo consultar la sesión' }, { status: 500 })
  }
}
