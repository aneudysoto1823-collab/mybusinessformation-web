import type { Metadata } from 'next'
import { ArticleView } from '@/components/content/ArticleView'
import { getAllSlugs, getArticleMeta } from '@/lib/content'

export function generateStaticParams() {
  return getAllSlugs('wiki', 'en').map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = getArticleMeta('wiki', 'en', slug)
  if (!meta) return { title: 'Not found' }
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/wiki/${slug}`,
      languages: {
        'en-US': `/wiki/${slug}`,
        'es-US': `/wiki/es/${slug}`,
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

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ArticleView section="wiki" lang="en" slug={slug} />
}
