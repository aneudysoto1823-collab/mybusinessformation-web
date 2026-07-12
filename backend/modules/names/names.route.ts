import { Router } from 'express'
import type { Request, Response } from 'express'
import { checkNameAvailability } from '../../lib/sunbiz-namecheck'

const router = Router()

// GET /api/names/check?names=nombre1,nombre2,nombre3
// Verifica disponibilidad de hasta 10 nombres contra Turso (Sunbiz, 3.9M
// LLC/Corp ACTIVE de Florida) — mismo chequeo que usa /api/orders al crear
// una orden. Antes devolvía disponibilidad contra una lista mock hardcodeada
// de 10 nombres (nunca se conectó a la DB real), lo que podía llevar al
// staff a decirle a un cliente que un nombre estaba disponible sin serlo.
//
// ⚠️ Requiere TURSO_DATABASE_URL y TURSO_AUTH_TOKEN configuradas en las env
// vars de Railway (este server), además de en Vercel — si faltan acá,
// checkNameAvailability() nunca throws: degrada a available=true con un
// error interno, así que un nombre tomado podría mostrarse como disponible
// en silencio. Confirmar que ambas están cargadas en Railway antes de confiar
// en este endpoint en producción.
router.get('/check', async (req: Request, res: Response) => {
  const raw = req.query.names as string
  if (!raw) {
    return res.status(400).json({ success: false, message: 'Parámetro names requerido' })
  }

  const names = raw
    .split(',')
    .map(n => n.trim())
    .filter(n => n.length > 0)
    .slice(0, 10)

  const checks = await Promise.all(names.map(name => checkNameAvailability(name)))
  const results = checks.map((check, i) => ({
    name: names[i],
    available: check.available,
    // Detalle extra por si el admin quiere ver por qué (ej. coincidencia exacta).
    exactCount: check.exactCount,
    example: check.example,
    error: check.error,
  }))

  res.json({ success: true, results })
})

export default router
