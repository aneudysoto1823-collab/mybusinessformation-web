import { Router, Request, Response } from 'express'
import { getOrderById } from '../orders/orders.service.ts'
import {
  generateOperatingAgreement,
  generateEINSS4,
  generateBOIFiling,
  generateArticlesOfOrganization,
  generateDBA,
} from './documents.service.ts'

const router = Router()

function sendPDF(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', buffer.length)
  res.send(buffer)
}

function safeName(name: string): string {
  return (name || 'document').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()
}

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Documents module funcionando' })
})

router.get('/:orderId/operating-agreement', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.orderId as string)
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    const pdf = await generateOperatingAgreement(order)
    sendPDF(res, pdf, `operating-agreement-${safeName(order.companyName)}.pdf`)
  } catch (err) {
    console.error('Error generating Operating Agreement:', err)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

router.get('/:orderId/ein-ss4', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.orderId as string)
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    const pdf = await generateEINSS4(order)
    sendPDF(res, pdf, `ein-ss4-${safeName(order.companyName)}.pdf`)
  } catch (err) {
    console.error('Error generating EIN SS-4:', err)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

router.get('/:orderId/boi-filing', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.orderId as string)
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    const pdf = await generateBOIFiling(order)
    sendPDF(res, pdf, `boi-filing-${safeName(order.companyName)}.pdf`)
  } catch (err) {
    console.error('Error generating BOI Filing:', err)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

router.get('/:orderId/articles-of-organization', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.orderId as string)
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    const pdf = await generateArticlesOfOrganization(order)
    sendPDF(res, pdf, `articles-of-organization-${safeName(order.companyName)}.pdf`)
  } catch (err) {
    console.error('Error generating Articles of Organization:', err)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

router.get('/:orderId/dba', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.orderId as string)
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    const pdf = await generateDBA(order)
    sendPDF(res, pdf, `dba-${safeName(order.companyName)}.pdf`)
  } catch (err) {
    console.error('Error generating DBA:', err)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

export default router
