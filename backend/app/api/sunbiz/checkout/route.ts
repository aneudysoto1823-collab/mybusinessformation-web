import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const SERVICES: Record<string, { name: string; amount: number }> = {
  labor_law_poster:      { name: 'Labor Law Poster (2026)',    amount: 6999  }, // $69.99
  ein:                   { name: 'EIN / Tax ID Number',         amount: 9999  }, // $99.99
  certificate_of_status: { name: 'Certificate of Status (FL)', amount: 4999  }, // $49.99
  bundle:                { name: 'Business Essentials Bundle (3 services)', amount: 18999 }, // $189.99
}

export async function POST(req: NextRequest) {
  try {
    const { company_id, document_id, company_name, selected_services, lang } = await req.json()

    if (!selected_services || selected_services.length === 0) {
      return NextResponse.json({ error: 'No services selected' }, { status: 400 })
    }

    // Resolve bundle → individual line items
    const isBundle = selected_services.includes('bundle')
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isBundle
      ? [{ price_data: { currency: 'usd', product_data: { name: SERVICES.bundle.name }, unit_amount: SERVICES.bundle.amount }, quantity: 1 }]
      : selected_services.map((svcId: string) => {
          const svc = SERVICES[svcId]
          if (!svc) throw new Error(`Unknown service: ${svcId}`)
          return { price_data: { currency: 'usd', product_data: { name: svc.name }, unit_amount: svc.amount }, quantity: 1 }
        })

    const origin = req.headers.get('origin') || 'https://mybusinessformation.com'

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      billing_address_collection: 'auto',
      customer_email: customerEmail,
      success_url: `${origin}/new-business/success?session_id={CHECKOUT_SESSION_ID}&doc=${encodeURIComponent(document_id || '')}`,
      cancel_url:  `${origin}/new-business?id=${encodeURIComponent(document_id || '')}`,
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

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sunbiz/checkout]', msg)
    return NextResponse.json({ error: 'Could not create checkout session', detail: msg }, { status: 500 })
  }
}
