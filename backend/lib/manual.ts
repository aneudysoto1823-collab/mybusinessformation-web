// Manual interno de OpaBiz (/admin/manual) — explica el negocio en lenguaje
// llano, sin tecnicismos. Cada capítulo es un archivo en
// backend/content/manual/NN-slug.md con frontmatter:
//
//   ---
//   title: "Servicios y precios"
//   summary: "Una o dos oraciones de qué cubre el capítulo"
//   updated: "2026-10-06"
//   ---
//
// Un capítulo que todavía no está escrito se lista igual en el índice si su
// archivo tiene `pending: true` (sin cuerpo).
//
// PRECIOS EN VIVO: los capítulos nunca escriben un precio a mano. Usan
// marcadores {{...}} que se reemplazan acá con los valores reales de
// lib/pricing.ts y lib/services-pricing.ts (los mismos que usa el checkout para
// cobrar), así el manual nunca puede decir un precio distinto al que se cobra.
// Marcadores disponibles: ver PRICE_MACROS abajo.

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import {
  PACKAGE_PRICES, STATE_FEE, ADDON_PRICES, EXPEDITED_FEE, RA_FIRST_YEAR_FEE, DBA_STATE_FEE,
} from './pricing'
import { SERVICES_CATALOG, SERVICE_BUNDLES, FBFC_PRICE_OVERRIDES, BUNDLE_DISCOUNT_RATE } from './services-pricing'
import { FORMATION_ADDON_NAMES } from './order-items'
import { PACKAGE_SERVICES } from './notifications'

export interface ManualSection {
  id: string        // ancla en la página
  heading: string
  text: string      // texto plano, para el buscador
}

export interface ManualChapter {
  slug: string
  number: number
  title: string
  summary: string
  updated: string | null
  pending: boolean
  html: string
  sections: ManualSection[]
}

