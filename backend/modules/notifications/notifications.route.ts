import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  sendOrderConfirmation,
  sendAllNamesTaken,
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

// POST /api/notifications/test-names-taken — prueba email de nombres tomados
router.post('/test-names-taken', async (req: Request, res: Response) => {
  try {
    await sendAllNamesTaken({
      id: 'TEST-002',
      firstName: 'Test',
      lastName: 'User',
      email: req.body.email || 'aneudysoto1823@gmail.com',
      names: ['Florida Tech Solutions LLC', 'Sunshine Digital LLC', 'Coastal Business Group LLC']
    })
    res.json({ success: true, message: 'Email de nombres tomados enviado (cliente + admin)' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/test-full-flow — simula el flujo completo (4 emails de una vez)
router.post('/test-full-flow', async (req: Request, res: Response) => {
  const clientEmail = req.body.clientEmail || 'aneudysoto1823@gmail.com'
  const order = {
    id: 'TEST-FULL-001',
    firstName: 'Ana',
    lastName: 'Garcia',
    email: clientEmail,
    companyName: 'Sunshine Ventures LLC',
    package: 'Standard',
    amount: 149,
    phone: '+1 305-000-0000'
  }

  const results: Record<string, string> = {}

  try {
    // Email 1 — Confirmación al cliente
    await sendOrderConfirmation(order)
    results['email_1_confirmation'] = 'enviado'
  } catch (e: any) {
    results['email_1_confirmation'] = `error: ${e.message}`
  }

  try {
    // Email 2 — Nombres tomados (cliente + alerta admin)
    await sendAllNamesTaken({
      id: order.id,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      names: ['Florida Tech Solutions LLC', 'Sunshine Digital LLC', 'Coastal Business Group LLC']
    })
    results['email_2_names_taken_client'] = 'enviado'
    results['email_2_names_taken_admin'] = 'enviado'
  } catch (e: any) {
    results['email_2_names_taken_client'] = `error: ${e.message}`
    results['email_2_names_taken_admin'] = `error: ${e.message}`
  }

  try {
    // Email 3 — Certificate of Formation al cliente
    await sendCertificateDelivery(order)
    results['email_3_certificate'] = 'enviado'
  } catch (e: any) {
    results['email_3_certificate'] = `error: ${e.message}`
  }

  const allOk = Object.values(results).every(v => v === 'enviado')
  res.status(allOk ? 200 : 207).json({
    success: allOk,
    clientEmail,
    results
  })
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
