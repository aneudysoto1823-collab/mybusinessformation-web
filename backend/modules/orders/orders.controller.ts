import type { Request, Response } from 'express'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body
    console.log('Nueva orden recibida:', orderData)
    res.status(201).json({
      success: true,
      message: 'Orden recibida correctamente',
      data: orderData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al procesar la orden'
    })
  }
}