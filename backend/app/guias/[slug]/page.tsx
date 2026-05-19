import type { Metadata } from 'next'
import { ArticleView } from '@/components/content/ArticleView'
import { getAllSlugs, getArticleMeta } from '@/lib/content'

export function generateStaticParams() {
  return getAllSlugs('guias', 'en').map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = getArticleMeta('guias', 'en', slug)
  if (!meta) return { title: 'Not found' }
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/guias/${slug}`,
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
    },
  }
}

export default async function GuiaArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ArticleView section="guias" lang="en" slug={slug} />
}
