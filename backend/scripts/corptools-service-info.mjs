// GET /services/:id/info contra la cuenta TEST.
// Solo GET. Solo keys TEST. Cero side-effects.
//
// Uso:
//   node scripts/corptools-service-info.mjs <service_id>

import dotenv from 'dotenv'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SignJWT } from 'jose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const BASE_URL = 'https://api.corporatetools.com'

const serviceId = process.argv[2]
if (!serviceId) {
  console.error('ERROR: falta service_id como argumento')
  console.error('Uso: node scripts/corptools-service-info.mjs <service_id>')
  process.exit(1)
}

const CORPTOOLS_ENV = (process.env.CORPTOOLS_ENV || '').toLowerCase()
if (CORPTOOLS_ENV !== 'test') {
  console.error(`ERROR: CORPTOOLS_ENV debe ser 'test'. Actual: "${CORPTOOLS_ENV}"`)
  process.exit(1)
}

const ACCESS_KEY = process.env.CORPTOOLS_ACCESS_KEY_TEST
const SECRET_KEY = process.env.CORPTOOLS_SECRET_KEY_TEST
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('ERROR: faltan CORPTOOLS_*_TEST en .env.local')
  process.exit(1)
}

async function signJwt(pathOnly, hashInput) {
  const content = crypto.createHash('sha256').update(hashInput).digest('hex')
  const secret = new TextEncoder().encode(SECRET_KEY)
  return await new SignJWT({ path: pathOnly, content })
    .setProtectedHeader({ alg: 'HS256', access_key: ACCESS_KEY })
    .sign(secret)
}

async function main() {
  const pathOnly = `/services/${serviceId}/info`
  const token = await signJwt(pathOnly, '')
  const url = `${BASE_URL}${pathOnly}`

  console.log(`GET ${url}\n`)
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  console.log(`Status: ${res.status}`)
  console.log('Body:', JSON.stringify(data, null, 2))
}

main().catch(err => { console.error('\nERROR:', err.message); process.exit(1) })
