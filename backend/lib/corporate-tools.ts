// Cliente de la API de RegisteredAgentsInc / Corporate Tools.
//
// Base URL unica (test y prod): https://api.corporatetools.com
// Auth: JWT HS256 firmado per-request. Header custom "access_key" en el JWT
// header, payload { path, content: SHA256(queryString + body) }. Header HTTP
// Authorization: "Bearer <token>". Verificado empiricamente en Fase 0
// (scripts/corptools-test-fase0*.mjs).
//
// La eleccion TEST vs PROD la resuelve CORPTOOLS_ENV en runtime — ambos pares
// de keys y las URLs de website viven en env vars separadas. La URL del
// website es "www.registeredagentsinc.com" (string exacto, sin protocolo, sin
// slash — el server hace match de texto estricto).

import crypto from 'node:crypto'
import { SignJWT } from 'jose'

const BASE_URL = 'https://api.corporatetools.com'

// Cache in-memory del product_id de RA para Florida (por env). Se refresca a
// las 24h. Solo es un lookup constante — no vale hacer round-trip por orden.
type ProductCache = { id: string; price: number; fetchedAt: number }
const PRODUCT_CACHE: Record<'test' | 'prod', ProductCache | null> = {
  test: null,
  prod: null,
}
const PRODUCT_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ────────────────────────────────────────────────────────────────────────────
// Resolucion de credenciales segun CORPTOOLS_ENV
// ────────────────────────────────────────────────────────────────────────────

type CtEnv = 'test' | 'prod'

function getEnv(): CtEnv {
  const raw = (process.env.CORPTOOLS_ENV || '').toLowerCase()
  if (raw !== 'test' && raw !== 'prod') {
    throw new Error(`CORPTOOLS_ENV debe ser 'test' o 'prod'. Actual: "${raw}"`)
  }
  return raw
}

function getCredentials(env: CtEnv): { accessKey: string; secretKey: string; websiteUrl: string } {
  const suffix = env.toUpperCase()
  const accessKey = process.env[`CORPTOOLS_ACCESS_KEY_${suffix}`]
  const secretKey = process.env[`CORPTOOLS_SECRET_KEY_${suffix}`]
  const websiteUrl = process.env[`CORPTOOLS_WEBSITE_URL_${suffix}`]
  if (!accessKey || !secretKey) {
    throw new Error(`Faltan CORPTOOLS_ACCESS_KEY_${suffix} o CORPTOOLS_SECRET_KEY_${suffix} en env`)
  }
  if (!websiteUrl) {
    throw new Error(`Falta CORPTOOLS_WEBSITE_URL_${suffix} en env`)
  }
  return { accessKey, secretKey, websiteUrl }
}

// ────────────────────────────────────────────────────────────────────────────
// Firma y wrapper HTTP
// ────────────────────────────────────────────────────────────────────────────

async function signJwt(pathOnly: string, hashInput: string, accessKey: string, secretKey: string) {
  const content = crypto.createHash('sha256').update(hashInput).digest('hex')
  const secret = new TextEncoder().encode(secretKey)
  return await new SignJWT({ path: pathOnly, content })
    .setProtectedHeader({ alg: 'HS256', access_key: accessKey })
    .sign(secret)
}

type CtResponse<T = unknown> = { status: number; ok: boolean; data: T | Record<string, unknown> | string }

async function ctFetch<T = unknown>(
  method: 'GET' | 'POST',
  pathOnly: string,
  opts: { query?: Record<string, string>; body?: unknown } = {},
): Promise<CtResponse<T>> {
  const { accessKey, secretKey } = getCredentials(getEnv())
  const queryString = opts.query ? new URLSearchParams(opts.query).toString() : ''
  const bodyString = opts.body !== undefined ? JSON.stringify(opts.body) : ''
  const fullUrl = queryString ? `${BASE_URL}${pathOnly}?${queryString}` : `${BASE_URL}${pathOnly}`
  const token = await signJwt(pathOnly, queryString + bodyString, accessKey, secretKey)

  const res = await fetch(fullUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(bodyString ? { body: bodyString } : {}),
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data: data as T }
}

// ────────────────────────────────────────────────────────────────────────────
// Endpoints — funciones publicas
// ────────────────────────────────────────────────────────────────────────────

export type EntityType = 'llc' | 'corp'

const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  llc: 'Limited Liability Company',
  corp: 'Corporation',
}

/**
 * GET /account — confirma que las keys funcionan. Util para health-checks.
 * No cachear, no se llama en el hot path.
 */
export async function getAccount() {
  return ctFetch('GET', '/account')
}

/**
 * POST /companies — crea una company en la cuenta RAI del env activo.
 * Devuelve el company_id de la primera company creada (batch de 1).
 *
 * Body shape (batch endpoint):
 *   { "companies": [{ name, entity_type, home_state }],
 *     "duplicate_name_allowed": false }
 *
 * IMPORTANTE: si CORPTOOLS_ENV=test, el `name` DEBE empezar con "TEST " para
 * que el equipo de RAI pueda identificar y filtrar las pruebas. El caller es
 * responsable de esto — este metodo no lo agrega automaticamente para evitar
 * mutar nombres reales por error si se usa mal el env.
 */
