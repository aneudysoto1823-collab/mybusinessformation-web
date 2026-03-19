import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Clients module funcionando' })
})

export default router