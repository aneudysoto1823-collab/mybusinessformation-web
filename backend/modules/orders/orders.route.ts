import { Router } from 'express'
import { createOrder } from './orders.controller.ts'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Orders module funcionando' })
})

router.post('/create', createOrder)

export default router