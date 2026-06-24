import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// ── Helper interno: crea (o reusa cached) un Ratelimit con la config dada ────
const limiterCache = new Map<string, Ratelimit | null>()

function getLimiter(config: {
  cacheKey: string
  prefix: string
  limit: number
  window: `${number} ${'s' | 'm' | 'h' | 'd'}` // typed por Upstash
}): Ratelimit | null {
  if (limiterCache.has(config.cacheKey)) {
    return limiterCache.get(config.cacheKey) ?? null
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn(`[rate-limit:${config.prefix}] UPSTASH faltante — fail-open`)
    limiterCache.set(config.cacheKey, null)
    return null
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
    analytics: true,
  })
  limiterCache.set(config.cacheKey, limiter)
  return limiter
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

// Genérico que aplica el limiter o fail-open si Upstash falla.
async function check(limiter: Ratelimit | null, ip: string, fallbackLimit: number): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: fallbackLimit, remaining: fallbackLimit, reset: 0, retryAfterSeconds: 0 }
  }
  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip)
    const retryAfterSeconds = success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return { success, limit, remaining, reset, retryAfterSeconds }
  } catch (err) {
    console.error('[rate-limit] Upstash error, fail-open:', err)
    return { success: true, limit: fallbackLimit, remaining: fallbackLimit, reset: 0, retryAfterSeconds: 0 }
  }
}

// ── Login admin: 5 intentos / 15 min / IP ────────────────────────────────────
export async function checkAdminLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'admin-login',
    prefix: 'rl:admin-login',
    limit: 5,
    window: '15 m',
  })
  return check(limiter, ip, 5)
}

// ── POST /api/orders: 10 órdenes / hora / IP ─────────────────────────────────
// Previene spam de envío de formularios. Una persona real no envía 11 órdenes/h.
export async function checkOrdersRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'orders',
    prefix: 'rl:orders',
    limit: 10,
    window: '1 h',
  })
  return check(limiter, ip, 10)
}

// ── POST /api/chat: 30 requests / hora / IP ──────────────────────────────────
// Claudia chatbot. Usa Claude API (caro). 30 mensajes/h es generoso para uso humano.
export async function checkChatRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'chat',
    prefix: 'rl:chat',
    limit: 30,
    window: '1 h',
  })
  return check(limiter, ip, 30)
}

// ── POST /api/auth/recover: 3 requests / hora / IP ───────────────────────────
// Magic link de recovery del admin. Solo hay 1 admin → en uso real el endpoint
// se llama ~1 vez por semana (cuando alguien olvida password). 3/h es generoso
// para humanos y muy restrictivo para un atacante que quiera spamear el inbox.
export async function checkAuthRecoverRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'auth-recover',
    prefix: 'rl:auth-recover',
    limit: 3,
    window: '1 h',
  })
  return check(limiter, ip, 3)
}

// ── GET /api/sunbiz/name-check: 60 requests / minuto / IP ────────────────────
// Search de disponibilidad de nombre desde el form. El frontend hace debounce
// 300ms + min 3 chars, asi que un usuario tipeando rapido manda ~10-20 req/min
// como mucho. 60/min es generoso y mata bots/scrapers que quieran extraer la
// base entera.
export async function checkNameSearchRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'name-search',
    prefix: 'rl:name-search',
    limit: 60,
    window: '1 m',
  })
  return check(limiter, ip, 60)
}

// ── POST /api/contact: 5 requests / hora / IP ────────────────────────────────
// Form público del Contact Us. Un cliente legítimo no manda más de 1-2 mensajes
// por hora; un bot spammer queda neutralizado. Si Upstash no responde, fail-open
// (mismo patrón que los demás limiters).
export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter({
    cacheKey: 'contact',
    prefix: 'rl:contact',
    limit: 5,
    window: '1 h',
  })
  return check(limiter, ip, 5)
}
