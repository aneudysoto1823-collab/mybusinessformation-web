import type { Metadata } from 'next'
import { headers } from 'next/headers'

const OPABIZ_URL = 'https://opabiz.com/new-business'
const FBFC_URL = 'https://mybusinessformation.com'

// Host-aware (2026-08-25) -- mismo fix que new-business/layout.tsx: esta
// pagina sirve tanto opabiz.com/new-business/es como mybusinessformation.com/es
// (rewrite), pero el canonical estaba hardcodeado siempre a
// mybusinessformation.com/es.
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') || ''
  const isFBFC = host.includes('mybusinessformation.com')
  const baseUrl = isFBFC ? FBFC_URL : OPABIZ_URL
  const esUrl = isFBFC ? `${FBFC_URL}/es` : `${OPABIZ_URL}/es`

  return {
    title: 'Servicios de Cumplimiento Empresarial en Florida — EIN, Póster Laboral y Certificado de Estatus',
    description: 'Mantén tu negocio en Florida al día con la ley. EIN / Tax ID, Póster de Leyes Laborales 2026 y Certificado de Estatus. Servicio rápido y bilingüe.',
    alternates: {
      canonical: esUrl,
      languages: {
        'en-US': baseUrl,
        'es-US': esUrl,
      },
    },
    openGraph: {
      url: esUrl,
      title: 'Servicios de Cumplimiento Empresarial en Florida — EIN, Póster Laboral y Certificado',
      description: 'EIN / Tax ID, Póster de Leyes Laborales 2026 y Certificado de Estatus para negocios en Florida. Servicio bilingüe.',
    },
  }
}

export default function NewBusinessEsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
