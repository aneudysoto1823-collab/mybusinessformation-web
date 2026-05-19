import type { Metadata } from 'next'
import { HubView } from '@/components/content/HubView'

export const metadata: Metadata = {
  title: 'Wiki — Quick reference for Florida business formation',
  description:
    'Quick reference, glossary and definitions for forming and running a Florida LLC or Corporation.',
  alternates: {
    canonical: '/wiki',
    languages: { 'en-US': '/wiki', 'es-US': '/wiki/es' },
  },
}

export default function WikiHub() {
  return <HubView section="wiki" lang="en" />
}
