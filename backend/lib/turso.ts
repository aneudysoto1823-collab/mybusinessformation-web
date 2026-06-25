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

export interface TursoCompany {
  document_number: string
  entity_name: string | null
  entity_type: string | null
  status: string | null
  filing_date: string | null
  principal_address: string | null
  principal_city: string | null
  principal_state: string | null
  principal_zip: string | null
  mailing_address: string | null
  registered_agent_name: string | null
  registered_agent_address: string | null
}

// Busca una empresa de Florida por su número de documento en la tabla
// sunbiz_corps de Turso (3.5M registros). Lectura defensiva por nombre de
// columna: si una columna no existe en la tabla, devuelve null para ese campo
// (no rompe). Devuelve null si no se encuentra la empresa.
export async function lookupCompanyByDocument(documentNumber: string): Promise<TursoCompany | null> {
  const doc = documentNumber.trim().toUpperCase()
  if (!doc) return null

  const res = await getTurso().execute({
    sql: 'SELECT * FROM sunbiz_corps WHERE document_number = ? LIMIT 1',
    args: [doc],
  })
  const row = res.rows[0]
  if (!row) return null

  const s = (k: string): string | null => {
    const v = (row as Record<string, unknown>)[k]
    return v == null ? null : String(v)
  }

  return {
    document_number:          s('document_number') || doc,
    entity_name:              s('entity_name'),
    entity_type:              s('entity_type'),
    status:                   s('status'),
    filing_date:              s('filing_date'),
    principal_address:        s('principal_address'),
    principal_city:           s('principal_city'),
    principal_state:          s('principal_state'),
    principal_zip:            s('principal_zip'),
    mailing_address:          s('mailing_address'),
    registered_agent_name:    s('registered_agent_name'),
    registered_agent_address: s('registered_agent_address'),
  }
}
