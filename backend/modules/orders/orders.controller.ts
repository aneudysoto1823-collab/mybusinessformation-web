import type { Request, Response } from 'express'
import { saveOrder, getOrders } from './orders.service.ts'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body
    const order = await saveOrder(orderData)
    res.status(201).json({
      success: true,
      message: 'Orden guardada correctamente',
      data: order
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al guardar la orden'
    })
  }
}

export const getAllOrders = async (req: Request, res: Response) => {
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