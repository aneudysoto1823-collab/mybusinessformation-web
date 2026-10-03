// POST /api/admin/labor-law-poster/send — panel /admin/labor-law-poster.
//
// Manda el Labor Law Poster all-in-one de la marca/idioma pedidos a un email
// suelto que el admin escribe a mano — para clientes que compraron el
// servicio ($120), imprentas, o simple verificación. Va adjunto si entra bajo
// el umbral de tamaño (ver MAX_ATTACHMENT_BYTES en lib/labor-law-poster.ts) y
// siempre lleva su link de descarga, adjunte o no.
import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend-client'
import { verifyAdminToken } from '@/lib/session'
import { getPosterForEmail, buildPosterEmailHtml, POSTER_TITLE, type PosterBrand, type PosterLang } from '@/lib/labor-law-poster'
import { brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandDisclosureHtml, brandSubjectPrefix, type EmailBrand } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

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

    const item = await getPosterForEmail(brand, lang)
    const emailBrand = brand as EmailBrand

    await getResend().emails.send({
      from: brandFrom(emailBrand),
      replyTo: brandReplyTo(emailBrand),
      to: email,
      subject: `${brandSubjectPrefix(emailBrand)}${POSTER_TITLE[lang]}`,
      attachments: item.content ? [{ filename: item.filename, content: item.content }] : [],
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                ${brandHeaderHtml(emailBrand)}
              </tr></table>
            </div>
            <div style="padding:32px">
              ${buildPosterEmailHtml(item, lang, brand)}
              <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
                ${brandFooterLine(emailBrand)}<br/>
                ${brandDisclosureHtml(emailBrand, lang)}
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, bytes: item.sizeBytes, attached: !!item.content })
  } catch (err) {
    console.error('[labor-law-poster/send] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
