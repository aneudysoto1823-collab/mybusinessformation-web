// Smoke test: PING a Turso desde Node local
// Uso: cd backend && node --env-file=.env.local scripts/turso-ping.mjs
// Borrar después del smoke test inicial.

import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('❌ Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en env')
  process.exit(1)
}

console.log('→ Conectando a:', url)
const client = createClient({ url, authToken })

try {
  const v = await client.execute('SELECT sqlite_version() AS version')
  console.log('✅ PING OK. SQLite version:', v.rows[0].version)

  const t = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  const names = t.rows.map(r => r.name)
  console.log(
    `📊 Tablas existentes (${names.length}):`,
    names.length ? names.join(', ') : '(ninguna — base vacía, esperando carga inicial 3.5M)',
  )

  process.exit(0)
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
}
