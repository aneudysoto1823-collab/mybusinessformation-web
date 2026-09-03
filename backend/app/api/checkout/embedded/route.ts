import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeFormationTotal } from '@/lib/pricing'
import { resolveOrigin } from '@/lib/request-origin'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Crea una sesión de Stripe Embedded Checkout (ui_mode: 'embedded') para una
// orden de formación YA creada (pending). El cliente paga sin salir del sitio.
// El precio se recalcula aquí desde los datos de la orden — nunca se confía en
// el monto del navegador. Al pagar, el webhook marca la orden como paid.
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json().catch(() => ({}))
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: order, error } = await supabase
      .from('Order')
      .select('id, email, companyName, entityType, package, speed, addons, registeredAgent, paymentStatus')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Esta orden ya fue pagada' }, { status: 409 })
    }

    // Idioma persistido en Order.addons.lang (draft/orders lo guarda) — solo
    // afecta el label del line item de RA en Stripe/complete/emails, no el monto.
    const savedLang = ((order.addons ?? {}) as Record<string, unknown>).lang
    const { cents, lines } = computeFormationTotal({
      package:         order.package,
      entityType:      order.entityType,
      speed:           order.speed,
      addons:          order.addons as Record<string, unknown> | null,
      registeredAgent: order.registeredAgent,
      lang:            typeof savedLang === 'string' ? savedLang : null,
    })

    if (cents < 50) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map(l => ({
      price_data: { currency: 'usd', product_data: { name: l.label }, unit_amount: l.amount * 100 },
      quantity: 1,
    }))

    const origin = resolveOrigin(req)

    const session = await getStripe().checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: lineItems,
      // Colores de marca OpaBiz (blanco + azul) en vez del default de Stripe —
      // no afecta el widget de Link (producto propio de Stripe, no themeable).
      branding_settings: {
        background_color: '#FFFFFF',
        button_color:     '#2563EB',
        border_style:     'rounded',
      },
      customer_email: order.email || undefined,
      // 'required' → Stripe pide la dirección de facturación completa (nombre +
      // dirección) dentro del Embedded Checkout. Con 'auto' solo pedía lo mínimo.
      billing_address_collection: 'required',
      // Embedded usa return_url (no success_url/cancel_url). El webhook es quien
      // marca la orden como pagada; esta página solo confirma visualmente.
      return_url: `${origin}/order/complete?session_id={CHECKOUT_SESSION_ID}`,
      // Statement descriptor: lo que el cliente ve en su extracto bancario.
      // El sufijo se concatena al descriptor base de la cuenta (Stripe → Settings
      // → Business → Public details). Ej: base "OPABIZ" → "OPABIZ* FORMATION".
      // ⚠️ El base hay que configurarlo en el dashboard (test Y live por separado).
      payment_intent_data: {
        statement_descriptor_suffix: 'FORMATION',
      },
      metadata: {
        kind:    'formation',
        orderId: order.id,
      },
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout/embedded]', msg)
    return NextResponse.json({ error: 'No se pudo crear la sesión de pago', detail: msg }, { status: 500 })
  }
}
