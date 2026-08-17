import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SunbizCheckoutInputSchema, parseOr400 } from '@/lib/schemas'
import { resolveOrigin } from '@/lib/request-origin'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const SERVICES: Record<string, { name: string; amount: number }> = {
  labor_law_poster:      { name: 'Labor Law Poster (2026)',    amount: 12000 }, // $120.00
  ein:                   { name: 'EIN / Tax ID Number',         amount: 16100 }, // $161.00
  certificate_of_status: { name: 'Certificate of Status (FL)', amount: 7900  }, // $79.00
}
const BUNDLE_SERVICE_IDS = ['labor_law_poster', 'ein', 'certificate_of_status'] as const
const BUNDLE_DISCOUNT = 0.9 // 10% off cuando se compran los 3 juntos

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const parsed = parseOr400(SunbizCheckoutInputSchema, raw)
    if (!parsed.ok) {
      console.error('[/api/sunbiz/checkout] validation error:', parsed.details)
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { company_id, document_id, company_name, selected_services, lang } = parsed.data

    // Resolve bundle → 3 line items individuales con el 10% ya aplicado a cada
    // uno (antes era un solo line item "Bundle (3 services)" — el cliente no
    // veía qué compró ni en la página de éxito ni en el email, porque ambos
    // arman su resumen desde los line_items reales de Stripe).
    const isBundle = selected_services.includes('bundle')
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isBundle
      ? BUNDLE_SERVICE_IDS.map(id => {
          const svc = SERVICES[id]
          return { price_data: { currency: 'usd', product_data: { name: svc.name }, unit_amount: Math.round(svc.amount * BUNDLE_DISCOUNT) }, quantity: 1 }
        })
      : selected_services.map((svcId: string) => {
          const svc = SERVICES[svcId]
          if (!svc) throw new Error(`Unknown service: ${svcId}`)
          return { price_data: { currency: 'usd', product_data: { name: svc.name }, unit_amount: svc.amount }, quantity: 1 }
        })

    // ⚠️ Endpoint LEGACY: ya no lo llama ningún frontend actual (el flujo de
    // /new-business pasa por /api/checkout/embedded-services desde 2026-08-13).
    // Se deja vivo, endurecido, solo por si una pestaña de Stripe Checkout
    // abierta ANTES de la migración vuelve a intentar completar el pago.
    const origin = resolveOrigin(req, 'https://mybusinessformation.com')

    // Look up company email from DB to pre-fill Stripe checkout
    let customerEmail: string | undefined
    if (company_id) {
      const supabase = getSupabaseAdmin()
      const { data } = await supabase
        .from('prospective_companies')
        .select('email, owner_name')
        .eq('id', company_id)
        .single()
      if (data?.email) customerEmail = data.email
    }

    // Embedded Checkout (ui_mode:'embedded') — mismo patrón que /api/checkout/embedded
    // (home) y /api/checkout/embedded-services (/servicios/checkout): el form de
    // Stripe se monta dentro de la página, sin redirigir a checkout.stripe.com.
    const session = await getStripe().checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: lineItems,
      mode: 'payment',
      billing_address_collection: 'auto',
      branding_settings: {
        background_color: '#FFFFFF',
        button_color:     '#2563EB',
        border_style:     'rounded',
      },
      customer_email: customerEmail,
      return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&doc=${encodeURIComponent(document_id || '')}`,
      // Statement descriptor: lo que el cliente ve en su extracto bancario.
      // El sufijo se concatena al descriptor base de la cuenta (Stripe → Settings
      // → Business → Public details). Ej: base "OPABIZ" → "OPABIZ* SERVICES".
      // ⚠️ El base hay que configurarlo en el dashboard (test Y live por separado).
      payment_intent_data: {
        statement_descriptor_suffix: 'SERVICES',
      },
      metadata: {
        company_id:        company_id    || '',
        document_id:       document_id  || '',
        company_name:      company_name || '',
        selected_services: selected_services.join(','),
        lang:              lang || 'en',
      },
    })

    // Record conversion intent in Supabase (fire and forget)
    if (company_id) {
      const supabase = getSupabaseAdmin()
      supabase
        .from('qr_scans')
        .update({ converted: true })
        .eq('company_id', company_id)
        .then(() => {})
    }

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sunbiz/checkout]', msg)
    return NextResponse.json({ error: 'Could not create checkout session', detail: msg }, { status: 500 })
  }
}
