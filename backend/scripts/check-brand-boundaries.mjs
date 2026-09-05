#!/usr/bin/env node
/**
 * check-brand-boundaries.mjs — guardián de acoplamiento entre marcas (2026-09-04).
 *
 * OpaBiz (opabiz.com — formación LLC) y FBFC (mybusinessformation.com — embudo
 * del mailer de correo directo) son dos negocios distintos que hoy comparten
 * repo, DB (Supabase.Order), Vercel, Stripe y Resend. El acoplamiento vive
 * dentro del código: en un único query mal filtrado se cruzan órdenes de las
 * dos marcas, en un email mal parametrizado se manda con la marca equivocada.
 *
 * Este guardián corre en cada build (prebuild en package.json) y bloquea el
 * deploy si detecta:
 *
 *   Check A — Queries a la tabla Order sin filtro por origen y sin el marker
 *             de opt-in consciente `@brand-unified`. Los filtros aceptados son:
 *               .eq('id', ...)              — query por PK, siempre segura
 *               .eq('sourceBrand', ...)     — filtro explícito de marca
 *               .eq('package', ...)         — filtro por tipo de orden
 *               .in('package', [...])       — filtro por lista de tipos
 *               .eq('stripePaymentId', ...) — query por payment id, único global
 *
 *             Si una query legítima realmente necesita cruzar marcas (ej. el
 *             panel admin unificado, o la sync a contabilidad — decisiones
 *             tomadas a propósito), agregar un comentario `// @brand-unified`
 *             en las líneas cercanas al query. Documenta la decisión inline
 *             y desactiva el check para ese caso puntual.
 *
 *   Check B — Llamadas a funciones de envío de email al cliente (las que
 *             declaran `sourceBrand?` en su firma en lib/notifications.ts)
 *             sin pasar `sourceBrand` en el payload. Riesgo real: cliente
 *             de una marca recibe email firmado por la otra marca. Ya pasó
 *             (auditoría 2026-08-17). Función crítica hoy: sendOrderConfirmation.
 *
 * Diseño intencionalmente pragmático: no es un AST parser, es regex sobre el
 * source. Puede tener falsos positivos raros — se resuelven con `@brand-unified`
 * o con un fix real del código. Si el patrón cambia, actualizar los regex acá.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Recorre backend/{app,lib} recursivamente. Ignora .next, node_modules, dist-server
// y archivos que no sean .ts/.tsx. scripts/ NO se lintea (mismo script vive ahí).
function walk(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist-server' || e.name === 'scripts') continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full)
  }
  return out
}

const files = [
  ...walk(join(ROOT, 'app')),
  ...walk(join(ROOT, 'lib')),
]

const violations = []

// ─────────────────────────────────────────────────────────────────────────────
// Check A — Queries a Order sin filtro por origen y sin opt-in marker
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_QUERY_RE = /\.from\(['"]Order['"]\)/g
const ALLOWED_FILTERS = [
  /\.eq\(['"]id['"]/,
  /\.eq\(['"]sourceBrand['"]/,
  /\.eq\(['"]package['"]/,
  /\.in\(['"]package['"]/,
  /\.eq\(['"]stripePaymentId['"]/,
]
const MARKER = '@brand-unified'
// Operaciones que no leen filas existentes (no cruzan marcas por diseño).
const WRITE_ONLY_OPERATIONS = /\.(insert|upsert)\s*\(/

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  let m
  while ((m = ORDER_QUERY_RE.exec(src)) !== null) {
    // Línea del match (1-indexed)
    const lineNum = src.substring(0, m.index).split('\n').length
    // Ventana de contexto: 8 líneas antes (para pillar el marker aunque sea
    // multilinea o esté a distancia razonable del query builder) + 15 después
    // (para pillar filtros encadenados en un query builder).
    // Conversión de 1-indexed a 0-indexed: line 524 → slice(516, ...).
    const startLine = Math.max(0, lineNum - 9)
    const endLine = Math.min(lines.length, lineNum + 15)
    const block = lines.slice(startLine, endLine).join('\n')

    // 1) Marker de opt-in explícito → OK
    if (block.includes(MARKER)) continue

    // 2) Escrituras puras (insert/upsert) no cruzan marcas por diseño → OK
    if (WRITE_ONLY_OPERATIONS.test(block)) continue

    // 3) Al menos un filtro aceptado → OK
    if (ALLOWED_FILTERS.some((re) => re.test(block))) continue

    violations.push({
      file: relative(ROOT, file).replace(/\\/g, '/'),
      line: lineNum,
      check: 'A',
      msg: `Query a Order sin filtro por sourceBrand/package/id ni marker '${MARKER}'. Cruza órdenes de ambas marcas. Si es intencional, agregar '// ${MARKER}' cerca del query.`,
    })
  }
  ORDER_QUERY_RE.lastIndex = 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Check B — Llamadas a sendOrderConfirmation sin sourceBrand
// ─────────────────────────────────────────────────────────────────────────────
//
// sendOrderConfirmation es la única función de email al cliente hoy que declara
// sourceBrand?: string | null en su firma y usa brand-aware branding
// (brandFrom/brandReplyTo/brandHeaderHtml/etc — ver lib/email-constants.ts).
// Los demás emails del sistema o son transaccionales OpaBiz (booking, contact,
// signup) o son alertas internas al staff (no van al cliente) o son inline
// dentro de webhooks/stripe con sourceDomain leído directo de Stripe metadata.
//
// Si en el futuro otras funciones de notifications.ts agregan sourceBrand?,
// añadir su nombre a EMAIL_FUNCS abajo.

const EMAIL_FUNCS = ['sendOrderConfirmation']
// Extraer bloque desde el `(` hasta el matching `)` — pragma simple, no AST.
// Balance de paréntesis con un contador; para o cuando se cierra el '(' abierto.
function extractCallArgs(src, openIdx) {
  let depth = 0
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i]
    if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return src.substring(openIdx + 1, i)
    }
  }
  return null
}

for (const file of files) {
  // Ignora el propio archivo que define las funciones (lib/notifications.ts) —
  // ahí no hay call sites, solo declaraciones.
  if (file.endsWith('notifications.ts')) continue
  const src = readFileSync(file, 'utf8')
  for (const funcName of EMAIL_FUNCS) {
    const callRe = new RegExp(`\\b${funcName}\\s*\\(`, 'g')
    let m
    while ((m = callRe.exec(src)) !== null) {
      // Skip menciones dentro de comentarios en la misma línea (typico:
      // "// Usa sendOrderConfirmation() de lib/notifications.ts").
      const lineStart = src.lastIndexOf('\n', m.index) + 1
      const lineBefore = src.substring(lineStart, m.index)
      if (lineBefore.includes('//') || lineBefore.includes('*')) continue
      const openIdx = m.index + m[0].length - 1
      const args = extractCallArgs(src, openIdx)
      if (args === null) continue
      // Args vacíos = otro falso positivo (mención de la función sin llamarla)
      if (args.trim().length === 0) continue
      // Si el bloque de args no menciona sourceBrand — violation
      if (!/\bsourceBrand\b/.test(args)) {
        const lineNum = src.substring(0, m.index).split('\n').length
        violations.push({
          file: relative(ROOT, file).replace(/\\/g, '/'),
          line: lineNum,
          check: 'B',
          msg: `${funcName}() llamada sin pasar 'sourceBrand'. Cliente puede recibir email con branding de la marca equivocada.`,
        })
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reportar
// ─────────────────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('[check-brand-boundaries] ✅ Sin cruces indebidos entre marcas detectados.')
  process.exit(0)
}

console.error(`\n[check-brand-boundaries] ❌ ${violations.length} violación(es):\n`)
const byCheck = { A: [], B: [] }
for (const v of violations) byCheck[v.check].push(v)

if (byCheck.A.length > 0) {
  console.error(`— Check A: Queries a Order sin filtro por origen (${byCheck.A.length}):`)
  for (const v of byCheck.A) console.error(`    ${v.file}:${v.line}  ${v.msg}`)
  console.error('')
}
if (byCheck.B.length > 0) {
  console.error(`— Check B: Emails al cliente sin sourceBrand (${byCheck.B.length}):`)
  for (const v of byCheck.B) console.error(`    ${v.file}:${v.line}  ${v.msg}`)
  console.error('')
}

console.error('Para queries que legítimamente cruzan marcas (panel admin, contabilidad),')
console.error(`agregar un comentario '// @brand-unified — razón' cerca del query.`)
console.error(`Para emails, agregar "sourceBrand: order.sourceBrand" al payload.\n`)
process.exit(1)
