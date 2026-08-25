import type { Metadata } from 'next'
import Script from 'next/script'
import { headers } from 'next/headers'

const OPABIZ_URL = 'https://opabiz.com/new-business'
const FBFC_URL = 'https://mybusinessformation.com'

// Host-aware (2026-08-25): esta pagina sirve DOS rutas reales --
// opabiz.com/new-business (flujo propio de marketing/QR) y la raiz de
// mybusinessformation.com (rewrite, separacion de dominios 2026-08-13) --
// pero canonical/OG/JSON-LD estaban hardcodeados siempre a
// mybusinessformation.com, restandole a opabiz.com/new-business cualquier
// chance de indexarse bajo su propia URL (Google veia el canonical de esa
// pagina apuntando a otro dominio). Mismo patron que app/layout.tsx.
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') || ''
  const isFBFC = host.includes('mybusinessformation.com')
  const url = isFBFC ? FBFC_URL : OPABIZ_URL

  return {
    title: 'Florida Business Compliance Services — EIN, Labor Law Poster & Certificate of Status',
    description: 'Get your Florida business fully compliant. EIN / Tax ID, 2026 Labor Law Poster, and Certificate of Status. Fast, bilingual (EN/ES) document preparation service.',
    alternates: {
      canonical: url,
      languages: {
        'en-US': url,
        'es-US': `${url}/es`,
      },
    },
    openGraph: {
      url,
      title: 'Florida Business Compliance — EIN, Labor Law Poster & Certificate of Status',
      description: 'Get your Florida business fully compliant. EIN / Tax ID, 2026 Labor Law Poster, and Certificate of Status. Bilingual EN/ES.',
    },
  }
}

function buildJsonLd(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Florida Business Compliance Services',
    provider: {
      '@type': 'Organization',
      name: 'Florida Business Formation Center',
      url,
    },
    areaServed: { '@type': 'State', name: 'Florida' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Business Compliance Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Labor Law Poster 2026',
            description: 'Mandatory federal and state labor law poster for Florida businesses. Avoid fines up to $17,650.',
          },
          price: '120.00',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'EIN / Tax ID Number',
            description: 'Employer Identification Number application for Florida businesses. Required for bank accounts, hiring employees, and filing taxes.',
          },
          price: '161.00',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Certificate of Status Florida',
            description: 'Official document from the Florida Division of Corporations confirming your business is active and in good standing.',
          },
          price: '79.00',
          priceCurrency: 'USD',
        },
      ],
    },
  }
}

export default async function NewBusinessLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host') || ''
  const isFBFC = host.includes('mybusinessformation.com')
  const jsonLd = buildJsonLd(isFBFC ? FBFC_URL : OPABIZ_URL)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" />
      {children}
    </>
  )
}
