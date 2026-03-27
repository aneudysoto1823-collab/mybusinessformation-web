import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

// Lista de nombres tomados para mock (se reemplaza con Sunbiz DB en Etapa 5)
const MOCK_TAKEN = new Set([
  'SUNSHINE VENTURES LLC',
  'FLORIDA TECH SOLUTIONS LLC',
  'COASTAL BUSINESS GROUP LLC',
  'MIAMI REALTY GROUP LLC',
  'ORLANDO DIGITAL SERVICES LLC',
  'FLORIDA HOLDINGS INC',
  'SUNSTATE ENTERPRISES LLC',
  'TROPICAL INVESTMENTS LLC',
  'PALMETTO SOLUTIONS INC',
  'GULF COAST VENTURES LLC',
])

// GET /api/names/check?names=nombre1,nombre2,nombre3
// Verifica disponibilidad de hasta 10 nombres contra la base Sunbiz
// Por ahora retorna mock data — se conecta a Supabase en Etapa 5
router.get('/check', (req: Request, res: Response) => {
  const raw = req.query.names as string
  if (!raw) {
    return res.status(400).json({ success: false, message: 'Parámetro names requerido' })
  }

  const names = raw
    .split(',')
    .map(n => n.trim())
    .filter(n => n.length > 0)
    .slice(0, 10)

  const results = names.map(name => ({
    name,
    available: !MOCK_TAKEN.has(name.toUpperCase()),
  }))

  res.json({ success: true, results })
})

export default router
