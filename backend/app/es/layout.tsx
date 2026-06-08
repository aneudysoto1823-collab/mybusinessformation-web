import type { Metadata } from 'next'

const BASE_URL = 'https://opabiz.com'

export const metadata: Metadata = {
  title: 'Formación de LLC y Corporación en Florida — Online, Bilingüe',
  description: 'Crea tu LLC o Corporación en Florida en minutos. Servicio bilingüe EN/ES. Paquetes desde $0 + tarifa estatal. EIN, Acuerdo Operativo, BOI Filing incluidos.',
  alternates: {
    canonical: `${BASE_URL}/es`,
    languages: {
      'en-US': BASE_URL,
      'es-US': `${BASE_URL}/es`,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'MyBusinessFormation',
    locale: 'es_US',
    alternateLocale: ['en_US'],
    url: `${BASE_URL}/es`,
    title: 'Formación de LLC y Corporación en Florida — Online, Bilingüe',
    description: 'Crea tu LLC o Corporación en Florida en minutos. Servicio bilingüe EN/ES. Paquetes desde $0 + tarifa estatal.',
  },
}

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return children
}
