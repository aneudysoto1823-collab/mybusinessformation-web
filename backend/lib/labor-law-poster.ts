// ─────────────────────────────────────────────────────────────────────────────
// Catálogo + envío por email del "Labor Law Poster" ($120, ver CLAUDE.md
// "Sistema de Marketing Automation") — un solo póster all-in-one de 42"×39"
// con los avisos federales + de Florida, arte oficial real de cada agencia
// (no resúmenes propios). Fuente: LABOR_LAW_POSTER/combined-{en,es}.html;
// LABOR_LAW_POSTER/build.py genera los 4 PDF (2 marcas × 2 idiomas) en
// backend/public/labor-law-poster/ — asset estático versionado, mismo patrón
// que las Guías (lib/guides.ts), no se regenera en cada request.
// ─────────────────────────────────────────────────────────────────────────────

export type PosterBrand = 'opabiz' | 'fbfc'
export type PosterLang = 'en' | 'es'

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'
const BASE_URL_FBFC = 'https://mybusinessformation.com'

// Los PDF pesan ~13-15MB: con la expansión ~33% del base64 un adjunto así
// roza el límite de Gmail/Outlook y puede rebotar en silencio, así que por
// encima de este umbral el póster va solo como link de descarga.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB

export const POSTER_TITLE: Record<PosterLang, string> = {
  en: 'Federal & Florida Labor Law Poster',
  es: 'Póster de Leyes Laborales Federales y de Florida',
}

// Convención: labor-law-poster[-fbfc][-es].pdf — debe coincidir con VARIANTS en build.py.
export function getPosterFilename(brand: PosterBrand, lang: PosterLang): string {
  return `labor-law-poster${brand === 'fbfc' ? '-fbfc' : ''}${lang === 'es' ? '-es' : ''}.pdf`
}

export function getPosterUrl(brand: PosterBrand = 'opabiz', lang: PosterLang = 'en'): string {
  const base = brand === 'fbfc' ? BASE_URL_FBFC : BASE_URL
  return `${base}/labor-law-poster/${getPosterFilename(brand, lang)}`
}

export interface PosterEmailAttachment {
  filename: string
  url: string
  content: Buffer | null // null = supera MAX_ATTACHMENT_BYTES, va solo como link
  sizeBytes: number
}

export async function getPosterForEmail(brand: PosterBrand, lang: PosterLang): Promise<PosterEmailAttachment> {
  const url = getPosterUrl(brand, lang)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`[labor-law-poster] no se pudo descargar ${url}: ${res.status}`)
  const content = Buffer.from(await res.arrayBuffer())
  return {
    filename: getPosterFilename(brand, lang),
    url,
    content: content.byteLength <= MAX_ATTACHMENT_BYTES ? content : null,
    sizeBytes: content.byteLength,
  }
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export function buildPosterEmailHtml(item: PosterEmailAttachment, lang: PosterLang, brand: PosterBrand): string {
  const isEs = lang === 'es'
  const brandName = brand === 'fbfc' ? 'Florida Business Formation Center' : 'OpaBiz'
  const intro = isEs
    ? 'Le compartimos el póster de cumplimiento laboral solicitado. Reúne en una sola pieza los avisos federales y de Florida, con el arte oficial de cada agencia, sin alterar.'
    : 'Here is the workplace compliance poster you requested. It brings the federal and Florida notices together in a single poster, using each agency’s official artwork, unaltered.'
  const printNote = isEs
    ? 'Para imprimirlo: 42" de ancho por 39" de alto, a tamaño real (100%, sin escalar) y a color.'
    : 'To print it: 42" wide by 39" tall, at actual size (100%, no scaling) and in full color.'
  const attachedNote = item.content
    ? (isEs ? 'Adjunto a este correo.' : 'Attached to this email.')
    : (isEs
      ? `Por su tamaño (${formatMB(item.sizeBytes)} MB), se envía como link de descarga en lugar de adjunto.`
      : `Because of its size (${formatMB(item.sizeBytes)} MB), it is sent as a download link instead of an attachment.`)
  return `
    <p style="margin:0 0 16px 0;color:#334155;font-size:14px;line-height:1.6;">${intro}</p>
    <div style="margin:0 0 20px 0;padding:16px 20px;background:#f0f4f8;border-radius:8px;">
      <a href="${item.url}" style="color:#2563EB;text-decoration:none;font-weight:700;">${POSTER_TITLE[lang]}</a>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.55;">${attachedNote}</p>
      <p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.55;">${printNote}</p>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;">${brandName}</p>`
}
