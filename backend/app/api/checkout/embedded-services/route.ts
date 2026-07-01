import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeServicesTotal, SERVICES_CATALOG, SERVICE_BUNDLES } from '@/lib/services-pricing'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Crea una orden à la carte (package:'services') en estado pending + una sesión
// de Stripe Embedded Checkout. Recibe la lista de servicios + los datos de
// captura del formulario. El precio se recalcula aquí (anti-tampering). Al
// pagar, el webhook (kind='services') marca la orden paid y envía los emails.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const services: string[] = Array.isArray(body.services) ? body.services : []
    const intake = (body.intake && typeof body.intake === 'object') ? body.intake : {}
    const lang = body.lang === 'es' ? 'es' : 'en'
    const isEs = lang === 'es'

    // Validar servicios contra el catálogo
    const validIds = services.filter((id) => typeof id === 'string' && SERVICES_CATALOG[id])
    const uniqueIds = Array.from(new Set(validIds))
    if (uniqueIds.length === 0) {
      return NextResponse.json({ error: isEs ? 'No hay servicios válidos en el pedido.' : 'No valid services in the order.' }, { status: 400 })
    }

    // Bundles (combos) elegidos — validar contra el catálogo de bundles
    const rawBundles: string[] = Array.isArray(intake.bundles) ? intake.bundles : []
    const bundleIds = Array.from(new Set(rawBundles.filter((b) => typeof b === 'string' && SERVICE_BUNDLES[b])))
    if (services.length > 30) {
      return NextResponse.json({ error: 'Too many services.' }, { status: 400 })
    }

    // Validar datos mínimos de contacto
    const firstName = String(intake.firstName || '').trim()
    const lastName = String(intake.lastName || '').trim()
    const email = String(intake.email || '').trim()
    const phone = String(intake.phone || '').trim()
    const entityType = intake.entityType === 'corp' ? 'corp' : 'llc'
    const legalName = String(intake.legalName || intake.businessName || '').trim()

    if (firstName.length < 1 || lastName.length < 1) {
      return NextResponse.json({ error: isEs ? 'Falta tu nombre.' : 'Your name is required.' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: isEs ? 'Correo inválido.' : 'Invalid email.' }, { status: 400 })
    }

    const expedited = intake.expedited === true
    const { cents, lines, total } = computeServicesTotal(uniqueIds, bundleIds, expedited)
    if (cents < 50) {
      return NextResponse.json({ error: isEs ? 'Monto inválido.' : 'Invalid amount.' }, { status: 400 })
    }

    // Crear la orden pending en Supabase
    const supabase = getSupabaseAdmin()
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: orderError } = await supabase.from('Order').insert({
      id:              orderId,
      createdAt:       now,
      updatedAt:       now,
      firstName,
      lastName,
      email:           email.toLowerCase(),
      phone:           phone || null,
      country:         String(intake.country || 'US'),
      companyName:     (legalName || `${firstName} ${lastName}`).toUpperCase(),
      entityType,
      package:         'services',
      // Guardamos TODO lo capturado (servicios + intake + desglose) en addons
      // (JSON) para que el equipo procese cada servicio. members queda null.
      addons:          { services: uniqueIds, bundles: bundleIds, intake, lines },
      amount:          total,
      currency:        'USD',
      paymentStatus:   'pending',
      status:          'pending',
      speed:           'standard',
      registeredAgent: 'us',
    })

    if (orderError) {
      console.error('[checkout/embedded-services] order insert error:', orderError)
      return NextResponse.json({ error: isEs ? 'No se pudo crear la orden.' : 'Could not create order.', detail: orderError.message }, { status: 500 })
    }

    // Stripe rechaza líneas en $0 (ej. Agente Registrado gratis al combinar); se
    // omiten del cobro pero quedan registradas en la orden (addons.lines).
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines
      .filter((l) => l.amount > 0)
      .map((l) => ({
        price_data: { currency: 'usd', product_data: { name: l.label }, unit_amount: Math.round(l.amount * 100) },
        quantity: 1,
      }))

    const origin = req.headers.get('origin') || 'https://opabiz.com'

    const session = await getStripe().checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: lineItems,
      customer_email: email.toLowerCase(),
      billing_address_collection: 'required',
      return_url: `${origin}/servicios/checkout?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      payment_intent_data: { statement_descriptor_suffix: 'SERVICES' },
      metadata: { kind: 'services', orderId },
    })

    const fbfc = `FBFC-${orderId.replace(/-/g, '').substring(0, 8).toUpperCase()}`
    return NextResponse.json({ clientSecret: session.client_secret, orderId, fbfc, total, lines })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout/embedded-services]', msg)
    return NextResponse.json({ error: 'No se pudo crear la sesión de pago', detail: msg }, { status: 500 })
  }
}
