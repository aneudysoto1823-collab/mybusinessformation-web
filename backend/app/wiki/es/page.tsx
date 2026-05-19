import type { Metadata } from 'next'
import { HubView } from '@/components/content/HubView'

export const metadata: Metadata = {
  title: 'Wiki — Referencia rápida para formar tu negocio en Florida',
  description:
    'Referencia rápida, glosario y definiciones para formar y operar una LLC o Corporación en Florida.',
  alternates: {
    canonical: '/wiki/es',
    languages: { 'en-US': '/wiki', 'es-US': '/wiki/es' },
  },
}

export default function WikiHubEs() {
  return <HubView section="wiki" lang="es" />
}