const money = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`

const PACKAGE_NAMES: Record<string, string> = { basic: 'Basic', standard: 'Standard', premium: 'Premium' }

const PRICE_MACROS: Record<string, () => string> = {
  // Paquetes de formación (home de opabiz.com)
  'precios:paquetes': () => {
    const rows = (Object.keys(PACKAGE_PRICES) as (keyof typeof PACKAGE_PRICES)[]).map(p => {
      const incluye = (PACKAGE_SERVICES[p] ?? []).map(i => i.es).join(', ')
      return `| ${PACKAGE_NAMES[p]} | ${money(PACKAGE_PRICES[p])} | ${incluye} |`
    })
    return ['| Paquete | Precio | Qué incluye |', '|---|---|---|', ...rows].join('\n')
  },
  'precio:estatal-llc': () => money(STATE_FEE.llc),
  'precio:estatal-corp': () => money(STATE_FEE.corp),
  'precio:acelerado': () => money(EXPEDITED_FEE),
  'precio:agente-basic': () => money(RA_FIRST_YEAR_FEE),
  'precio:dba-estatal': () => money(DBA_STATE_FEE),
  // Servicios extra que se agregan dentro del formulario de formación
  'precios:addons-formacion': () => {
    const rows = (Object.keys(ADDON_PRICES) as (keyof typeof ADDON_PRICES)[]).map(k =>
      `| ${FORMATION_ADDON_NAMES[k]?.es ?? k} | ${money(ADDON_PRICES[k])} |`)
    return ['| Servicio | Precio |', '|---|---|', ...rows].join('\n')
  },
  // Catálogo de servicios sueltos (/servicios y mybusinessformation.com)
  'precios:servicios': () => {
    const rows = Object.entries(SERVICES_CATALOG)
      .filter(([id]) => id !== 'virtual-address') // fuera de venta (sin proveedor)
      .map(([id, s]) => {
        const recurrente = s.billing === 'annual' ? ' por año' : s.billing === 'monthly' ? ' por mes' : ''
        const fbfc = FBFC_PRICE_OVERRIDES[id] !== undefined ? money(FBFC_PRICE_OVERRIDES[id]) : 'igual'
        return `| ${s.name_es} | ${money(s.serviceFee)}${recurrente} | ${s.stateFee ? money(s.stateFee) : 'no aplica'} | ${fbfc} |`
      })
    return ['| Servicio | Nuestro precio (OpaBiz) | Tarifa del estado | Precio en MyBiz |', '|---|---|---|---|', ...rows].join('\n')
  },
  'precios:combos': () => {
    const rows = Object.values(SERVICE_BUNDLES)
      .filter(b => !b.services.includes('virtual-address'))
      .map(b => `| ${b.name_es} | ${money(b.price)} |`)
    return ['| Combo | Precio (sin tarifas del estado) |', '|---|---|', ...rows].join('\n')
  },
  'precio:descuento-combo': () => `${Math.round(BUNDLE_DISCOUNT_RATE * 100)}%`,
  'precio:poster': () => money(SERVICES_CATALOG['labor-law-poster']?.serviceFee ?? 0),
}

function expandMacros(md: string): string {
  return md.replace(/\{\{\s*([a-z0-9:-]+)\s*\}\}/g, (whole, key: string) => {
    const fn = PRICE_MACROS[key]
    return fn ? fn() : `**[marcador desconocido: ${key}]**`
  })
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_|]/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Convierte en link cualquier página del sitio mencionada en el texto
// (2026-10-07, pedido founder): `/admin/citas`, **opabiz.com/booking**,
// mybusinessformation.com/afiliados, etc. Automático para que las menciones
// nuevas también queden con link sin acordarse de ponerlo. Las rutas sueltas
// (/admin/...) apuntan a opabiz.com. No toca emails (info@opabiz.com) ni
// subdominios (notices.opabiz.com), ni lo que ya está dentro de un link.
const SITE_PATHS = '(?:admin|servicios|booking|contact|afiliados|guia-gratis|oferta|opabiz|client-portal|order|terms|privacy)'
function autolinkPages(md: string): string {
  const linkHost = (text: string, host: string, path: string) =>
    `[${text}](https://${host === 'opabiz.com' ? 'www.opabiz.com' : host}${path || '/'})`
  return md
    .split(/(\[[^\]]*\]\([^)]*\))/g) // no tocar links que ya existen
    .map(part => {
      if (/^\[[^\]]*\]\([^)]*\)$/.test(part)) return part
      return part
        // dominio + ruta opcional
        .replace(/`?(?<![\w@./-])(?:www\.)?(opabiz\.com|mybusinessformation\.com)((?:\/[\w\-/?=&#.]*[\w/=])?)`?/g,
          (_m, host: string, path: string) => linkHost(`${host}${path}`, host, path))
        // ruta suelta del sitio
        .replace(new RegExp(`\`?(?<![\\w./\\]-])(\\/${SITE_PATHS}(?:\\/[\\w\\-/?=&#.]*[\\w/])?)\`?`, 'g'),
          (_m, path: string) => linkHost(path, 'opabiz.com', path))
    })
    .join('')
}

function renderChapter(slug: string, body: string): { html: string; sections: ManualSection[] } {
  const md = autolinkPages(expandMacros(body))

  // Secciones para el buscador: cortamos por títulos "## ".
  const sections: ManualSection[] = []
  const parts = md.split(/^## +/m)
  const intro = parts.shift() ?? ''
  if (intro.trim()) sections.push({ id: `cap-${slug}`, heading: '', text: stripMarkdown(intro) })
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim()
    const rest = nl === -1 ? '' : part.slice(nl + 1)
    sections.push({ id: `${slug}--${slugify(heading)}`, heading, text: stripMarkdown(rest) })
  }

  let html = remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).processSync(md).toString()
  // remark-html no pone ids en los títulos — se los agregamos para que el
  // índice y el buscador puedan saltar a cada sección.
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const plain = inner.replace(/<[^>]+>/g, '')
    return `<h2 id="${slug}--${slugify(plain)}">${inner}</h2>`
  })
  // Links al sitio: se abren en otra pestaña para no perder el lugar en el manual.
  html = html.replace(/<a href="https:\/\//g, '<a target="_blank" rel="noopener noreferrer" href="https://')
  // Tablas anchas: envolver para que scrolleen solas en el celular.
  html = html.replace(/<table>/g, '<div class="m-table"><table>').replace(/<\/table>/g, '</table></div>')
  return { html, sections }
}

