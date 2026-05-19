import type { Metadata } from 'next'
import { ArticleView } from '@/components/content/ArticleView'
import { getAllSlugs, getArticleMeta } from '@/lib/content'

export function generateStaticParams() {
  return getAllSlugs('guias', 'es').map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = getArticleMeta('guias', 'es', slug)
  if (!meta) return { title: 'Not found' }
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/guias/es/${slug}`,
      languages: {
        'en-US': `/guias/${slug}`,
        'es-US': `/guias/es/${slug}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      publishedTime: meta.date,
      modifiedTime: meta.lastUpdated || meta.date,
      locale: 'es_US',
    },
  }
}

export default async function GuiaArticlePageEs({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ArticleView section="guias" lang="es" slug={slug} />
}
