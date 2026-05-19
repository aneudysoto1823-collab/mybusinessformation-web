import type { Metadata } from 'next'
import { HubView } from '@/components/content/HubView'

export const metadata: Metadata = {
  title: 'Guides — Step-by-step for Florida business formation',
  description:
    'Step-by-step tutorials for every part of forming and managing a Florida LLC or Corporation.',
  alternates: {
    canonical: '/guias',
    languages: { 'en-US': '/guias', 'es-US': '/guias/es' },
  },
}

export default function GuiasHub() {
  return <HubView section="guias" lang="en" />
}
