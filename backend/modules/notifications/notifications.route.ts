import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  sendOrderConfirmation,
  sendAllNamesTaken,
  sendCertificateDelivery,
  sendSuggestNames
} from './notifications.service.ts'
import { getOrderById } from '../orders/orders.service.ts'

const router = Router()

// GET /api/notifications — health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Notifications module OK',
    resend: process.env.RESEND_API_KEY ? 'configured' : 'missing key'
  })
})

// POST /api/notifications/test-full-flow
// Simula el flujo completo: envía los 4 emails de una vez
//   - Cliente recibe: confirmación + nombres tomados + certificate (3 emails)
//   - Admin  recibe: alerta nombres tomados (1 email)
router.post('/test-full-flow', async (req: Request, res: Response) => {
  const clientEmail = req.body.clientEmail || 'aneudysoto1823@gmail.com'

  const order = {
    id: 'TEST-FULL-001',
    firstName: 'Ana',
    lastName: 'Garcia',
    email: clientEmail,
    companyName: 'Sunshine Ventures LLC',
    package: 'Standard'
  }

  const results: Record<string, string> = {}

  // Email 1 — Confirmación de orden al cliente
  try {
    await sendOrderConfirmation(order)
    results['1_confirmacion_cliente'] = 'enviado'
  } catch (e: any) {
    results['1_confirmacion_cliente'] = `error: ${e.message}`
  }

  // Emails 2 y 3 — Nombres tomados: cliente + admin
  try {
    await sendAllNamesTaken({
      id: order.id,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      names: ['Florida Tech Solutions LLC', 'Sunshine Digital LLC', 'Coastal Business Group LLC']
    })
    results['2_nombres_tomados_cliente'] = 'enviado'
    results['3_nombres_tomados_admin'] = 'enviado'
  } catch (e: any) {
    results['2_nombres_tomados_cliente'] = `error: ${e.message}`
    results['3_nombres_tomados_admin'] = `error: ${e.message}`
  }

  // Email 4 — Certificate of Formation al cliente
  try {
    await sendCertificateDelivery(order)
    results['4_certificate_cliente'] = 'enviado'
  } catch (e: any) {
    results['4_certificate_cliente'] = `error: ${e.message}`
  }

  const allOk = Object.values(results).every(v => v === 'enviado')

  res.status(allOk ? 200 : 207).json({
    success: allOk,
    destinatarios: {
      cliente: `${clientEmail} (3 emails)`,
      admin: 'aneurysoto@gmail.com (1 email)'
    },
    resultados: results
  })
})

// POST /api/notifications/test-names-taken — prueba rápida del email de nombres tomados
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

// ── Endpoints de producción ──────────────────────────────────────────────────

// POST /api/notifications/order-confirmation
// Dispara al guardar una orden nueva (desde orders.controller.ts)
router.post('/order-confirmation', async (req: Request, res: Response) => {
  try {
    const { id, firstName, lastName, email, companyName, package: pkg } = req.body
    if (!id || !email) {
      return res.status(400).json({ success: false, message: 'Faltan campos: id, email' })
    }
    await sendOrderConfirmation({ id, firstName, lastName, email, companyName, package: pkg })
    res.json({ success: true, message: `Confirmación enviada a ${email}` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/names-taken
// Dispara cuando el equipo verifica en Sunbiz y los 3 nombres están tomados
router.post('/names-taken', async (req: Request, res: Response) => {
  try {
    const { id, firstName, lastName, email, names } = req.body
    if (!id || !email || !Array.isArray(names) || names.length !== 3) {
      return res.status(400).json({ success: false, message: 'Faltan campos: id, email, names (array de 3)' })
    }
    await sendAllNamesTaken({ id, firstName, lastName, email, names: names as [string, string, string] })
    res.json({ success: true, message: `Aviso enviado a ${email} y alerta a admin` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/certificate
// Dispara cuando el negocio es aprobado por el Estado de Florida
router.post('/certificate', async (req: Request, res: Response) => {
  try {
    const { id, firstName, email, companyName } = req.body
    if (!id || !email) {
      return res.status(400).json({ success: false, message: 'Faltan campos: id, email' })
    }
    await sendCertificateDelivery({ id, firstName, email, companyName })
    res.json({ success: true, message: `Certificate enviado a ${email}` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/notifications/suggest-names
// El equipo encontró nombres alternativos disponibles — los envía al cliente
router.post('/suggest-names', async (req: Request, res: Response) => {
  try {
    const { orderId, availableNames } = req.body
    if (!orderId || !Array.isArray(availableNames) || availableNames.length === 0) {
      return res.status(400).json({ success: false, message: 'Faltan campos: orderId, availableNames (array no vacío)' })
    }
    const order = await getOrderById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' })
    }
    await sendSuggestNames(
      { id: order.id, firstName: order.firstName, email: order.email, companyName: order.companyName },
      availableNames
    )
    res.json({ success: true, message: `Sugerencias enviadas a ${order.email}` })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
