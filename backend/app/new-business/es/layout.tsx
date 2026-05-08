import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servicios de Cumplimiento Empresarial en Florida — EIN, Póster Laboral y Certificado de Estatus',
  description: 'Mantén tu negocio en Florida al día con la ley. EIN / Tax ID, Póster de Leyes Laborales 2026 y Certificado de Estatus. Servicio rápido y bilingüe.',
  alternates: {
    canonical: 'https://mybusinessformation.com/new-business/es',
    languages: {
      'en-US': 'https://mybusinessformation.com/new-business',
      'es-US': 'https://mybusinessformation.com/new-business/es',
    },
  },
  openGraph: {
    url: 'https://mybusinessformation.com/new-business/es',
    title: 'Servicios de Cumplimiento Empresarial en Florida — EIN, Póster Laboral y Certificado',
    description: 'EIN / Tax ID, Póster de Leyes Laborales 2026 y Certificado de Estatus para negocios en Florida. Servicio bilingüe.',
  },
}

export default function NewBusinessEsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
