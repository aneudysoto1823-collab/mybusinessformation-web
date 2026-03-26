import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  sendOrderConfirmation,
  sendStatusUpdate,
  sendCertificateDelivery
} from './notifications.service.ts'

const router = Router()

// GET /api/notifications — health check
router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Notifications module OK', resend: process.env.RESEND_API_KEY ? 'configured' : 'missing key' })
})

// POST /api/notifications/test-confirmation — envía email de prueba
router.post('/test-confirmation', async (req: Request, res: Response) => {
  try {
    await sendOrderConfirmation({
      id: 'TEST-001',
      firstName: 'Test',
      lastName: 'User',
      email: req.body.email || 'aneudysoto1823@gmail.com',
      companyName: 'Test Company LLC',
      package: 'Standard'
    })
    res.json({ success: true, message: 'Email de confirmación enviado' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/status-update — actualizar estado y notificar cliente
router.post('/status-update', async (req: Request, res: Response) => {
  try {
    const { orderId, firstName, email, companyName, status } = req.body
    if (!orderId || !email || !status) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: orderId, email, status' })
    }
    await sendStatusUpdate({ id: orderId, firstName, email, companyName, status })
    res.json({ success: true, message: `Email de estado "${status}" enviado a ${email}` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/certificate — enviar Certificate of Formation
router.post('/certificate', async (req: Request, res: Response) => {
  try {
    const { orderId, firstName, email, companyName } = req.body
    if (!orderId || !email) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: orderId, email' })
    }
    await sendCertificateDelivery({ id: orderId, firstName, email, companyName })
    res.json({ success: true, message: `Email de Certificate enviado a ${email}` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
