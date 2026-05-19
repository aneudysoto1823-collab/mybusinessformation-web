// Cross-links: relaciones declarativas entre artículos y páginas principales del producto.
//
// Cada artículo puede tener un campo `related` en su frontmatter (slugs de
// otros artículos). Este módulo expone helpers para resolver esas relaciones
// + para sugerir páginas del producto relacionadas (servicios, paquetes, FAQ).
//
// Tipos de cross-link:
//   1. Article ↔ Article — vía frontmatter `related: [slug, slug, ...]`
//   2. Article → Page del producto — declarativo via CATEGORY_TO_PAGES
//      (ej. artículos de category "ein" linkean a /servicios?tab=ein)

import type { ArticleMeta, Section, Lang } from './content'
import { getArticleMeta } from './content'

// Páginas principales del producto agrupadas por categoría temática.
// Cuando un artículo tiene `category` que match, sugerimos estas páginas
// como cross-links en el sidebar/footer del artículo.
const CATEGORY_TO_PAGES: Record<string, { url: string; labelEn: string; labelEs: string }[]> = {
  formacion: [
    { url: '/#pricing', labelEn: 'See packages', labelEs: 'Ver paquetes' },
    { url: '/servicios', labelEn: 'All services', labelEs: 'Todos los servicios' },
  ],
  ein: [
    { url: '/new-business', labelEn: 'Get an EIN', labelEs: 'Obtener un EIN' },
    { url: '/servicios', labelEn: 'All services', labelEs: 'Todos los servicios' },
  ],
  sunbiz: [
    { url: '/#pricing', labelEn: 'Form your LLC', labelEs: 'Formar tu LLC' },
  ],
  compliance: [
    { url: '/new-business', labelEn: 'Compliance services', labelEs: 'Servicios de cumplimiento' },
  ],
  general: [
    { url: '/#pricing', labelEn: 'See packages', labelEs: 'Ver paquetes' },
    { url: '/about', labelEn: 'About us', labelEs: 'Sobre nosotros' },
  ],
}

export interface RelatedArticleLink {
  slug: string
  title: string
  url: string
}

export interface RelatedPageLink {
  url: string
  label: string
}

// Resuelve los slugs en `related` a links navegables (con título legible).
// Devuelve solo los que existen en disco — los inválidos se descartan en silencio.
export function resolveRelatedArticles(
  section: Section,
  lang: Lang,
  relatedSlugs: string[] | undefined
): RelatedArticleLink[] {
  if (!relatedSlugs?.length) return []
  const links: RelatedArticleLink[] = []
  for (const slug of relatedSlugs) {
    const meta = getArticleMeta(section, lang, slug)
    if (meta) {
      links.push({
        slug: meta.slug,
        title: meta.title,
        url: articleUrl(section, lang, meta.slug),
      })
    }
  }
  return links
}

// Sugiere páginas del producto basadas en la categoría del artículo.
export function suggestProductPages(
  article: Pick<ArticleMeta, 'category' | 'lang'>
): RelatedPageLink[] {
  const cat = article.category || 'general'
  const pages = CATEGORY_TO_PAGES[cat] ?? CATEGORY_TO_PAGES.general
  return pages.map((p) => ({
    url: p.url,
    label: article.lang === 'es' ? p.labelEs : p.labelEn,
  }))
}

// Construye la URL pública de un artículo según sección + idioma.
// EN es default (sin prefix de idioma), ES vive bajo /es.
export function articleUrl(section: Section, lang: Lang, slug: string): string {
  if (lang === 'en') return `/${section}/${slug}`
  return `/${section}/es/${slug}`
}

// URL del hub de la sección.
export function sectionHubUrl(section: Section, lang: Lang): string {
  if (lang === 'en') return `/${section}`
  return `/${section}/es`
}
