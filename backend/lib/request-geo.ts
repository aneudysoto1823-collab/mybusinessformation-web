import type { NextRequest } from 'next/server'

// País y ciudad aproximados de quien llenó la orden, según la IP del request.
// Los headers los pone Vercel en producción; en dev local no existen y queda null.
// x-vercel-ip-city viene URL-encoded ("Santo%20Domingo").
export function getRequestGeo(req: NextRequest): { ipCountry: string | null; ipCity: string | null } {
  const country = (req.headers.get('x-vercel-ip-country') ?? '').trim().toUpperCase()
  let city = (req.headers.get('x-vercel-ip-city') ?? '').trim()
  try { city = decodeURIComponent(city) } catch { /* se deja tal cual */ }
  return {
    ipCountry: country || null,
    ipCity:    city || null,
  }
}
