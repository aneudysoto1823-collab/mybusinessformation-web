import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const saveOrder = async (orderData: any) => {
  const order = await prisma.order.create({
    data: orderData
  })
  return order
}

export const getOrders = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return orders
}