// GET /api/admin/turso-ping
//
// Smoke test de la conexión a Turso. Solo accesible para admin autenticado.
// Devuelve la versión de SQLite + lista de tablas existentes para confirmar
// que la conexión funciona desde Vercel.
//
// Borrar este endpoint después del smoke test inicial — o dejarlo si querés
// un health check accesible desde el panel admin.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getTurso } from '@/lib/turso'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session?.value || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const turso = getTurso()

    // 1) Versión de SQLite — confirma que la conexión funciona
    const version = await turso.execute('SELECT sqlite_version() AS version')

    // 2) Lista de tablas existentes — para saber si la DB está vacía o no
    const tables = await turso.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name",
    )

    return NextResponse.json({
      ok: true,
      sqliteVersion: version.rows[0]?.version,
      tables: tables.rows.map(r => r.name),
      tableCount: tables.rows.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[turso-ping] Error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
