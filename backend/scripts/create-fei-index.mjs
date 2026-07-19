import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const TURSO_URL = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://')
const TOKEN = process.env.TURSO_AUTH_TOKEN

async function turso(sql, timeoutMs = 600000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql } },
          { type: 'close' },
        ],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = await res.json()
    const r = data.results?.[0]
    if (r?.type === 'error') throw new Error(r.error?.message)
    return r
  } catch (e) { clearTimeout(timeout); throw e }
}

async function main() {
  console.log('Creando indice idx_fei sobre sunbiz_corps(fei) — puede tardar 5-15 min sobre 3.99M rows…')
  const t0 = Date.now()
  try {
    await turso(`CREATE INDEX IF NOT EXISTS idx_fei ON sunbiz_corps(fei, filing_date DESC) WHERE fei IS NOT NULL AND fei != '' AND fei != 'NONE' AND fei != 'APPLIED FOR'`)
    console.log(`✅ Indice creado en ${Date.now() - t0}ms`)
  } catch (e) {
    console.error('ERROR:', e.message)
  }

  console.log('\nProbando query rapida con el nuevo indice…')
  const t1 = Date.now()
  try {
    const r = await turso(`SELECT COUNT(*) as n FROM sunbiz_corps WHERE fei IS NOT NULL AND fei != '' AND fei != 'NONE' AND fei != 'APPLIED FOR'`)
    console.log(`  Total con EIN: ${r.response.result.rows[0][0].value} (${Date.now() - t1}ms)`)
  } catch (e) {
    console.error('  ERROR:', e.message)
  }
  process.exit(0)
}

main().catch(e => { console.error('ERR', e); process.exit(1) })
