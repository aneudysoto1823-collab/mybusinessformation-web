// GET /api/campaigns/template-preview?key=<plantilla>&lang=en|es
//
// Vista previa de solo lectura para la galería /admin/plantillas. Arma cada
// plantilla con el MISMO código que usa el envío real (buildComplianceEmail,
// buildVipReminderEmail, generateNewBusinessLetter, etc.), con una empresa de
// ejemplo — así la galería siempre muestra la versión vigente sin mantener
// copias. No envía nada ni toca la base de datos.
//
// Las vistas previas de cada campaña en /admin/campaigns siguen igual (con la
// empresa real de la fila); esto es solo el catálogo para revisar textos.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { buildComplianceEmail, type CampaignCompany } from '@/lib/campaign-email'
import { buildOpabizComplianceEmail } from '@/lib/campaign-email-opabiz'
import { buildVipReminderEmail } from '@/lib/vip-reminder-email'
import { buildGuideBonusHtml } from '@/lib/guides'
import { generateNewBusinessLetter, entityLabelForLetter, formatLongDateForLetter, type Lang } from '@/lib/new-business-letter'
import { generateOpabizLetter } from '@/lib/new-business-letter-opabiz'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Empresa ficticia para todas las vistas previas.
const SAMPLE: CampaignCompany & { address: string; zip: string } = {
  id: 'ejemplo',
  document_id: 'L26000123456',
  company_name: 'Sunshine Coffee LLC',
  company_type: 'LLC',
  owner_name: 'Maria Lopez',
  city: 'Miami',
  state: 'FL',
  email: 'ejemplo@example.com',
  registration_date: '2026-09-15',
  address: '123 Main St',
  zip: '33101',
}

// Los links de las vistas previas van directo a la landing (no a track-scan),
// para que un clic en la galería no registre un escaneo falso.
const FBFC_LANDING = `https://mybusinessformation.com/?id=${SAMPLE.document_id}`
const opabizLanding = (lang: Lang) => `https://www.opabiz.com/oferta?id=${SAMPLE.document_id}${lang === 'es' ? '&lang=es' : ''}`

function withGuideBonus(html: string, lang: Lang, brand: 'fbfc' | 'opabiz'): string {
  return html.replace(
    '<!--GUIDE_BONUS-->',
    `<tr><td style="background:#fff;padding:0 36px 16px">${buildGuideBonusHtml(['guide1'], lang, brand)}</td></tr>`,
  )
}

const htmlResponse = (html: string) => new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = req.nextUrl.searchParams.get('key') ?? ''
  const lang: Lang = req.nextUrl.searchParams.get('lang') === 'es' ? 'es' : 'en'

  switch (key) {
    case 'email-carta-mybiz':
      return htmlResponse(withGuideBonus(buildComplianceEmail(SAMPLE, FBFC_LANDING, lang).html, lang, 'fbfc'))
    case 'email-carta-opabiz':
      return htmlResponse(withGuideBonus(buildOpabizComplianceEmail(SAMPLE, opabizLanding(lang), lang).html, lang, 'opabiz'))
    case 'email-vip':
      return htmlResponse(buildVipReminderEmail(SAMPLE, lang).html)
    case 'letter-mybiz':
    case 'letter-opabiz': {
      const generate = key === 'letter-opabiz' ? generateOpabizLetter : generateNewBusinessLetter
      try {
        const pdf = await generate({
          documentId: SAMPLE.document_id,
          companyName: SAMPLE.company_name,
          ownerName: SAMPLE.owner_name ?? '',
          address: SAMPLE.address,
          city: SAMPLE.city ?? '',
          zip: SAMPLE.zip,
          registrationDate: formatLongDateForLetter(SAMPLE.registration_date ?? '', lang),
          noticeDate: new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          entityType: entityLabelForLetter(SAMPLE.company_type, lang),
          payUrl: key === 'letter-opabiz'
            ? `opabiz.com/oferta?id=${SAMPLE.document_id}${lang === 'es' ? '&lang=es' : ''}`
            : `mybusinessformation.com/?id=${SAMPLE.document_id}`,
          lang,
        })
        return new NextResponse(Buffer.from(pdf), {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${key}-${lang}.pdf"` },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: `PDF generation failed: ${msg}` }, { status: 500 })
      }
    }
    default:
      return NextResponse.json({ error: 'Plantilla desconocida' }, { status: 400 })
  }
}
