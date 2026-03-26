import type { Request, Response } from 'express'
import { saveOrder, getOrders } from './orders.service.ts'
import { sendOrderConfirmation, sendInternalAlert } from '../notifications/notifications.service.ts'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body
    const order = await saveOrder(orderData)

    // Responder al cliente inmediatamente — emails van en background
    res.status(201).json({
      success: true,
      message: 'Orden guardada correctamente',
      data: order
    })

    // Disparar emails después de responder (no bloquean la respuesta)
    sendOrderConfirmation(order).catch((err: Error) =>
      console.error('Error enviando confirmación al cliente:', err.message)
    )
    sendInternalAlert(order).catch((err: Error) =>
      console.error('Error enviando alerta interna:', err.message)
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
