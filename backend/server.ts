import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import ordersRouter from './modules/orders/orders.route.ts'
import clientsRouter from './modules/clients/clients.route.ts'
import paymentsRouter from './modules/payments/payments.route.ts'
import documentsRouter from './modules/documents/documents.route.ts'
import notificationsRouter from './modules/notifications/notifications.route.ts'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'MyBusinessFormation API corriendo correctamente' })
})

app.use('/api/orders', ordersRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/notifications', notificationsRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app