import { getManualChapters } from '@/lib/manual'
import ManualView from './ManualView'

// Manual interno del negocio. Protegido por proxy.ts igual que todo /admin.
// Se arma en build (lee content/manual/*.md + precios reales de lib/pricing.ts
// y lib/services-pricing.ts), así que cualquier cambio de precio o de capítulo
// se refleja solo en el próximo deploy.
export const dynamic = 'force-static'
export const metadata ={ title: 'Manual | OpaBiz Admin', robots: { index: false, follow: false } }

export default function ManualPage() {
  const chapters = getManualChapters()
  return <ManualView chapters={chapters} />
}
