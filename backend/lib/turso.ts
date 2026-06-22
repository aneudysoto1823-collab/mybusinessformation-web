// Cliente de Turso para Sunbiz (3.5M empresas FL).
//
// Lazy init: el cliente se crea al primer uso. Esto evita que el build de
// Vercel falle por falta de env vars (mismo patrón que getResend en
// notifications.ts y getSupabaseAdmin en supabase.ts).
//
// Arquitectura completa: LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups_opabiz.md

import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getTurso(): Client {
  if (_client) return _client

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url || !authToken) {
    throw new Error(
      'Turso no configurado: faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en env vars',
    )
  }

  _client = createClient({ url, authToken })
  return _client
}
