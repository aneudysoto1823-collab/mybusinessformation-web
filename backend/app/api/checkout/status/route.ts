import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeFormationTotal } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Consulta el estado de una sesión de Checkout (para la página de retorno del
// Embedded Checkout). NO crea ni modifica nada — el webhook es el que cumple la
// orden. Esto permite mostrar al cliente si su pago se completó y un resumen de
// su orden (número de orden + desglose itemizado, recalculado con la
// misma lógica del cobro). El resumen está disponible aunque el webhook aún no
// haya marcado la orden como pagada (se lee directo por el orderId de la sesión).
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    // Resumen de la orden (solo flujo de formación: metadata.orderId)
    let order = null
    const orderId = session.metadata?.orderId
    if (orderId) {
      const { data } = await getSupabaseAdmin()
        .from('Order')
        .select('id, companyName, entityType, package, speed, addons')
        .eq('id', orderId)
        .single()
      if (data) {
        const { total, lines } = computeFormationTotal({
          package:    data.package,
          entityType: data.entityType,
          speed:      data.speed,
          addons:     data.addons as Record<string, unknown> | null,
        })
        const addonsObj = (data.addons ?? {}) as Record<string, unknown>
        const addons = ['ein', 'oa', 'itin', 'btr', 'str', 'cc'].filter(k => addonsObj[k])
        order = {
          fbfc:        `FBFC-${data.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`,
          companyName: data.companyName,
          entityType:  data.entityType,
          package:     data.package,
          addons,  // keys de add-ons elegidos (para la lista "Lo que incluye")
          lines,   // [{ label, amount }] — labels EN, se localizan en el front
          total,
        }
      }
    }

    return NextResponse.json({
      status:        session.status,         // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      email:         session.customer_details?.email ?? null,
      order,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout/status]', msg)
    return NextResponse.json({ error: 'No se pudo consultar la sesión' }, { status: 500 })
  }
}
