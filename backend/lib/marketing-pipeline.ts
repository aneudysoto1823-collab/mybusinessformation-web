// Funciones auxiliares del pipeline de marketing (doc 31).
// Extraidas para poder reusarlas desde /api/marketing/prepare (loop-until-N)
// sin duplicar la logica de sync/classify/enrich.

import type { Client } from '@libsql/client'
import { classifyLeadsWithHaiku, type LeadInput } from './marketing-classify'
import { pickTargetAddress } from './marketing-target-address'
import { validateAddress, GOOGLE_ADDR_COST_PER_LEAD_USD, type ValidationResult } from './google-address'

export const MAX_STALE_DAYS = 3

/** Marca como descartadas las pendientes con filing_date > MAX_STALE_DAYS. */
export async function expireOldPending(marketing: Client): Promise<number> {
  const r = await marketing.execute({
    sql: `UPDATE marketing_leads
          SET descartada = 1,
              descarte_razon = 'expirada (>' || ? || ' dias desde filing)'
          WHERE procesada = 0 AND descartada = 0
            AND filing_date IS NOT NULL
            AND filing_date < date('now', '-' || ? || ' days')`,
    args: [MAX_STALE_DAYS, MAX_STALE_DAYS],
  })
  return Number(r.rowsAffected || 0)
}

/** Trae las N mas nuevas de sunbiz_corps (Base A) e inserta en marketing_leads (Base B) con INSERT OR IGNORE.
 *  Calcula target_addr al insertar. Devuelve cuantas se insertaron efectivamente (post dedupe).
 */
