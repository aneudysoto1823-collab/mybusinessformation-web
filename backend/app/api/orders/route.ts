import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'onboarding@resend.dev'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Validar campos requeridos ─────────────────────────────────────────────
    const missing: string[] = []
    if (!body.firstName)   missing.push('firstName')
    if (!body.lastName)    missing.push('lastName')
    if (!body.email)       missing.push('email')
    if (!body.companyName) missing.push('companyName')
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos faltantes: ' + missing.join(', ') },
        { status: 400 }
      )
    }

    // ── Insertar orden en Supabase (HTTP, sin conexión directa a PostgreSQL) ──
    const { data: order, error } = await getSupabaseAdmin()
      .from('Order')
      .insert({
        id:              crypto.randomUUID(),
        createdAt:       new Date().toISOString(),
        updatedAt:       new Date().toISOString(),
        // Contacto
        firstName:       String(body.firstName),
        lastName:        String(body.lastName),
        email:           String(body.email),
        phone:           body.phone           || null,
        country:         body.country         || 'US',

        // Empresa
        companyName:     String(body.companyName),
        companyName2:    body.companyName2    || null,
        companyName3:    body.companyName3    || null,
        entityType:      body.entityType      || 'llc',
        businessAddress: body.businessAddress || null,

        // Configuración del trámite
        speed:           body.speed           || 'standard',
        package:         body.package         || 'basic',
        amount:          Number(body.amount)  || 0,
        currency:        'USD',

        // Datos adicionales (Json)
        members:         body.members         ?? null,
        registeredAgent: body.registeredAgent || 'us',
        addons:          body.addons          ?? null,
        orgSignature:    body.orgSignature     || null,

        // Estado inicial
        paymentStatus: 'pending',
        status:        'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[/api/orders] Supabase insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Error saving order', detail: error.message },
        { status: 500 }
      )
    }

    // ── Email de confirmación — non-blocking ──────────────────────────────────
    getResend().emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `✅ We received your order — ${order.companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <h2 style="color:#1C2E44;font-size:20px">Hi ${order.firstName}, we got your order! 🎉</h2>
            <p style="color:#475569;line-height:1.7">
              Thank you for choosing Florida Business Formation Center. Here's a summary of your order:
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
              <p style="margin:6px 0;font-size:14px"><strong>Entity Type:</strong> ${(order.entityType ?? 'llc').toUpperCase()}</p>
              <p style="margin:6px 0;font-size:14px"><strong>Package:</strong> ${order.package}</p>
              <p style="margin:6px 0;font-size:14px"><strong>Filing Speed:</strong> ${order.speed}</p>
              <p style="margin:6px 0;font-size:14px"><strong>Order Number:</strong> ${order.id}</p>
            </div>
            <p style="color:#475569;line-height:1.7">
              Our team is now reviewing your information and will verify name availability with the
              Florida Division of Corporations. We'll be in touch within <strong>1 business day</strong>.
            </p>
            <p style="color:#475569;line-height:1.7">
              Questions? Reach us on <a href="https://wa.me/1XXXXXXXXXX" style="color:#059669">WhatsApp</a> or
              reply to this email.
            </p>
            <p style="margin-top:32px;color:#94a3b8;font-size:12px">
              Florida Business Formation Center · mybusinessformation.com<br/>
              This is a transactional email. We are a document preparation service, not a law firm.
            </p>
          </div>
        </div>
      `
    }).catch(err => console.error('Email confirmation error (non-fatal):', err))

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 })

  } catch (error) {
    console.error('[/api/orders POST] Error inesperado:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: 'Error processing order', detail: message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json(orders)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error fetching orders', detail: message }, { status: 500 })
  }
}
