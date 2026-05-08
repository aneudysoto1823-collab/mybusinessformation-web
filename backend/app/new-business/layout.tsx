import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Compliance Services — Florida Business Formation Center',
  robots: { index: false, follow: true },
}

export default function NewBusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
