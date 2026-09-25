// ─────────────────────────────────────────────────────────────────────────────
// Catálogo + envío por email del "Labor Law Poster" ($120, ver CLAUDE.md
// "Sistema de Marketing Automation") — 2 pósters de pared (Federal + Florida)
// armados con el arte oficial real de cada agencia (osha.gov, eeoc.gov,
// dol.gov, e-verify.gov, agencias de Florida), no resúmenes propios. Fuente
// HTML en LABOR_LAW_POSTER/*.html (repo root, fuera de backend/) — los PDF
// finales (impresos con Chrome headless --print-to-pdf, mismo enfoque que
// GUIAS_PDF/generate-pdf.py) viven como asset estático versionado en
// backend/public/labor-law-poster/, mismo patrón que las Guías (lib/guides.ts)
// — no Supabase Storage, no se regeneran en cada request.
// ─────────────────────────────────────────────────────────────────────────────

export type PosterKey = 'federal' | 'florida'
export type PosterBrand = 'opabiz' | 'fbfc'
export type PosterLang = 'en' | 'es'

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'
const BASE_URL_FBFC = 'https://mybusinessformation.com'

// Umbral de tamaño para decidir si un PDF se adjunta al email o se manda
// solo como link — el póster Federal (~7MB) entra cómodo, el de Florida
// (~23MB, 7 avisos de alta resolución) supera con margen el límite práctico
// de la mayoría de los proveedores de correo (Gmail rechaza sobre ~25MB, y
// eso es ANTES de la expansión ~33% de codificar el adjunto en base64) —
// adjuntarlo igual arriesgaría que el email rebote en silencio. Se aplica
// por archivo, no por marca/idioma, así que a medida que se agreguen las
// variantes ES el mismo criterio decide caso por caso sin tocar código.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB

export interface PosterVariant {
  key: PosterKey
  brand: PosterBrand
  lang: PosterLang
  filename: string
  available: boolean // false = todavía no se generó ese PDF (ej. ES pendiente)
}

// Nombre de archivo → convención: labor-law-poster-<federal|florida>[-fbfc][-es].pdf
function buildFilename(key: PosterKey, brand: PosterBrand, lang: PosterLang): string {
  let name = `labor-law-poster-${key}`
  if (brand === 'fbfc') name += '-fbfc'
  if (lang === 'es') name += '-es'
  return `${name}.pdf`
}

// Las 8 combinaciones (2 pósters × 2 marcas × 2 idiomas) ya están generadas
// (2026-09-25). El español reutiliza el arte oficial en español real de cada
// agencia donde existe (9 de 11 documentos que faltaban se consiguieron esa
// sesión — ver LABOR_LAW_POSTER/README.md); el aviso de Trabajo Infantil de
// Florida no tiene edición oficial en español (solo existe un folleto
// distinto, no el mismo póster) y queda en inglés dentro del póster ES, con
// nota. El OSHA en español es una edición más nueva de la agencia (Pub.
// 3167) que la usada en inglés (Pub. 3165) — mismo contenido, diseño
// distinto; el layout del póster Federal ES se retocó para esa proporción.
const AVAILABLE_FILES = new Set<string>([
  'labor-law-poster-federal.pdf',
  'labor-law-poster-florida.pdf',
  'labor-law-poster-federal-fbfc.pdf',
  'labor-law-poster-florida-fbfc.pdf',
  'labor-law-poster-federal-es.pdf',
  'labor-law-poster-florida-es.pdf',
  'labor-law-poster-federal-fbfc-es.pdf',
  'labor-law-poster-florida-fbfc-es.pdf',
])

export const POSTER_TITLES: Record<PosterKey, { en: string; es: string }> = {
  federal: { en: 'Federal Labor Law Poster', es: 'Póster Federal de Leyes Laborales' },
  florida: { en: 'Florida Labor Law Poster', es: 'Póster de Florida de Leyes Laborales' },
}

export function getPosterUrl(key: PosterKey, brand: PosterBrand = 'opabiz', lang: PosterLang = 'en'): string {
  const base = brand === 'fbfc' ? BASE_URL_FBFC : BASE_URL
  return `${base}/labor-law-poster/${buildFilename(key, brand, lang)}`
}

