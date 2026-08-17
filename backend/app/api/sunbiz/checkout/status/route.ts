import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// ⚠️ Endpoint LEGACY (pareja de /api/sunbiz/checkout, ver comentario ahí):
// desde 2026-08-13 el flujo activo de /new-business redirige a
// /servicios/checkout en vez de a /new-business/success, así que en la
// práctica nada nuevo llega acá. Se deja vivo solo por si una pestaña de
// Stripe Checkout abierta ANTES de esa migración vuelve a completarse — esa
// orden la crea handleNBLPaid con package:'addon' (metadata sin `kind`), por
// eso el filtro de abajo sigue siendo el correcto para ESTE flujo específico
// (no confundir con package:'services' del flujo nuevo).
//
// Consulta el estado de una sesión de Checkout para la página de retorno de
// /new-business (flujo de servicios de marketing: Labor Law Poster, EIN,
// Certificate of Status). Espeja /api/checkout/status (home/formación), pero
// acá NO hay una Order pending creada antes del pago — el webhook recién crea
// la Order al confirmarse el pago — así que el resumen de servicios/total se
// lee directo de Stripe (line_items expandidos, disponibles apenas se
// completa el pago) y el número de orden es best-effort: si el webhook ya
// corrió lo encuentra por stripePaymentId, si no, se devuelve null y el
// front muestra "processing" en vez de trabar la pantalla.
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    })

    const lines = (session.line_items?.data ?? []).map(li => ({
      label:  li.description ?? '',
      amount: (li.amount_total ?? 0) / 100,
    }))
    const total = (session.amount_total ?? 0) / 100

    let orderNumber: string | null = null
    const paymentIntentId = (session.payment_intent as string) ?? null
    if (paymentIntentId) {
      const { data } = await getSupabaseAdmin()
        .from('Order')
        .select('id')
        .eq('stripePaymentId', paymentIntentId)
        .eq('package', 'addon')
        .maybeSingle()
      if (data) orderNumber = `FBNB-${data.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
    }

    return NextResponse.json({
      status:        session.status,
      paymentStatus: session.payment_status,
      email:         session.customer_details?.email ?? null,
      companyName:   session.metadata?.company_name || null,
      documentId:    session.metadata?.document_id  || null,
      lang:          (session.metadata?.lang as 'en' | 'es') || 'en',
      lines,
      total,
      orderNumber,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sunbiz/checkout/status]', msg)
    return NextResponse.json({ error: 'No se pudo consultar la sesión' }, { status: 500 })
  }
}
