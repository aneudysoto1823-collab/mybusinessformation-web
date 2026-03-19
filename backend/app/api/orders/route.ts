import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const order = await prisma.order.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        country: body.country,
        companyName: body.companyName,
        companyName2: body.companyName2 || null,
        companyName3: body.companyName3 || null,
        businessType: body.businessType || null,
        businessAddress: body.businessAddress || null,
        package: body.package,
        amount: body.amount,
        bankAssistance: body.bankAssistance || false,
        stripeAssistance: body.stripeAssistance || false,
        paymentStatus: 'pending',
        status: 'pending',
      },
    })

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