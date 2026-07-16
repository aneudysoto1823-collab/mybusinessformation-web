// Cliente a la Base B de Turso (cocina de marketing — doc 31).
// Separada de la Base A (opabiz-sunbiz-search, produccion) para que ningun
// proceso pesado de marketing afecte la busqueda de nombres en vivo.

import { createClient, type Client } from '@libsql/client'

let cached: Client | null = null

export function getMarketingClient(): Client {
  if (cached) return cached
  const url = process.env.TURSO_MARKETING_URL
  const authToken = process.env.TURSO_MARKETING_AUTH_TOKEN
  if (!url || !authToken) {
    throw new Error('Turso marketing no configurado: faltan TURSO_MARKETING_URL o TURSO_MARKETING_AUTH_TOKEN')
  }
  cached = createClient({ url, authToken })
  return cached
}
