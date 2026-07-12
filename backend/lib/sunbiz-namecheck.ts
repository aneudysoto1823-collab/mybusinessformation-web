// Lógica de chequeo de disponibilidad de nombre contra Turso (Sunbiz).
// Reusable desde:
//   - GET /api/sunbiz/name-check (frontend, ahora deprecado para uso visible
//     al cliente, ver decisión de negocio 2026-06-25 en backend/app/page.tsx)
//   - POST /api/orders (server-side al crear la orden, guardado en
//     Order.nameCheck JSONB, usado por el admin en email + panel)
//   - Cualquier otro lugar que necesite el mismo chequeo.
//
// Devuelve siempre un objeto con `available`. NUNCA throws — los errores
// se devuelven en `error?` para que el caller decida (orders → guardar null
// y seguir; endpoint → degradar a {ok:false}).

// Imports relativos (no '@/lib/...') a propósito: este archivo también se
// compila para el server Express (Railway, ver tsconfig.server.json), que no
// tiene configurado el alias '@/' en su build — solo paths relativos
// funcionan en ambos runtimes (Next.js y Express).
import { getTurso } from './turso'
import { normalizeName, ftsSanitize } from './sunbiz-normalize'

export type NameCheckResult = {
  /** Nombre tal cual lo dio el caller (post-trim). */
  query: string
  /** Normalizado por normalizeName() — sirve para debug y para comparar lookups. */
  normalized: string
  /** true = ningún exact match ACTIVE en sunbiz_corps; false = existe al menos uno. */
  available: boolean
  /** Cantidad de matches exactos (0 si available). */
  exactCount: number
  /** Un solo entity_name de ejemplo si hay matches exactos. */
  example?: string
  /** Cantidad aproximada de matches FTS5 parciales (info, no bloquea). */
  similarCount: number
  /** ISO timestamp del momento del chequeo. */
  checkedAt: string
  /** Si hubo error, mensaje corto. En ese caso available no es confiable. */
  error?: string
}

export const MIN_NAME_CHARS = 3

/**
 * Chequea disponibilidad de un nombre contra Turso opabiz-sunbiz-search.
 * NUNCA throws. Si la DB falla devuelve un resultado con error y available
 * conservadoramente en true (no bloqueamos al user por un fallo de infra).
 */
export async function checkNameAvailability(rawName: string | null | undefined): Promise<NameCheckResult> {
  const query = (rawName || '').trim()
  const normalized = normalizeName(query)
  const checkedAt = new Date().toISOString()

  if (query.length < MIN_NAME_CHARS || !normalized) {
    return {
      query, normalized, checkedAt,
      available: true, exactCount: 0, similarCount: 0,
      error: 'too_short',
    }
  }

  try {
    const db = getTurso()

    // Query 1 — exact match contra name_normalized + ACTIVE
    const exactRes = await db.execute({
      sql: "SELECT entity_name FROM sunbiz_corps WHERE name_normalized = ? AND status = 'A' LIMIT 5",
      args: [normalized],
    })
    const exactCount = exactRes.rows.length
    const example = exactCount > 0 ? String(exactRes.rows[0].entity_name) : undefined

    // Query 2 — similares FTS5 (info, no bloquea)
    let similarCount = 0
    const ftsQuery = ftsSanitize(query)
    if (ftsQuery) {
      const simRes = await db.execute({
        sql: 'SELECT 1 FROM sunbiz_fts WHERE sunbiz_fts MATCH ? LIMIT 6',
        args: [ftsQuery],
      })
      similarCount = simRes.rows.length
    }

    return {
      query, normalized, checkedAt,
      available: exactCount === 0,
      exactCount, example, similarCount,
    }
  } catch (err) {
    return {
      query, normalized, checkedAt,
      available: true, exactCount: 0, similarCount: 0,
      error: err instanceof Error ? err.message.slice(0, 200) : 'unknown_error',
    }
  }
}

/**
 * Formatea una linea HTML lista-para-pegar en emails de admin
 * (orders/route.ts y webhooks/stripe handleFormationPaid).
 *
 * 3 casos:
 *   - null/undefined  → "ℹ️ chequeo no disponible — verificar manualmente"
 *   - available=false → "⚠️ NOMBRE POSIBLEMENTE TOMADO..." con example
 *   - available=true  → "✓ Nombre sin conflictos exactos detectados en Sunbiz"
 */
export function nameCheckHtmlLine(nameCheck: NameCheckResult | null | undefined): string {
  if (!nameCheck || nameCheck.error) {
    return `<div style="margin-top:16px;padding:14px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;border-left:3px solid #f59e0b">
      ℹ️ No se pudo verificar el nombre automáticamente — verificar manualmente.
    </div>`
  }
  if (nameCheck.available === false) {
    const ex = nameCheck.example ? String(nameCheck.example).replace(/</g, '&lt;') : '(sin ejemplo)'
    const sim = nameCheck.similarCount ?? 0
    return `<div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:8px;font-size:13px;color:#991b1b;border-left:3px solid #dc2626">
      ⚠️ <strong>NOMBRE POSIBLEMENTE TOMADO</strong> en Florida — coincide con: <strong>${ex}</strong> (${sim} similares en FTS5). Revisar antes de presentar.
    </div>`
  }
  return `<div style="margin-top:16px;padding:14px;background:#ecfdf5;border-radius:8px;font-size:13px;color:#065f46;border-left:3px solid #10b981">
    ✓ Nombre sin conflictos exactos detectados en Sunbiz (chequeo automático).
  </div>`
}
