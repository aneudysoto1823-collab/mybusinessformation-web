import type { Metadata } from 'next'
import Script from 'next/script'

// Landing de campaña (carta física / email / QR) de OpaBiz. noindex: es el
// destino de la carta, no una página para Google; el catálogo indexado de
// OpaBiz es /servicios.
export const metadata: Metadata = {
  title: 'Business Compliance Services | OpaBiz',
  description: 'Labor Law Poster, EIN / Tax ID and Certificate of Good Standing for your new Florida business. Bilingual EN/ES document preparation service.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://opabiz.com/oferta' },
}

export default function OfertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" />
      {children}
    </>
  )
}
