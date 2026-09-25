// POST /api/admin/labor-law-poster/send — panel /admin/labor-law-poster.
//
// Manda el set (Federal + Florida) del Labor Law Poster de la marca/idioma
// pedidos a un email suelto que el admin escribe a mano — para clientes que
// compraron el servicio ($120), imprentas, o simple verificación. Cada PDF va
// adjunto si entra bajo el umbral de tamaño (ver MAX_ATTACHMENT_BYTES en
// lib/labor-law-poster.ts) y siempre lleva su link de descarga, adjunte o no
// — el póster de Florida (~23MB, 7 avisos en alta resolución) siempre queda
// como link solo, nunca adjunto.
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyAdminToken } from '@/lib/session'
import { getPosterSetForEmail, buildPosterEmailHtml, POSTER_TITLES, type PosterBrand, type PosterLang } from '@/lib/labor-law-poster'
import { brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandDisclosureHtml, brandSubjectPrefix, type EmailBrand } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const brand = (body.brand === 'fbfc' ? 'fbfc' : 'opabiz') as PosterBrand
    const lang = (body.lang === 'es' ? 'es' : 'en') as PosterLang

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const items = await getPosterSetForEmail(brand, lang)
    const emailBrand = brand as EmailBrand
    const isEs = lang === 'es'
    const subjectPrefix = brandSubjectPrefix(emailBrand)
    const titles = items.map(it => isEs ? POSTER_TITLES[it.key].es : POSTER_TITLES[it.key].en).join(' + ')

    await getResend().emails.send({
      from: brandFrom(emailBrand),
      replyTo: brandReplyTo(emailBrand),
      to: email,
      subject: `${subjectPrefix}${titles}`,
      attachments: items
        .filter(it => it.content)
        .map(it => ({ filename: it.filename, content: it.content as Buffer })),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                ${brandHeaderHtml(emailBrand)}
              </tr></table>
            </div>
            <div style="padding:32px">
              ${buildPosterEmailHtml(items, lang, brand)}
              <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
                ${brandFooterLine(emailBrand)}<br/>
                ${brandDisclosureHtml(emailBrand, lang)}
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({
      ok: true,
      sizes: Object.fromEntries(items.map(it => [it.key, { bytes: it.sizeBytes, attached: !!it.content }])),
    })
  } catch (err) {
    console.error('[labor-law-poster/send] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