export function getManualChapters(): ManualChapter[] {
  const dir = path.join(process.cwd(), 'content', 'manual')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => /^\d+-.+\.md$/.test(f))
    .sort()
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data, content } = matter(raw)
      const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '')
      const number = parseInt(file, 10)
      const pending = data.pending === true || !content.trim()
      const { html, sections } = pending ? { html: '', sections: [] } : renderChapter(slug, content)
      return {
        slug,
        number,
        title: String(data.title ?? slug),
        summary: String(data.summary ?? ''),
        // YAML convierte una fecha sin comillas en Date — normalizar a YYYY-MM-DD.
        updated: data.updated instanceof Date ? data.updated.toISOString().slice(0, 10)
          : data.updated ? String(data.updated) : null,
        pending,
        html,
        sections,
      }
    })
}

// Versión del manual en un solo archivo HTML (estilos incluidos, sin depender
// del sitio) para mandarlo por email como adjunto. Se abre en cualquier
// navegador, con el índice y los links funcionando, y desde ahí se puede
// imprimir o guardar como PDF.
export function buildManualStandaloneHtml(chapters: ManualChapter[], generatedAt: Date = new Date()): string {
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fecha = generatedAt.toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
  const written = chapters.filter(c => !c.pending)
  const toc = chapters.map(c => c.pending
    ? `<li class="p">${c.number}. ${escapeHtml(c.title)} <em>(próximamente)</em></li>`
    : `<li><a href="#cap-${c.slug}">${c.number}. ${escapeHtml(c.title)}</a><div class="s">${escapeHtml(c.summary)}</div></li>`
  ).join('')
  const body = written.map(c => `
    <section class="ch" id="cap-${c.slug}">
      <h1><span class="num">${c.number}.</span> ${escapeHtml(c.title)}</h1>
      ${c.updated ? `<div class="upd">Actualizado: ${escapeHtml(c.updated)}</div>` : ''}
      ${c.html}
      <p class="back"><a href="#indice">Volver al índice</a></p>
    </section>`).join('')
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manual de OpaBiz</title>
<style>
  body{margin:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#334155;line-height:1.65}
  .wrap{max-width:860px;margin:0 auto;padding:32px 20px 60px}
  .cover{background:#1C2E44;color:#fff;border-radius:14px;padding:32px 30px;margin-bottom:24px}
  .cover h1{margin:0;font-size:1.9rem;font-family:Georgia,serif}
  .cover p{margin:6px 0 0;color:#cbd5e1;font-size:.95rem}
  .card,.ch{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:26px 30px;margin-bottom:22px}
  #indice h2{margin:0 0 12px;color:#1C2E44}
  #indice ol{list-style:none;padding:0;margin:0}
  #indice li{padding:8px 0;border-bottom:1px solid #f1f5f9}
  #indice li a{color:#1C2E44;font-weight:700;text-decoration:none}
  #indice li.p{color:#94a3b8}
  #indice .s{font-size:.82rem;color:#64748b}
  .ch h1{font-size:1.4rem;color:#1C2E44;margin:0 0 4px;border-bottom:1px solid #f1f5f9;padding-bottom:10px}
  .ch h1 .num{color:#2563EB}
  .upd{font-size:.75rem;color:#94a3b8;margin-bottom:8px}
  h2{font-size:1.1rem;color:#1C2E44;margin:26px 0 8px}
  h3{font-size:.98rem;color:#1C2E44;margin:18px 0 6px}
  a{color:#2563EB}
  strong{color:#1C2E44}
  blockquote{margin:0 0 14px;padding:10px 16px;border-left:3px solid #2563EB;background:#f8fafc;border-radius:0 8px 8px 0}
  blockquote p{margin:0}
  .m-table{overflow-x:auto;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:.86rem}
  th{background:#f8fafc;text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#1C2E44}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  code{background:#f1f5f9;border-radius:4px;padding:1px 5px;font-size:.85em}
  .back{font-size:.8rem}
  @media print{body{background:#fff}.wrap{padding:0}.ch{page-break-before:always;border:none;padding:0}.card{border:none;padding:0}.back{display:none}}
</style></head>
<body><div class="wrap">
  <div class="cover"><h1>Manual de OpaBiz</h1><p>Cómo funciona el negocio, explicado de forma sencilla. Versión del ${escapeHtml(fecha)}.</p></div>
  <div class="card" id="indice"><h2>Índice</h2><ol>${toc}</ol></div>
  ${body}
</div></body></html>`
}