export async function syncFromSunbiz(sunbiz: Client, marketing: Client, n: number): Promise<number> {
  const rows = await sunbiz.execute({
    sql: `SELECT document_number, entity_name, entity_type, status, filing_date,
                 principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
                 mail_addr1, mail_addr2, mail_city, mail_state, mail_zip, mail_country,
                 registered_agent_name, registered_agent_type,
                 registered_agent_address, registered_agent_city, registered_agent_state, registered_agent_zip,
                 officers, fei, last_tx_date
          FROM sunbiz_corps
          WHERE filing_date IS NOT NULL
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [n],
  })
  let inserted = 0
  for (const row of rows.rows) {
    const target = pickTargetAddress({
      officers_json: row.officers as string | null,
      mailing_addr1: row.mail_addr1 as string | null,
      mailing_addr2: row.mail_addr2 as string | null,
      mailing_city:  row.mail_city  as string | null,
      mailing_state: row.mail_state as string | null,
      mailing_zip:   row.mail_zip   as string | null,
      mailing_country: row.mail_country as string | null,
      agent_addr1: row.registered_agent_address as string | null,
      principal_addr1: row.principal_addr1 as string | null,
      principal_addr2: row.principal_addr2 as string | null,
      principal_city:  row.principal_city  as string | null,
      principal_state: row.principal_state as string | null,
      principal_zip:   row.principal_zip   as string | null,
      principal_country: row.principal_country as string | null,
    })
    const r = await marketing.execute({
      sql: `INSERT OR IGNORE INTO marketing_leads (
              document_number, entity_name, entity_type, status, filing_date,
              principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
              mailing_addr1, mailing_addr2, mailing_city, mailing_state, mailing_zip, mailing_country,
              agent_name, agent_type, agent_addr1, agent_city, agent_state, agent_zip,
              officers_json, fei_number, last_tx_date, procesada,
              target_addr_source, target_addr1, target_addr2, target_city, target_state, target_zip, target_country
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        String(row.document_number), String(row.entity_name),
        row.entity_type ?? null, row.status ?? null, row.filing_date ?? null,
        row.principal_addr1 ?? null, row.principal_addr2 ?? null,
        row.principal_city ?? null, row.principal_state ?? null, row.principal_zip ?? null, row.principal_country ?? null,
        row.mail_addr1 ?? null, row.mail_addr2 ?? null,
        row.mail_city ?? null, row.mail_state ?? null, row.mail_zip ?? null, row.mail_country ?? null,
        row.registered_agent_name ?? null, row.registered_agent_type ?? null,
        row.registered_agent_address ?? null, row.registered_agent_city ?? null,
        row.registered_agent_state ?? null, row.registered_agent_zip ?? null,
        row.officers ?? null, row.fei ?? null, row.last_tx_date ?? null,
        target.source, target.addr1, target.addr2, target.city, target.state, target.zip, target.country,
      ],
    })
    if (r.rowsAffected > 0) inserted += 1
    // Idempotente: si ya existia sin target, poblarlo ahora
    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET target_addr_source = ?, target_addr1 = ?, target_addr2 = ?,
                target_city = ?, target_state = ?, target_zip = ?, target_country = ?
            WHERE document_number = ? AND target_addr_source IS NULL`,
      args: [target.source, target.addr1, target.addr2, target.city, target.state, target.zip, target.country, String(row.document_number)],
    })
  }
  return inserted
}

/** Clasifica hasta N pendientes con Haiku (FIFO por filing_date DESC).
 *  Aplica settings de verticales/scores activos → descarte automatico.
 *  Devuelve {processed, discarded, dist: {A,B,C}}.
 */
export async function classifyPending(marketing: Client, n: number): Promise<{
  processed: number; discarded: number; dist: Record<string, number>
}> {
  const pendingRes = await marketing.execute({
    sql: `SELECT document_number, entity_name, entity_type,
                 principal_addr1, principal_addr2, principal_city, principal_state, principal_zip, principal_country,
                 agent_name, agent_type, officers_json, fei_number
          FROM marketing_leads
          WHERE procesada = 0
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [n],
  })
  const pending: LeadInput[] = pendingRes.rows.map(r => ({
    document_number: String(r.document_number),
    entity_name: String(r.entity_name),
    entity_type: r.entity_type as string | null,
    principal_addr1: r.principal_addr1 as string | null,
    principal_addr2: r.principal_addr2 as string | null,
    principal_city: r.principal_city as string | null,
    principal_state: r.principal_state as string | null,
    principal_zip: r.principal_zip as string | null,
    principal_country: r.principal_country as string | null,
    agent_name: r.agent_name as string | null,
    agent_type: r.agent_type as string | null,
    officers_json: r.officers_json as string | null,
    fei_number: r.fei_number as string | null,
  }))
  if (pending.length === 0) return { processed: 0, discarded: 0, dist: {} }

  const [vSettingsRes, sSettingsRes] = await Promise.all([
    marketing.execute('SELECT vertical, active FROM marketing_vertical_settings'),
    marketing.execute('SELECT score, active FROM marketing_score_settings'),
  ])
  const vAct = new Map<string, boolean>()
  vSettingsRes.rows.forEach(r => vAct.set(String(r.vertical), Number(r.active) === 1))
  const sAct = new Map<string, boolean>()
  sSettingsRes.rows.forEach(r => sAct.set(String(r.score), Number(r.active) === 1))
  const isVAct = (v: string) => vAct.has(v) ? vAct.get(v)! : true
  const isSAct = (s: string) => sAct.has(s) ? sAct.get(s)! : true

  const classifications = await classifyLeadsWithHaiku(pending)
  const dist: Record<string, number> = {}
  let discarded = 0
  for (const c of classifications) {
    const vInactive = !isVAct(c.vertical)
    const sInactive = !isSAct(c.score)
    const shouldDiscard = vInactive || sInactive
    const reason = vInactive && sInactive
      ? `vertical y score inactivos: ${c.vertical}, ${c.score}`
      : vInactive ? `vertical inactivo: ${c.vertical}`
      : sInactive ? `score inactivo: ${c.score}` : null
    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET score = ?, vertical = ?, vertical_priority = ?,
                owner_profile = ?, address_type = ?, has_good_address = ?,
                classification_notes = ?, procesada = 1, fecha_procesada = datetime('now'),
                descartada = ?, descarte_razon = ?
            WHERE document_number = ?`,
      args: [
        c.score, c.vertical, c.vertical_priority,
        c.owner_profile, c.address_type, c.has_good_address ? 1 : 0,
        c.notes, shouldDiscard ? 1 : 0, reason, c.document_number,
      ],
    })
    dist[c.score] = (dist[c.score] || 0) + 1
    if (shouldDiscard) discarded += 1
  }
  return { processed: classifications.length, discarded, dist }
}

/** Enriquece hasta N leads del score dado con Google Address Validation.
 *  Devuelve {enriched, validated, invalid, apiErrors}.
 */
export async function enrichPending(marketing: Client, score: string, n: number): Promise<{
  enriched: number; validated: number; invalid: number; apiErrors: number
}> {
  const candRes = await marketing.execute({
    sql: `SELECT document_number,
                 target_addr1, target_addr2, target_city, target_state, target_zip, target_country
          FROM marketing_leads
          WHERE score = ?
            AND descartada = 0
            AND address_validated IS NULL
            AND target_addr_source IS NOT NULL AND target_addr_source != 'none'
            AND target_addr1 IS NOT NULL AND TRIM(target_addr1) != ''
            AND target_city  IS NOT NULL AND TRIM(target_city)  != ''
            AND target_state IS NOT NULL AND TRIM(target_state) != ''
          ORDER BY filing_date DESC
          LIMIT ?`,
    args: [score, n],
  })
  let enriched = 0, validated = 0, invalid = 0, apiErrors = 0
  for (const row of candRes.rows) {
    let result: ValidationResult
    try {
      result = await validateAddress({
        addr1: row.target_addr1 as string | null,
        addr2: row.target_addr2 as string | null,
        city: row.target_city as string | null,
        state: row.target_state as string | null,
        zip: row.target_zip as string | null,
        country: row.target_country as string | null,
      })
    } catch (e) {
      result = {
        is_valid: false, address_type: 'unknown', granularity: null,
        address_complete: false, has_unconfirmed: false, has_inferred: false,
        raw: null, error: e instanceof Error ? e.message : String(e),
      }
    }
    if (result.error) apiErrors += 1
    if (result.is_valid) validated += 1; else invalid += 1
    enriched += 1
    await marketing.execute({
      sql: `UPDATE marketing_leads
            SET address_validated = ?, address_validation_json = ?, address_type = ?,
                enriched_at = datetime('now'), enrichment_cost_usd = ?
            WHERE document_number = ?`,
      args: [
        result.is_valid ? 1 : 0, JSON.stringify(result), result.address_type,
        GOOGLE_ADDR_COST_PER_LEAD_USD, String(row.document_number),
      ],
    })
  }
  return { enriched, validated, invalid, apiErrors }
}

/** Cuenta cuantos leads estan LISTOS para carta:
 *  procesada=1, descartada=0, address_validated=1, target ok, no contactados.
 *  Considera solo los scores activos.
 */
export async function countReadyLeads(marketing: Client): Promise<number> {
  const r = await marketing.execute(`
    SELECT COUNT(*) as n FROM marketing_leads
    WHERE procesada = 1 AND descartada = 0
      AND address_validated = 1
      AND target_addr_source IS NOT NULL AND target_addr_source != 'none'
      AND fecha_contactada IS NULL
      AND score IN (SELECT score FROM marketing_score_settings WHERE active = 1)
  `)
  return Number(r.rows[0]?.n ?? 0)
}

/** Lista de scores activos (para saber cuales enriquecer en el loop). */
export async function getActiveScores(marketing: Client): Promise<string[]> {
  const r = await marketing.execute("SELECT score FROM marketing_score_settings WHERE active = 1")
  return r.rows.map(row => String(row.score))
}
