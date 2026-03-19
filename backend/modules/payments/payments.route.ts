import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Payments module funcionando' })
})

export default router