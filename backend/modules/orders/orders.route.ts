import { Router } from 'express'
import { createOrder, getAllOrders } from './orders.controller.ts'

const router = Router()

router.get('/', getAllOrders)
router.post('/create', createOrder)

export default router