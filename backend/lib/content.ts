// Helper para artículos editoriales (/wiki, /guias) — Etapa 11 SEO Contenido.
//
// Estructura esperada:
//   backend/content/{section}/{lang}/{slug}.md
//
// Cada .md tiene frontmatter YAML al principio:
//   ---
//   title: "Titulo del articulo"
//   description: "Resumen 1-2 oraciones, para SEO meta"
//   category: "formacion"           # opcional, agrupa en el hub
//   date: "2026-01-15"              # ISO YYYY-MM-DD entre comillas (string)
//   lastUpdated: "2026-05-19"       # idem
//   related:                        # opcional, slugs de otros articulos
//     - "ein-tax-id"
//     - "operating-agreement"
//   ---
//
//   # Contenido markdown del articulo

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export type Section = 'wiki' | 'guias'
export type Lang = 'en' | 'es'

export interface ArticleFrontmatter {
  title: string
  description: string
  category?: string
  date: string
  lastUpdated?: string
  related?: string[]
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  section: Section
  lang: Lang
}

export interface Article extends ArticleMeta {
  html: string // HTML rendereado del body markdown
}

// Raíz absoluta del directorio de contenido. Se resuelve desde process.cwd()
// porque Next.js corre desde backend/ en build y dev.
function contentRoot(): string {
  return path.join(process.cwd(), 'content')
}

function sectionDir(section: Section, lang: Lang): string {
  return path.join(contentRoot(), section, lang)
}

// Lista todos los slugs disponibles en una sección/idioma.
// Usado por generateStaticParams() de las rutas dinámicas.
export function getAllSlugs(section: Section, lang: Lang): string[] {
  const dir = sectionDir(section, lang)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => f.replace(/\.md$/, ''))
}

// Lee solo el frontmatter de un artículo (rápido, no renderiza HTML).
// Útil para listas en el hub.
export function getArticleMeta(section: Section, lang: Lang, slug: string): ArticleMeta | null {
  const filePath = path.join(sectionDir(section, lang), `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(raw)
  const frontmatter = data as ArticleFrontmatter
  if (!frontmatter.title || !frontmatter.date) return null
  return { ...frontmatter, slug, section, lang }
}

// Lee artículo completo: frontmatter + body convertido a HTML.
// GitHub Flavored Markdown habilitado (tablas, task lists, strikethrough).
export async function getArticle(section: Section, lang: Lang, slug: string): Promise<Article | null> {
  const filePath = path.join(sectionDir(section, lang), `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = data as ArticleFrontmatter
  if (!frontmatter.title || !frontmatter.date) return null

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content)

  return {
    ...frontmatter,
    slug,
    section,
    lang,
    html: String(processed),
  }
}

// Lista todos los artículos de una sección/idioma con su metadata.
// Ordenado por lastUpdated desc (más recientes primero), fallback a date.
export function listArticles(section: Section, lang: Lang): ArticleMeta[] {
  const slugs = getAllSlugs(section, lang)
  const articles: ArticleMeta[] = []
  for (const slug of slugs) {
    const meta = getArticleMeta(section, lang, slug)
    if (meta) articles.push(meta)
  }
  return articles.sort((a, b) => {
    const aDate = a.lastUpdated || a.date
    const bDate = b.lastUpdated || b.date
    return bDate.localeCompare(aDate)
  })
}

// Agrupa artículos por categoría. Si un artículo no tiene category, va a "general".
export function groupByCategory(articles: ArticleMeta[]): Record<string, ArticleMeta[]> {
  const groups: Record<string, ArticleMeta[]> = {}
  for (const a of articles) {
    const cat = a.category || 'general'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(a)
  }
  return groups
}
