import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import ordersRouter from './modules/orders/orders.route.ts'
import clientsRouter from './modules/clients/clients.route.ts'
import paymentsRouter from './modules/payments/payments.route.ts'
import documentsRouter from './modules/documents/documents.route.ts'
import notificationsRouter from './modules/notifications/notifications.route.ts'
import namesRouter from './modules/names/names.route.ts'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

const ALLOWED_ORIGINS = [
  'https://mybusinessformation-web.vercel.app',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
]

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json())

const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  const expected = process.env.INTERNAL_API_KEY
  const received = Array.isArray(apiKey) ? apiKey[0] : apiKey
  console.log(`[requireApiKey] received: "${received?.substring(0, 8)}...${received?.slice(-4)}" len=${received?.length}`)
  console.log(`[requireApiKey] expected: "${expected?.substring(0, 8)}...${expected?.slice(-4)}" len=${expected?.length}`)
  if (!received || received !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.get('/', (_req, res) => {
  res.json({ message: 'MyBusinessFormation API corriendo correctamente' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', requireApiKey)

app.use('/api/orders', ordersRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/names', namesRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app