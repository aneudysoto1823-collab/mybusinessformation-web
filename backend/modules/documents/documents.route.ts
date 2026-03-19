import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Documents module funcionando' })
})

export default router