export async function createCompany(params: {
  name: string
  entityType: EntityType
  homeState?: string
}): Promise<{ companyId: string; raw: unknown }> {
  const body = {
    companies: [
      {
        name: params.name,
        entity_type: ENTITY_TYPE_LABEL[params.entityType],
        home_state: params.homeState || 'Florida',
      },
    ],
    duplicate_name_allowed: false,
  }
  const res = await ctFetch<{ success: boolean; result: unknown }>('POST', '/companies', { body })
  if (!res.ok || (res.data as { success?: boolean }).success === false) {
    throw new Error(`POST /companies fallo: status ${res.status}, body ${JSON.stringify(res.data)}`)
  }
  const result = (res.data as { result?: unknown }).result
  const list = Array.isArray(result) ? result : (result && typeof result === 'object' ? [result] : [])
  const first = list[0] as { id?: string; company_id?: string } | undefined
  const companyId = first?.id || first?.company_id
  if (!companyId) {
    throw new Error(`POST /companies no devolvio company_id. Body: ${JSON.stringify(res.data)}`)
  }
  return { companyId, raw: res.data }
}

/**
 * POST /services — asigna el servicio de RA a una company existente.
 * Body: { company_id, jurisdictions: ["Florida"] }.
 * Devuelve el service_id del servicio creado (primer elemento).
 * Genera una factura del lado de RAI que hay que pagar manualmente en el portal.
 */
export async function assignRaService(params: {
  companyId: string
  jurisdictions?: string[]
}): Promise<{ serviceId: string; raw: unknown }> {
  const body = {
    company_id: params.companyId,
    jurisdictions: params.jurisdictions || ['Florida'],
  }
  const res = await ctFetch<{ success: boolean; result: unknown }>('POST', '/services', { body })
  if (!res.ok || (res.data as { success?: boolean }).success === false) {
    throw new Error(`POST /services fallo: status ${res.status}, body ${JSON.stringify(res.data)}`)
  }
  const result = (res.data as { result?: unknown }).result
  const list = Array.isArray(result) ? result : (result && typeof result === 'object' ? [result] : [])
  const first = list[0] as { id?: string; service_id?: string } | undefined
  const serviceId = first?.id || first?.service_id
  if (!serviceId) {
    throw new Error(`POST /services no devolvio service_id. Body: ${JSON.stringify(res.data)}`)
  }
  return { serviceId, raw: res.data }
}

/**
 * GET /invoices?company_id=... — lista las facturas de una company.
 * Se usa despues de assignRaService para obtener el invoice_id que hay que
 * pagar manualmente en el portal.
 */
export async function getInvoicesByCompany(companyId: string) {
  const res = await ctFetch<{ success: boolean; result: unknown }>('GET', '/invoices', {
    query: { company_id: companyId },
  })
  if (!res.ok) {
    throw new Error(`GET /invoices fallo: status ${res.status}, body ${JSON.stringify(res.data)}`)
  }
  const result = (res.data as { result?: unknown }).result
  const invoices = Array.isArray(result) ? result : []
  return { invoices, raw: res.data }
}

/**
 * GET /services/:id/info — trae el detalle del servicio, incluyendo la
 * direccion asignada (una vez que la factura esta pagada). Es el endpoint que
 * el cron nocturno consulta hasta que aparece la direccion.
 */
export async function getServiceInfo(serviceId: string) {
  const res = await ctFetch<{ success: boolean; result: unknown }>('GET', `/services/${serviceId}/info`)
  if (!res.ok) {
    throw new Error(`GET /services/${serviceId}/info fallo: status ${res.status}, body ${JSON.stringify(res.data)}`)
  }
  return { data: res.data, raw: res.data }
}

/**
 * GET /registered-agent-products — devuelve el product_id + precio del RA
 * para Florida, cacheado en memoria 24h. Ademas de por eficiencia, este
 * lookup casi nunca cambia — un cache in-memory por lambda alcanza.
 * NOTA: hoy no lo usa el flujo principal (los IDs de producto no se pasan a
 * POST /services), pero queda expuesto para health-checks y por si se
 * necesita en el futuro.
 */
export async function getFloridaRaProduct(): Promise<ProductCache> {
  const env = getEnv()
  const cached = PRODUCT_CACHE[env]
  const now = Date.now()
  if (cached && now - cached.fetchedAt < PRODUCT_CACHE_TTL_MS) {
    return cached
  }
  const { websiteUrl } = getCredentials(env)
  const res = await ctFetch<{ success: boolean; result: unknown }>('GET', '/registered-agent-products', {
    query: { url: websiteUrl },
  })
  if (!res.ok) {
    throw new Error(`GET /registered-agent-products fallo: status ${res.status}`)
  }
  const list = Array.isArray((res.data as { result?: unknown }).result)
    ? (res.data as { result: Array<{ id?: string; jurisdiction?: string; price?: number }> }).result
    : []
  const florida = list.find(p => p?.jurisdiction === 'Florida')
  if (!florida?.id) {
    throw new Error('Florida no esta en la lista de productos RA')
  }
  const record: ProductCache = { id: florida.id, price: Number(florida.price) || 0, fetchedAt: now }
  PRODUCT_CACHE[env] = record
  return record
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de introspeccion (solo para diagnostico, no para el hot path)
// ────────────────────────────────────────────────────────────────────────────

export function getCtEnv(): CtEnv {
  return getEnv()
}
