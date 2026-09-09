import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeFormationTotal } from '@/lib/pricing'
import { resolveOrigin, brandFromOrigin, statementDescriptorParams } from '@/lib/request-origin'

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
    const brand = brandFromOrigin(origin)

    // Pre-llenar billing address (2026-09-07): si el cliente eligió "I will
    // use my own address" (paso 2), esa dirección ya viaja estructurada en
    // Order.addons.billingAddr (page.tsx fmBuildOrderPayload) — se crea un
    // Stripe Customer con ella para que el Embedded Checkout la muestre
    // pre-llenada (el cliente igual puede editarla antes de pagar). Con
    // "Virtual Address" no hay nada guardado ahí (billingAddr queda null,
    // se asigna recién después del pago) — mismo comportamiento que antes,
    // Stripe pide la dirección desde cero.
    // Validación server-side por las dudas (defensa en profundidad, nunca
    // confiar ciegamente en lo que mandó el navegador): country debe ser un
    // código ISO de 2 letras — si no, se ignora en vez de romper la sesión.
    const rawBillingAddr = (order.addons as { billingAddr?: unknown } | null)?.billingAddr
    const billingAddr = (rawBillingAddr && typeof rawBillingAddr === 'object')
      ? rawBillingAddr as { line1?: string; line2?: string | null; city?: string; state?: string | null; postal_code?: string | null; country?: string }
      : null
    const hasValidBillingAddr = !!(billingAddr?.line1 && billingAddr?.city && billingAddr?.country && /^[A-Za-z]{2}$/.test(billingAddr.country))

    let customerId: string | undefined
    if (hasValidBillingAddr && billingAddr) {
      const customer = await getStripe().customers.create({
        email: order.email || undefined,
        name: order.companyName || undefined,
        address: {
          line1: billingAddr.line1!,
          line2: billingAddr.line2 || undefined,
          city: billingAddr.city,
          state: billingAddr.state || undefined,
          postal_code: billingAddr.postal_code || undefined,
          country: billingAddr.country!.toUpperCase(),
        },
      })
      customerId = customer.id
    }

    const session = await getStripe().checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: lineItems,
      // Restringido a 'card' a propósito (decisión founder 2026-09-08) — sin
      // esto Stripe decide automáticamente qué métodos mostrar según lo
      // habilitado en el Dashboard (Settings → Payment methods) e incluía
      // Link. Apple Pay / Google Pay NO se listan aparte: viajan dentro de
      // 'card' y aparecen solos en dispositivos/navegadores compatibles,
      // siempre que estén activados en esa misma pantalla del Dashboard
      // (test y live son configs separadas, activar en ambas).
      payment_method_types: ['card'],
      // Colores de marca OpaBiz (blanco + azul) en vez del default de Stripe.
      branding_settings: {
        background_color: '#FFFFFF',
        button_color:     '#2563EB',
        border_style:     'rounded',
      },
      // customer_creation ('always') solo es válido cuando NO se pasa un
      // customer explícito — con billing address pre-llenado, se referencia
      // el Customer ya creado arriba en su lugar (mismo customer que
      // Subscriptions/renovaciones usan después, no cambia ese flujo).
      ...(customerId
        ? { customer: customerId }
        : { customer_email: order.email || undefined, customer_creation: 'always' as const }),
      // 'required' → Stripe pide la dirección de facturación completa (nombre +
      // dirección) dentro del Embedded Checkout. Con 'auto' solo pedía lo mínimo.
      billing_address_collection: 'required',
      // Campo nativo de Stripe "Add promotion code" dentro del Embedded
      // Checkout (2026-09-09) — para aplicar descuentos ad-hoc a un cliente
      // puntual (código de un solo uso) o una promo general (código
      // reusable), sin construir nada propio. Los códigos/cupones se crean y
      // administran directo en el dashboard de Stripe (Product catalog →
      // Coupons), test y live por separado — no requieren env vars ni
      // cambios de código adicionales.
      allow_promotion_codes: true,
      // Embedded usa return_url (no success_url/cancel_url). El webhook es quien
      // marca la orden como pagada; esta página solo confirma visualmente.
      return_url: `${origin}/order/complete?session_id={CHECKOUT_SESSION_ID}`,
      // Statement descriptor: lo que el cliente ve en su extracto bancario.
      // En OpaBiz el sufijo se concatena al descriptor base de la cuenta
      // (Stripe → Settings → Business → Public details, hoy "OPABIZ.COM") →
      // "OPABIZ.COM* FORMATION". En FBFC se pisa el descriptor completo (ver
      // statementDescriptorParams) porque el base de la cuenta no lo
      // representa — mybusinessformation.com nunca debe mostrar "OPABIZ.COM"
      // en el extracto del cliente.
      payment_intent_data: {
        ...statementDescriptorParams(brand, 'FORMATION'),
        // Guarda el método de pago en el Customer para cobros off-session
        // futuros — lo usan las Subscriptions de servicios recurrentes
        // (Annual Report) creadas después del pago, ver webhook.
        setup_future_usage: 'off_session',
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
