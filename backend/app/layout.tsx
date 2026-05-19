import type { Metadata } from "next";
import Script from "next/script";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const BASE_URL = "https://mybusinessformation.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MyBusinessFormation | Florida LLC & Corporation Formation",
    template: "%s | MyBusinessFormation",
  },
  description:
    "Form your Florida LLC or Corporation online in minutes. Bilingual service (EN/ES). Packages from $0 + state fee. EIN, Operating Agreement, BOI Filing included.",
  keywords: [
    "Florida LLC formation",
    "form LLC Florida",
    "Florida corporation",
    "register business Florida",
    "LLC formation service",
    "EIN number Florida",
    "formacion LLC Florida",
    "crear empresa Florida",
  ],
  authors: [{ name: "MyBusinessFormation", url: BASE_URL }],
  creator: "MyBusinessFormation",
  publisher: "MyBusinessFormation",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "MyBusinessFormation",
    locale: "en_US",
    alternateLocale: ["es_US"],
    url: BASE_URL,
    title: "MyBusinessFormation | Florida LLC & Corporation Formation",
    description:
      "Form your Florida LLC or Corporation online in minutes. Bilingual service (EN/ES). Packages from $0 + state fee.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyBusinessFormation — Florida LLC & Corporation Formation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBusinessFormation | Florida LLC & Corporation Formation",
    description:
      "Form your Florida LLC or Corporation online in minutes. Bilingual EN/ES. Packages from $0 + state fee.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
      "es-US": `${BASE_URL}/es`,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font preconnect for Core Web Vitals */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Google Consent Mode v2 — DEFAULT DENY antes de que cargue gtag.js.
            Cuando el usuario decida en el banner, dispatch update via lib/consent.ts.
            Hasta entonces ningún tracker recibe nada (compliance CCPA/GDPR). */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
          `}
        </Script>
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
