import type { Metadata } from 'next'
import { HubView } from '@/components/content/HubView'

export const metadata: Metadata = {
  title: 'Guías — Paso a paso para formar tu negocio en Florida',
  description:
    'Tutoriales paso a paso para cada parte de formar y manejar un negocio en Florida.',
  alternates: {
    canonical: '/guias/es',
    languages: { 'en-US': '/guias', 'es-US': '/guias/es' },
  },
}

export default function GuiasHubEs() {
  return <HubView section="guias" lang="es" />
}