// Catálogo completo (8 combinaciones) con su estado de disponibilidad — el
// panel admin lo usa para listar todo de una, mostrando "Próximamente" en
// las variantes ES hasta que existan.
export function listPosterVariants(): PosterVariant[] {
  const keys: PosterKey[] = ['federal', 'florida']
  const brands: PosterBrand[] = ['opabiz', 'fbfc']
  const langs: PosterLang[] = ['en', 'es']
  const out: PosterVariant[] = []
  for (const brand of brands) {
    for (const lang of langs) {
      for (const key of keys) {
        const filename = buildFilename(key, brand, lang)
        out.push({ key, brand, lang, filename, available: AVAILABLE_FILES.has(filename) })
      }
    }
  }
  return out
}

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`[labor-law-poster] no se pudo descargar ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export interface PosterEmailAttachment {
  key: PosterKey
  filename: string
  url: string
  content: Buffer | null // null = se pasó el umbral de tamaño, va solo como link
  sizeBytes: number
}

// Descarga ambos PDFs (Federal + Florida) de la marca/idioma pedidos y decide,
// por archivo, si van adjuntos o solo como link — ver MAX_ATTACHMENT_BYTES.
export async function getPosterSetForEmail(brand: PosterBrand, lang: PosterLang): Promise<PosterEmailAttachment[]> {
  const keys: PosterKey[] = ['federal', 'florida']
  const out: PosterEmailAttachment[] = []
  for (const key of keys) {
    const url = getPosterUrl(key, brand, lang)
    const filename = buildFilename(key, brand, lang)
    const content = await fetchPdfBuffer(url)
    out.push({
      key,
      filename,
      url,
      content: content.byteLength <= MAX_ATTACHMENT_BYTES ? content : null,
      sizeBytes: content.byteLength,
    })
  }
  return out
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

// Bloque HTML del email de envío — mismo tono/estructura que
// buildGuideBonusHtml() en lib/guides.ts (adjunto + link de respaldo), con la
// diferencia de que un póster grande puede no venir adjunto — la línea de
// texto lo aclara en vez de dejarlo sin explicación.
export function buildPosterEmailHtml(items: PosterEmailAttachment[], lang: PosterLang, brand: PosterBrand): string {
  const isEs = lang === 'es'
  const brandName = brand === 'fbfc' ? 'Florida Business Formation Center' : 'OpaBiz'
  const heading = isEs ? 'Su Labor Law Poster' : 'Your Labor Law Poster'
  const intro = isEs
    ? 'Le compartimos el póster de cumplimiento laboral solicitado. Cada uno reproduce el arte oficial de la agencia correspondiente, sin alterar.'
    : 'Here is the workplace compliance poster you requested. Each side reproduces the official agency artwork, unaltered.'
  const rows = items
    .map(it => {
      const title = isEs ? POSTER_TITLES[it.key].es : POSTER_TITLES[it.key].en
      const attachedNote = it.content
        ? (isEs ? 'Adjunto a este correo.' : 'Attached to this email.')
        : (isEs
          ? `Por su tamaño (${formatMB(it.sizeBytes)} MB), este archivo se envía solo como link de descarga, no adjunto.`
          : `Because of its size (${formatMB(it.sizeBytes)} MB), this file is sent as a download link only, not attached.`)
      return `
        <div style="margin:0 0 14px 0;">
          <a href="${it.url}" style="color:#2563EB;text-decoration:none;font-weight:600;">${title}</a>
          <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.55;">${attachedNote}</p>
        </div>`
    })
    .join('')
  return `
    <p style="margin:0 0 16px 0;color:#334155;font-size:14px;line-height:1.6;">${intro}</p>
    <div style="margin:0 0 20px 0;padding:16px 20px;background:#f0f4f8;border-radius:8px;">
      <p style="margin:0 0 12px 0;font-weight:700;color:#1C2E44;">${heading}</p>
      ${rows}
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;">${brandName}</p>`
}
