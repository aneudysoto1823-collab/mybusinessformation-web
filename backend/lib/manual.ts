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

function renderChapter(slug: string, body: string): { html: string; sections: ManualSection[] } {
  const md = expandMacros(body)

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
