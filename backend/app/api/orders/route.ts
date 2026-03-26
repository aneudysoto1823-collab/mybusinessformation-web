import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const getResend = () => new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'onboarding@resend.dev'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const order = await prisma.order.create({
      data: {
        // Contacto
        firstName:       body.firstName,
        lastName:        body.lastName,
        email:           body.email,
        phone:           body.phone   || null,
        country:         body.country || 'US',

        // Empresa
        companyName:     body.companyName,
        companyName2:    body.companyName2 || null,
        companyName3:    body.companyName3 || null,
        entityType:      body.entityType   || null,
        businessAddress: body.businessAddress || null,

        // Configuración
        speed:           body.speed   || 'standard',
        package:         body.package || 'basic',
        amount:          body.amount  || 0,

        // Datos adicionales
        members:         body.members         || undefined,
        registeredAgent: body.registeredAgent || 'us',
        addons:          body.addons          || undefined,
        orgSignature:    body.orgSignature     || null,

        // Estado inicial
        paymentStatus: 'pending',
        status:        'pending',
      },
    })

    // Email de confirmación — non-blocking
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
              <p style="margin:6px 0;font-size:14px"><strong>Entity Type:</strong> ${order.entityType?.toUpperCase() || 'LLC'}</p>
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
    console.error('Error creating order:', error)
    return NextResponse.json({ success: false, error: 'Error processing order' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 })
  }
}
