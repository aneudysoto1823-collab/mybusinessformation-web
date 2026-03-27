import type { Request, Response } from 'express'
import { saveOrder, getOrders, getOrderById, updateOrder } from './orders.service.ts'
import { sendOrderConfirmation } from '../notifications/notifications.service.ts'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body
    const order = await saveOrder(orderData)

    res.status(201).json({
      success: true,
      message: 'Orden guardada correctamente',
      data: order
    })

    sendOrderConfirmation(order).catch((err: Error) =>
      console.error('Error enviando confirmación al cliente:', err.message)
    )
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al guardar la orden'
    })
  }
}

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await getOrders()
    res.status(200).json({
      success: true,
      data: orders
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes'
    })
  }
}

export const getOrderByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const order = await getOrderById(id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Orden no encontrada' })
      return
    }
    res.status(200).json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la orden' })
  }
}

export const updateOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const order = await updateOrder(id, { status, notes })
    res.status(200).json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar la orden' })
  }
}