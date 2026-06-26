// UPSERT batch a la tabla sunbiz_corps de Turso (Base A produccion).
//
// REGLAS CRITICAS:
//  - name_normalized se calcula con lib/sunbiz-normalize.ts (la MISMA
//    funcion validada que usa la busqueda). Si no se llena, la LLC
//    nueva NO se encuentra en la busqueda. CRITICO.
//  - El cron solo trae cruda + actualiza status. NO clasifica ni enriquece.
//  - procesada=0 en TODAS las nuevas (sera leida por Bloque 2 despues).
//  - Batch ~100 (no fila por fila).
//  - INSERT OR REPLACE garantiza idempotencia ante re-runs de un mismo dia.
//  - Los triggers FTS5 ai/ad/au se ocupan del indice de busqueda solos.

import { createClient, type Client } from '@libsql/client'
import { normalizeName } from '../sunbiz-normalize'
import type { ParsedRecord } from './parser'

const BATCH_SIZE = 100

function getClient(): Client {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN missing')
  return createClient({ url, authToken })
}

// 36 columnas a escribir (todas excepto data_source que es fijo, last_updated
// que es timestamp del cron, y filing_type que el schema viejo guarda como
// codigo bruto — usamos filing_type_raw del parser).
const COLS = [
  'document_number', 'entity_name', 'entity_type', 'status', 'filing_type', 'filing_date',
  'principal_address', 'principal_city', 'principal_state', 'principal_zip', 'principal_country',
  'mail_address', 'mail_city', 'mail_state', 'mail_zip', 'mail_country',
  'registered_agent_name', 'registered_agent_type', 'registered_agent_address',
  'registered_agent_city', 'registered_agent_state', 'registered_agent_zip',
  'data_source', 'last_updated', 'name_normalized',
  // Cols nuevas 2026-06-25
  'officers', 'officer_count',
  'principal_addr1', 'principal_addr2', 'mail_addr1', 'mail_addr2',
  'fei', 'last_tx_date', 'state_country', 'more_than_six',
  'procesada', 'fecha_contactada',
] as const

const PLACEHOLDERS = COLS.map(() => '?').join(', ')
const UPSERT_SQL = `INSERT OR REPLACE INTO sunbiz_corps (${COLS.join(', ')}) VALUES (${PLACEHOLDERS})`

export interface UpsertResult {
  inserted: number
  failed: number
  failedExamples: { doc: string; err: string }[]
}

/**
 * Inserta/reemplaza un batch de records parseados a sunbiz_corps.
 * Calcula name_normalized usando lib/sunbiz-normalize.ts (CRITICO).
 */
export async function upsertBatch(records: ParsedRecord[]): Promise<UpsertResult> {
  const client = getClient()
  const result: UpsertResult = { inserted: 0, failed: 0, failedExamples: [] }
  const now = new Date().toISOString()

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE)
    const statements = chunk.map(r => {
      const officersJson = r.officers.length ? JSON.stringify(r.officers) : null
      // CRITICO: name_normalized usa la misma funcion que la busqueda
      const nameNormalized = normalizeName(r.entity_name)
      const args = [
        r.document_number,
        r.entity_name,
        r.entity_type,
        r.status,
        r.filing_type_raw,        // codigo crudo: FLAL/FORL/DOMP/etc.
        r.filing_date,
        r.principal_address,      // concatenada (compat)
        r.principal_city,
        r.principal_state,
        r.principal_zip,
        r.principal_country,
        r.mailing_address,        // concatenada (compat)
        r.mail_city,
        r.mail_state,
        r.mail_zip,
        r.mail_country,
        r.registered_agent_name,
        r.registered_agent_type,
        r.registered_agent_address,
        r.registered_agent_city,
        r.registered_agent_state,
        r.registered_agent_zip,
        'florida_sftp_daily',      // data_source
        now,                       // last_updated
        nameNormalized,            // CRITICO para la busqueda
        // Cols nuevas crudas
        officersJson,
        r.officer_count,
        r.principal_addr1,
        r.principal_addr2,
        r.mail_addr1,
        r.mail_addr2,
        r.fei,
        r.last_tx_date,
        r.state_country,
        r.more_than_six,
        0,                         // procesada = 0 (Bloque 2 la flipea)
        null,                      // fecha_contactada = NULL
      ]
      return { sql: UPSERT_SQL, args }
    })

    try {
      await client.batch(statements, 'write')
      result.inserted += chunk.length
    } catch (e) {
      // Fallback: una a una para identificar la fila culpable
      for (const stmt of statements) {
        try {
          await client.execute(stmt)
          result.inserted++
        } catch (rowErr) {
          result.failed++
          if (result.failedExamples.length < 5) {
            result.failedExamples.push({
              doc: String(stmt.args[0]),
              err: rowErr instanceof Error ? rowErr.message : String(rowErr),
            })
          }
        }
      }
    }
  }
  return result
}
