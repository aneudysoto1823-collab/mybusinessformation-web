import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Florida Business Compliance Services — EIN, Labor Law Poster & Certificate of Status',
  description: 'Get your Florida business fully compliant. EIN / Tax ID, 2026 Labor Law Poster, and Certificate of Status. Fast, bilingual (EN/ES) document preparation service.',
  alternates: {
    canonical: 'https://opabiz.com/new-business',
    languages: {
      'en-US': 'https://opabiz.com/new-business',
      'es-US': 'https://opabiz.com/new-business/es',
    },
  },
  openGraph: {
    url: 'https://opabiz.com/new-business',
    title: 'Florida Business Compliance — EIN, Labor Law Poster & Certificate of Status',
    description: 'Get your Florida business fully compliant. EIN / Tax ID, 2026 Labor Law Poster, and Certificate of Status. Bilingual EN/ES.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Florida Business Compliance Services',
  provider: {
    '@type': 'Organization',
    name: 'Florida Business Formation Center',
    url: 'https://opabiz.com',
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

export default function NewBusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
