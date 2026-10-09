// Galería de plantillas de marketing (2026-10-09): emails de campaña, cartas
// PDF, guías y Labor Law Poster, en un solo lugar para revisar cómo le llegan
// al cliente. Las vistas previas de emails y cartas las arma
// /api/campaigns/template-preview con el mismo código del envío real, así que
// siempre muestran la versión vigente. Las vistas previas de cada campaña en
// /admin/campaigns siguen igual.
//
// Server component solo para armar las URLs (lib/guides.ts importa Supabase y
// no puede ir al cliente); los filtros y la vista previa viven en
// TemplatesGallery.tsx.

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { GUIDE_FILES, GUIDE_TITLES, type GuideKey } from '@/lib/guides'
import { getPosterFilename, POSTER_TITLE } from '@/lib/labor-law-poster'
import TemplatesGallery, { type TemplateItem } from './TemplatesGallery'

type Brand = 'opabiz' | 'fbfc'
type Lang = 'en' | 'es'
const BRANDS: Brand[] = ['fbfc', 'opabiz']
const LANGS: Lang[] = ['en', 'es']

function buildItems(): TemplateItem[] {
  const items: TemplateItem[] = []

  // Emails de campaña
  for (const lang of LANGS) {
    const preview = (key: string) => `/api/campaigns/template-preview?key=${key}&lang=${lang}`
    items.push(
      { id: `email-carta-mybiz-${lang}`, type: 'email', brand: 'fbfc', lang, title: 'Carta Nuevas Empresas', usedIn: 'Email de campaña. Se envía desde Campaigns & Letters (plantilla MyBiz: Carta Nuevas Empresas).', url: preview('email-carta-mybiz') },
      { id: `email-vip-${lang}`, type: 'email', brand: 'fbfc', lang, title: 'Oferta VIP', usedIn: 'Email de campaña. Se envía desde Campaigns & Letters (plantilla MyBiz: Oferta VIP).', url: preview('email-vip') },
      { id: `email-carta-opabiz-${lang}`, type: 'email', brand: 'opabiz', lang, title: 'Carta Nuevas Empresas', usedIn: 'Email de campaña. Se envía desde Campaigns & Letters (plantilla OpaBiz: Carta Nuevas Empresas).', url: preview('email-carta-opabiz') },
      { id: `letter-mybiz-${lang}`, type: 'carta', brand: 'fbfc', lang, title: 'Carta física de cumplimiento', usedIn: 'PDF para imprimir y enviar por correo postal. Se genera desde Campaigns & Letters.', url: preview('letter-mybiz') },
      { id: `letter-opabiz-${lang}`, type: 'carta', brand: 'opabiz', lang, title: 'Carta física de cumplimiento', usedIn: 'PDF para imprimir y enviar por correo postal. Se genera desde Campaigns & Letters.', url: preview('letter-opabiz') },
    )
  }

  // Guías I y II (2 marcas x 2 idiomas)
  for (const g of ['guide1', 'guide2'] as GuideKey[]) {
    for (const brand of BRANDS) {
      for (const lang of LANGS) {
        items.push({
          id: `${g}-${brand}-${lang}`, type: 'guia', brand, lang,
          title: GUIDE_TITLES[g][lang],
          usedIn: g === 'guide1'
            ? 'Se regala en la carta de campaña, en /guia-gratis y en la confirmación de pago de formación.'
            : 'Se regala en la confirmación de pago de formación.',
          url: `/guias/${GUIDE_FILES[g][brand][lang]}`,
        })
      }
    }
  }
  // Guías III y IV: solo existen en español, versión OpaBiz.
  items.push(
    { id: 'guide3-opabiz-es', type: 'guia', brand: 'opabiz', lang: 'es', title: 'Guía III: Cuenta de banco', usedIn: 'En preparación, todavía no terminada. Solo en español. No se envía por email.', url: '/guias/guia-3-cuenta-banco.pdf', singleLang: true },
    { id: 'guide4-opabiz-es', type: 'guia', brand: 'opabiz', lang: 'es', title: 'Guía IV: Stripe', usedIn: 'En preparación, todavía no terminada. Solo en español. No se envía por email.', url: '/guias/guia-4-stripe.pdf', singleLang: true },
  )

  // Labor Law Poster
  for (const brand of BRANDS) {
    for (const lang of LANGS) {
      items.push({
        id: `poster-${brand}-${lang}`, type: 'poster', brand, lang,
        title: POSTER_TITLE[lang],
        usedIn: 'Póster all-in-one federal y de Florida (servicio $120), 42" de ancho por 39" de alto. Se puede enviar por email desde aquí.',
        url: `/labor-law-poster/${getPosterFilename(brand, lang)}`,
      })
    }
  }

  return items
}

export default async function PlantillasPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams
  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .wrap{max-width:1100px;margin:0 auto;padding:28px 24px}
        @media(max-width:768px){.wrap{padding:18px 14px}}
      `}</style>
      <div className="wrap">
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Plantillas</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>Plantillas</h1>
          <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>
            Emails, cartas, guías y póster tal como le llegan al cliente. Se arman con el mismo código del envío real y una empresa de ejemplo (Sunshine Coffee LLC), así que siempre muestran la versión vigente.
          </p>
        </div>
        <TemplatesGallery items={buildItems()} initialType={tipo} />
      </div>
    </>
  )
}
