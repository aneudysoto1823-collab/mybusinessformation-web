import type { Metadata } from "next";
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
      "es-US": `${BASE_URL}/?lang=es`,
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
      </head>
      <body>{children}</body>
    </html>
  );
}
