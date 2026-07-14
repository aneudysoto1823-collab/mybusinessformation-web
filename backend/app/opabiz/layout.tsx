import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'OpaBiz Connect',
  manifest: '/opabiz-manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'OpaBiz Connect',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/opabiz-icon-192.png',
    apple: '/opabiz-icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1C2E44',
  width: 'device-width',
  initialScale: 1,
}

export default function OpabizLayout({ children }: { children: React.ReactNode }) {
  return children
}
