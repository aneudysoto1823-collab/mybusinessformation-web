import { Router } from 'express'
import { createOrder, getAllOrders, getOrderByIdController, updateOrderController } from './orders.controller.ts'

const router = Router()

router.get('/', getAllOrders)
router.post('/create', createOrder)
router.get('/:id', getOrderByIdController)
router.patch('/:id', updateOrderController)

export default router