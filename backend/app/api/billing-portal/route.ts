import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isFbfcBrand } from '@/lib/email-constants'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Dos Configurations distintas del Billing Portal (nombre/logo propios de cada
// marca) creadas a mano en el dashboard de Stripe (test y live por separado,
// mismo patrón que los Product IDs de lib/stripe-subscriptions.ts) — sin esto,
// un cliente de mybusinessformation.com vería branding OpaBiz en el portal de
// pagos. Si el env var de una marca falta, cae a la Configuration default de
// la cuenta (comportamiento previo, no rompe).
function billingPortalConfigId(sourceBrand: string | null): string | undefined {
  const envKey = isFbfcBrand(sourceBrand as 'opabiz' | 'fbfc' | null)
    ? 'STRIPE_BILLING_PORTAL_CONFIG_FBFC'
    : 'STRIPE_BILLING_PORTAL_CONFIG_OPABIZ'
  return process.env[envKey] || undefined
}

// Crea una sesión del Stripe Billing Portal para que el cliente gestione
// (cancele, cambie tarjeta) sus suscripciones de servicios recurrentes
// (Registered Agent / Virtual Address / Annual Report). Botón "Gestionar mi
// suscripción" en client-portal/dashboard/DashboardContent.tsx.
//
// Autenticado por la cookie client_session (nunca por un id en el body) —
// mismo patrón de agrupación por email que "Mis Órdenes" del dashboard
// (app/client-portal/dashboard/page.tsx): la cookie da la orden de sesión,
// se verifica que la orden pedida comparta el mismo email antes de exponer
// su stripeCustomerId.
export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let orderId: string
  try {
    const body = await req.json()
    orderId = typeof body?.orderId === 'string' ? body.orderId : sessionOrderId
  } catch {
    orderId = sessionOrderId
  }

  const supabase = getSupabaseAdmin()

  const { data: sessionOrder } = await supabase
    .from('Order')
    .select('email')
    .eq('id', sessionOrderId)
    .maybeSingle()
  if (!sessionOrder) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: targetOrder } = await supabase
    .from('Order')
    .select('id, email, stripeCustomerId, sourceBrand')
    .eq('id', orderId)
    .maybeSingle()
  if (!targetOrder || targetOrder.email !== sessionOrder.email) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (!targetOrder.stripeCustomerId) {
    return NextResponse.json({ error: 'Esta orden no tiene servicios recurrentes activos' }, { status: 400 })
  }

  const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://opabiz.com'
  const returnUrl = new URL('/client-portal/dashboard', origin).toString()

  try {
    const configuration = billingPortalConfigId(targetOrder.sourceBrand ?? null)
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: targetOrder.stripeCustomerId,
      return_url: returnUrl,
      ...(configuration ? { configuration } : {}),
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[billing-portal]', msg)
    return NextResponse.json({ error: 'No se pudo abrir el portal de facturación', detail: msg }, { status: 500 })
  }
}
