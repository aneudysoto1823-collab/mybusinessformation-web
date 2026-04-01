import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CreateOrderInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  country: string
  companyName: string
  companyName2?: string
  companyName3?: string
  entityType?: string
  businessAddress?: string
  speed?: string
  package: string
  amount: number
  currency?: string
  members?: unknown
  registeredAgent?: string
  addons?: unknown
  orgSignature?: string
  stripePaymentId?: string
}

export const saveOrder = async (orderData: CreateOrderInput) => {
  const order = await prisma.order.create({
    data: {
      firstName:       orderData.firstName,
      lastName:        orderData.lastName,
      email:           orderData.email,
      phone:           orderData.phone,
      country:         orderData.country,
      companyName:     orderData.companyName,
      companyName2:    orderData.companyName2,
      companyName3:    orderData.companyName3,
      entityType:      orderData.entityType,
      businessAddress: orderData.businessAddress,
      speed:           orderData.speed,
      package:         orderData.package,
      amount:          orderData.amount,
      currency:        orderData.currency,
      members:         orderData.members as object | undefined,
      registeredAgent: orderData.registeredAgent,
      addons:          orderData.addons as object | undefined,
      orgSignature:    orderData.orgSignature,
      stripePaymentId: orderData.stripePaymentId,
      // paymentStatus y status nunca vienen del cliente — usan los defaults del schema
    },
  })
  return order
}

export const getOrders = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return orders
}

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({ where: { id } })
  return order
}

export const updateOrder = async (id: string, fields: { status?: string; notes?: string }) => {
  const order = await prisma.order.update({
    where: { id },
    data: fields
  })
  return order
}