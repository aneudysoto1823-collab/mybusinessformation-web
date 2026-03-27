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