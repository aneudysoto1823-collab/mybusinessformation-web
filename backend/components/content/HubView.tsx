import Link from 'next/link'
import { listArticles, groupByCategory, type Section, type Lang } from '@/lib/content'
import { articleUrl, sectionHubUrl } from '@/lib/cross-links'

const BASE_URL = 'https://opabiz.com'

// Construye Schema.org @graph para un hub (/wiki o /guias en EN/ES).
// - CollectionPage para el hub
// - ItemList con los Article del catálogo, ordenados por categoría → fecha
// - BreadcrumbList Home → Section
// Si el hub está vacío (no hay .md publicados), igual emite CollectionPage +
// BreadcrumbList sin ItemList — sigue siendo válido.
function buildHubSchema(section: Section, lang: Lang, articles: ReturnType<typeof listArticles>) {
  const hubPath = sectionHubUrl(section, lang)
  const hubUrl = `${BASE_URL}${hubPath}`
  const sectionLabel = section === 'wiki'
    ? (lang === 'es' ? 'Wiki' : 'Wiki')
    : (lang === 'es' ? 'Guías' : 'Guides')
  const langTag = lang === 'es' ? 'es-US' : 'en-US'

  const graph: object[] = [
    {
      '@type': 'CollectionPage',
      '@id': hubUrl,
      url: hubUrl,
      name: `${sectionLabel} — OpaBiz`,
      description: section === 'wiki'
        ? (lang === 'es'
            ? 'Referencia rápida, glosario y definiciones para formar y operar un negocio en Florida.'
            : 'Quick reference, glossary and definitions for forming and running a Florida business.')
        : (lang === 'es'
            ? 'Tutoriales paso a paso para cada parte de formar y manejar un negocio en Florida.'
            : 'Step-by-step tutorials for every part of forming and managing a Florida business.'),
      inLanguage: langTag,
      isPartOf: { '@id': `${BASE_URL}/#website` },
      about: { '@id': `${BASE_URL}/#organization` },
      breadcrumb: { '@id': `${hubUrl}#breadcrumb` },
      ...(articles.length > 0 ? { mainEntity: { '@id': `${hubUrl}#itemlist` } } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${hubUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: sectionLabel, item: hubUrl },
      ],
    },
  ]

  if (articles.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${hubUrl}#itemlist`,
      name: `${sectionLabel} articles`,
      numberOfItems: articles.length,
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Article',
          '@id': `${BASE_URL}${articleUrl(section, lang, a.slug)}`,
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          ...(a.lastUpdated ? { dateModified: a.lastUpdated } : {}),
          inLanguage: langTag,
          author: { '@id': `${BASE_URL}/#organization` },
          publisher: { '@id': `${BASE_URL}/#organization` },
        },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

const COPY = {
  wiki: {
    en: {
      title: 'Wiki',
      tagline: 'Quick reference, glossary and definitions for forming and running a Florida business.',
      empty: 'Articles coming soon.',
      switchLangHref: '/wiki/es',
      switchLangLabel: 'Español',
    },
    es: {
      title: 'Wiki',
      tagline: 'Referencia rápida, glosario y definiciones para formar y operar un negocio en Florida.',
      empty: 'Artículos próximamente.',
      switchLangHref: '/wiki',
      switchLangLabel: 'English',
    },
  },
  guias: {
    en: {
      title: 'Guides',
      tagline: 'Step-by-step tutorials for every part of forming and managing a Florida business.',
      empty: 'Guides coming soon.',
      switchLangHref: '/guias/es',
      switchLangLabel: 'Español',
    },
    es: {
      title: 'Guías',
      tagline: 'Tutoriales paso a paso para cada parte de formar y manejar un negocio en Florida.',
      empty: 'Guías próximamente.',
      switchLangHref: '/guias',
      switchLangLabel: 'English',
    },
  },
} as const

export function HubView({ section, lang }: { section: Section; lang: Lang }) {
  const articles = listArticles(section, lang)
  const groups = groupByCategory(articles)
  const t = COPY[section][lang]
  const schema = buildHubSchema(section, lang, articles)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <style>{`
        .hub-wrap {
          min-height: 100vh;
          background: #f4f6f9;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }
        .hub-hero {
          background: #1C2E44;
          color: #fff;
          padding: 64px 24px 56px;
          text-align: center;
        }
        .hub-hero h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 56px;
          font-weight: 700;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .hub-hero p {
          font-size: 17px;
          line-height: 1.55;
          margin: 0 auto;
          max-width: 640px;
          color: #cbd5e1;
        }
        .hub-lang {
          margin-top: 20px;
        }
        .hub-lang a {
          color: #93c5fd;
          font-size: 13px;
          text-decoration: underline;
        }
        .hub-content {
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }
        .hub-empty {
          text-align: center;
          color: #64748b;
          font-size: 16px;
          padding: 48px 0;
        }
        .hub-category {
          margin-bottom: 40px;
        }
        .hub-category h2 {
          font-size: 22px;
          color: #1C2E44;
          margin: 0 0 16px;
          text-transform: capitalize;
          font-weight: 700;
        }
        .hub-articles {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .hub-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px 22px 20px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
          display: block;
        }
        .hub-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(28, 46, 68, 0.08);
          border-color: #2563EB;
        }
        .hub-card h3 {
          font-size: 16px;
          color: #1C2E44;
          margin: 0 0 8px;
          font-weight: 700;
          line-height: 1.35;
        }
        .hub-card p {
          font-size: 14px;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }
        .hub-card-date {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 12px;
        }
        @media (max-width: 768px) {
          .hub-hero { padding: 48px 20px 40px; }
          .hub-hero h1 { font-size: 40px; }
          .hub-hero p { font-size: 15px; }
          .hub-content { padding: 32px 16px 60px; }
        }
      `}</style>
      <div className="hub-wrap">
        <header className="hub-hero">
          <h1>{t.title}</h1>
          <p>{t.tagline}</p>
          <div className="hub-lang">
            <Link href={t.switchLangHref}>{t.switchLangLabel}</Link>
          </div>
        </header>

        <main className="hub-content">
          {articles.length === 0 ? (
            <div className="hub-empty">{t.empty}</div>
          ) : (
            Object.entries(groups).map(([category, group]) => (
              <section key={category} className="hub-category">
                <h2>{category}</h2>
                <div className="hub-articles">
                  {group.map((a) => (
                    <Link key={a.slug} href={articleUrl(section, lang, a.slug)} className="hub-card">
                      <h3>{a.title}</h3>
                      <p>{a.description}</p>
                      <div className="hub-card-date">{a.lastUpdated || a.date}</div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </>
  )
}
