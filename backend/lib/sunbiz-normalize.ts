// Espejo EXACTO de scripts/normalize-names.py (Python text2num).
// Comprobado contra los 9 pares oficiales del mandato — coincide al 100%.
//
// Libreria de numeros: `compromise` (npm). Es la unica que iguala text2num
// de Python (preserva ordinales como "1st", "2nd", "21st" y NO convierte
// "a" a 1). Verificado lado a lado antes de elegirla.
//
// USO:
//   normalizeName(raw)      -> clave dura para comparar con sunbiz_corps.name_normalized
//   ftsSanitize(raw)        -> string FTS5-safe (solo [A-Z0-9 ]) para MATCH

import nlp from 'compromise'

// Designators sorted by token count DESC (longest match first).
// Mismo set que el Python script.
const DESIGNATORS: string[] = [
  'LIMITED LIABILITY COMPANY',
  'INCORPORATED', 'CORPORATION', 'COMPANY', 'LIMITED',
  'PLLC', 'LLLP', 'LLC', 'INC', 'CORP', 'LTD', 'LLP',
  'CO', 'LC', 'LP', 'PA',
]
const DESIGNATOR_TOKENS: string[][] = DESIGNATORS
  .map(d => d.split(' '))
  .sort((a, b) => b.length - a.length)

const ARTICLES = new Set(['THE', 'A', 'AN'])

// Comillas a strip (paso 2): doble, simple/apostrofe, backtick, tipograficas
const QUOTE_RX = /["'`‘’“”´ʼ]/g

const RX_NON_ALNUM_SPACE = /[^A-Z0-9 ]+/g
const RX_COLLAPSE_SPACES = /\s+/g

/**
 * Normaliza un nombre de empresa segun las reglas oficiales (mismo orden
 * que el Python script que pobló sunbiz_corps.name_normalized).
 */
export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return ''
  let s = String(raw)
  // 1. uppercase
  s = s.toUpperCase()
  // 2. strip quotes
  s = s.replace(QUOTE_RX, '')
  // 3. & -> ' AND '
  s = s.replace(/&/g, ' AND ')
  // 4. puntos: eliminar SIN espacio (L.L.C. -> LLC). Resto no-alnum -> espacio.
  s = s.replace(/\./g, '')
  s = s.replace(RX_NON_ALNUM_SPACE, ' ')
  // 5. collapse + trim
  s = s.replace(RX_COLLAPSE_SPACES, ' ').trim()
  if (!s) return ''
  // 6. compromise: convertir numeros escritos/ordinales (toma lowercase mejor)
  try {
    const doc = nlp(s.toLowerCase())
    doc.numbers().toNumber()
    const converted = doc.out('text')
    s = converted.toUpperCase()
  } catch {
    // si falla, queda como estaba
  }
  s = s.replace(RX_COLLAPSE_SPACES, ' ').trim()
  // 7. strip designator final (longest match first, solo si es token completo al final)
  let tokens = s ? s.split(' ') : []
  for (const dTokens of DESIGNATOR_TOKENS) {
    const n = dTokens.length
    if (tokens.length > n) {
      const tail = tokens.slice(-n)
      let match = true
      for (let i = 0; i < n; i++) if (tail[i] !== dTokens[i]) { match = false; break }
      if (match) { tokens = tokens.slice(0, -n); break }
    }
  }
  // 8. strip articulo inicial (token completo)
  if (tokens.length > 1 && ARTICLES.has(tokens[0])) tokens = tokens.slice(1)
  // 9. collapse + trim final
  return tokens.join(' ').trim()
}

/**
 * Sanitiza para usar en FTS5 MATCH. Solo [A-Z0-9 ], trim.
 * No interpreta tokens FTS5 (AND, OR, NEAR, *, ", etc.) — los strip.
 */
export function ftsSanitize(raw: string | null | undefined): string {
  if (!raw) return ''
  const s = String(raw).toUpperCase().replace(RX_NON_ALNUM_SPACE, ' ')
  return s.replace(RX_COLLAPSE_SPACES, ' ').trim()
}
