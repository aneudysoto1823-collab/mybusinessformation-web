import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import namesRouter from './modules/names/names.route'

dotenv.config()

console.log('INTERNAL_API_KEY loaded:', !!process.env.INTERNAL_API_KEY)

const app = express()
const PORT = process.env.PORT || 4000

const ALLOWED_ORIGINS = [
  'https://opabiz.com',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
]

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json())

const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  const expected = process.env.INTERNAL_API_KEY
  const received = Array.isArray(apiKey) ? apiKey[0] : apiKey
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

// Decisión arquitectural Opción B (2026-05-13): toda la lógica de negocio vive
// en Vercel. Este server Express queda dormido hasta Etapa 5 (Sunbiz), que es
// el único caso de uso que justifica un proceso persistente con queries pesadas
// a PostgreSQL. Ver LOGICA_DE_NEGOCIO/00_arquitectura_tecnica_de_una_orden.md.
app.use('/api', requireApiKey)
app.use('/api/names', namesRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

export default app
