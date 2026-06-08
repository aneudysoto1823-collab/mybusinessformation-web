import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticle, type Section, type Lang } from '@/lib/content'
import { resolveRelatedArticles, suggestProductPages, sectionHubUrl } from '@/lib/cross-links'

const SECTION_COPY = {
  wiki: { en: 'Wiki', es: 'Wiki' },
  guias: { en: 'Guides', es: 'Guías' },
}

const COPY = {
  en: {
    backToHub: 'Back to',
    updated: 'Updated',
    relatedArticles: 'Related articles',
    relatedPages: 'Continue with',
  },
  es: {
    backToHub: 'Volver a',
    updated: 'Actualizado',
    relatedArticles: 'Artículos relacionados',
    relatedPages: 'Continuá con',
  },
}

export async function ArticleView({
  section,
  lang,
  slug,
}: {
  section: Section
  lang: Lang
  slug: string
}) {
  const article = await getArticle(section, lang, slug)
  if (!article) notFound()

  const t = COPY[lang]
  const related = resolveRelatedArticles(section, lang, article.related)
  const productLinks = suggestProductPages(article)
  const hubUrl = sectionHubUrl(section, lang)
  const sectionName = SECTION_COPY[section][lang]

  // Schema.org Article + BreadcrumbList JSON-LD para SEO.
  // Article: dateModified + datePublished + author = empresa.
  // BreadcrumbList: Home → Section → Article.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.date,
        dateModified: article.lastUpdated || article.date,
        author: {
          '@type': 'Organization',
          name: 'OpaBiz',
          url: 'https://opabiz.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'OpaBiz',
          url: 'https://opabiz.com',
        },
        inLanguage: lang === 'es' ? 'es-US' : 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://opabiz.com/' },
          { '@type': 'ListItem', position: 2, name: sectionName, item: `https://opabiz.com${hubUrl}` },
          { '@type': 'ListItem', position: 3, name: article.title },
        ],
      },
    ],
  }

  return (
    <>
      <style>{`
        .art-wrap {
          min-height: 100vh;
          background: #f4f6f9;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }
        .art-header {
          background: #1C2E44;
          color: #fff;
          padding: 56px 24px 40px;
          text-align: center;
        }
        .art-breadcrumb {
          font-size: 13px;
          color: #93c5fd;
          margin-bottom: 16px;
        }
        .art-breadcrumb a { color: #93c5fd; text-decoration: none; }
        .art-breadcrumb a:hover { text-decoration: underline; }
        .art-header h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 42px;
          font-weight: 700;
          margin: 0 auto 14px;
          max-width: 800px;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .art-meta {
          font-size: 13px;
          color: #cbd5e1;
        }
        .art-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px 40px;
          background: #fff;
          margin-top: -20px;
          border-radius: 14px 14px 0 0;
          box-shadow: 0 -4px 20px rgba(28, 46, 68, 0.06);
          position: relative;
        }
        .art-body > div {
          color: #1e293b;
          font-size: 16.5px;
          line-height: 1.75;
        }
        .art-body h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 28px;
          color: #1C2E44;
          margin: 40px 0 16px;
          font-weight: 700;
        }
        .art-body h3 {
          font-size: 20px;
          color: #1C2E44;
          margin: 28px 0 12px;
          font-weight: 700;
        }
        .art-body p { margin: 0 0 16px; }
        .art-body a { color: #2563EB; text-decoration: underline; }
        .art-body ul, .art-body ol { margin: 0 0 16px 24px; }
        .art-body li { margin: 6px 0; }
        .art-body code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
          color: #be185d;
        }
        .art-body pre {
          background: #1e293b;
          color: #f1f5f9;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
        }
        .art-body pre code { background: transparent; color: inherit; padding: 0; }
        .art-body blockquote {
          border-left: 3px solid #2563EB;
          padding: 4px 16px;
          margin: 16px 0;
          color: #475569;
          background: #f8fafc;
        }
        .art-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .art-body th, .art-body td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
        }
        .art-body th { background: #f8fafc; font-weight: 700; }
        .art-aside {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          background: #fff;
          border-radius: 0 0 14px 14px;
          box-shadow: 0 4px 20px rgba(28, 46, 68, 0.06);
        }
        .art-aside-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        .art-aside-section:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .art-aside h3 {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 12px;
          font-weight: 700;
        }
        .art-aside ul { list-style: none; padding: 0; margin: 0; }
        .art-aside li { margin: 8px 0; }
        .art-aside a {
          color: #2563EB;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
        }
        .art-aside a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .art-header { padding: 40px 20px 30px; }
          .art-header h1 { font-size: 30px; }
          .art-body { padding: 32px 20px; margin-top: -16px; }
          .art-body > div { font-size: 16px; }
          .art-aside { padding: 24px 20px 48px; }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="art-wrap">
        <header className="art-header">
          <div className="art-breadcrumb">
            <Link href="/">Home</Link> / <Link href={hubUrl}>{sectionName}</Link>
          </div>
          <h1>{article.title}</h1>
          <div className="art-meta">
            {t.updated}: {article.lastUpdated || article.date}
          </div>
        </header>

        <article className="art-body">
          <div dangerouslySetInnerHTML={{ __html: article.html }} />
        </article>

        {(related.length > 0 || productLinks.length > 0) && (
          <aside className="art-aside">
            {related.length > 0 && (
              <div className="art-aside-section">
                <h3>{t.relatedArticles}</h3>
                <ul>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={r.url}>{r.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {productLinks.length > 0 && (
              <div className="art-aside-section">
                <h3>{t.relatedPages}</h3>
                <ul>
                  {productLinks.map((p, i) => (
                    <li key={i}>
                      <Link href={p.url}>{p.label} →</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  )
}
