import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

let cachedAdminLoginLimiter: Ratelimit | null = null

// Lazy init: el cliente Redis se crea al primer request en runtime.
// Evita que el build crashee si las env vars faltan en build time.
// Si Upstash no está configurado retorna null y el caller hace fail-open.
function getAdminLoginLimiter(): Ratelimit | null {
  if (cachedAdminLoginLimiter) return cachedAdminLoginLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN faltantes — rate limit deshabilitado (fail-open)')
    return null
  }

  cachedAdminLoginLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:admin-login',
    analytics: true,
  })
  return cachedAdminLoginLimiter
}

// Extrae la IP del cliente desde headers de Vercel.
// x-forwarded-for puede tener múltiples IPs ("client, proxy1, proxy2") — tomamos la primera.
// Si no hay header válido, devuelve 'unknown' (todos los requests sin IP comparten bucket).
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // unix ms
  retryAfterSeconds: number
}

// Chequea si una IP excedió el límite de intentos de login admin.
// Política: 5 intentos en 15 minutos por IP, sliding window.
// Fail-OPEN: si Upstash falla, permite el request (mejor login funcional que sistema caído).
export async function checkAdminLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getAdminLoginLimiter()

  if (!limiter) {
    return { success: true, limit: 5, remaining: 5, reset: 0, retryAfterSeconds: 0 }
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip)
    const retryAfterSeconds = success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return { success, limit, remaining, reset, retryAfterSeconds }
  } catch (err) {
    console.error('[rate-limit] Upstash error, fail-open:', err)
    return { success: true, limit: 5, remaining: 5, reset: 0, retryAfterSeconds: 0 }
  }
}
