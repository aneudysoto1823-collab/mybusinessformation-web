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

import { createClient, type Client, type InValue } from '@libsql/client'
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

// IMPORTANTE: NO usar INSERT OR REPLACE (bug confirmado en libsql/Turso:
// el trigger AFTER DELETE no se dispara con REPLACE, lo que produce
// duplicados en sunbiz_fts cuando se reinsertan filas existentes).
//
// Usamos UPSERT explicito con ON CONFLICT DO UPDATE — esto dispara el
// trigger AFTER UPDATE (sunbiz_corps_au) que SI mantiene sunbiz_fts
// limpia (hace DELETE FROM sunbiz_fts + INSERT en sunbiz_fts atomico).
//
// Cols EXCLUIDAS del UPDATE (no se pisan en caso de conflict):
//  - document_number (es la PK, nunca cambia)
//  - procesada (lo setea el Bloque 2 — no queremos que el cron
//    pise procesada=1 -> 0 cuando re-procesa un record viejo)
//  - fecha_contactada (lo setea el Bloque 4 — misma razon)
const UPDATE_EXCLUDED = new Set(['document_number', 'procesada', 'fecha_contactada'])
const UPDATE_SET = COLS
  .filter(col => !UPDATE_EXCLUDED.has(col))
  .map(col => `${col} = excluded.${col}`)
  .join(', ')

// Multi-row UPSERT: 1 sola query SQL con N filas en VALUES, en lugar de N queries
// separadas. Reduce roundtrips a Turso de N a 1 por chunk. Crucial para caber en
// los 300s de Vercel Pro cuando hay 2000+ updates (cada uno con AU trigger).
function buildMultiRowUpsert(rows: number): string {
  const valuesPart = Array.from({ length: rows }, () => `(${PLACEHOLDERS})`).join(', ')
  return `INSERT INTO sunbiz_corps (${COLS.join(', ')}) VALUES ${valuesPart}
ON CONFLICT(document_number) DO UPDATE SET ${UPDATE_SET}`
}

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

  // Helper: arma los args de una fila en el orden de COLS
  const rowArgs = (r: ParsedRecord): InValue[] => {
    const officersJson = r.officers.length ? JSON.stringify(r.officers) : null
    // CRITICO: name_normalized usa la misma funcion que la busqueda
    const nameNormalized = normalizeName(r.entity_name)
    return [
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
      'florida_sftp_daily',     // data_source
      now,                      // last_updated
      nameNormalized,           // CRITICO para la busqueda
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
      0,                        // procesada = 0 (Bloque 2 la flipea)
      null,                     // fecha_contactada = NULL
    ]
  }

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE)
    const sql = buildMultiRowUpsert(chunk.length)
    const args = chunk.flatMap(rowArgs)

    try {
      // 1 sola query SQL con chunk.length filas — drasticamente mas rapido
      // que ejecutar chunk.length statements separados via client.batch().
      await client.execute({ sql, args })
      result.inserted += chunk.length
    } catch (e) {
      // Fallback: una a una para identificar la fila culpable
      const singleSql = buildMultiRowUpsert(1)
      for (const r of chunk) {
        try {
          await client.execute({ sql: singleSql, args: rowArgs(r) })
          result.inserted++
        } catch (rowErr) {
          result.failed++
          if (result.failedExamples.length < 5) {
            result.failedExamples.push({
              doc: r.document_number,
              err: rowErr instanceof Error ? rowErr.message : String(rowErr),
            })
          }
        }
      }
    }
  }
  return result
}
