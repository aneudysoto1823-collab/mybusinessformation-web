// POST /api/admin/manual/send — botón "Enviar por email" de /admin/manual.
//
// Manda el manual completo como un archivo HTML adjunto (se abre en cualquier
// navegador, con formato y links, y desde ahí se puede imprimir o guardar como
// PDF) más un link a la versión en línea. Los capítulos se leen en el momento
// desde content/manual (incluidos en esta función vía outputFileTracingIncludes
// en next.config.ts), así que el adjunto siempre lleva la versión vigente.
import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend-client'
import { verifyAdminToken } from '@/lib/session'
import { getManualChapters, buildManualStandaloneHtml } from '@/lib/manual'
import { FROM_OPABIZ, REPLY_TO, brandHeaderHtml } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')
  if (!session?.value || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const nota = String(body.nota || '').trim().slice(0, 1000)
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const chapters = getManualChapters()
  if (chapters.length === 0) {
    return NextResponse.json({ error: 'No se encontraron los capítulos del manual' }, { status: 500 })
  }

  const now = new Date()
  const ymd = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const html = buildManualStandaloneHtml(chapters, now)
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  try {
    await getResend().emails.send({
      from: FROM_OPABIZ,
      replyTo: REPLY_TO,
      to: email,
      subject: 'OpaBiz: Manual del negocio',
      attachments: [{ filename: `Manual-OpaBiz-${ymd}.html`, content: Buffer.from(html, 'utf-8') }],
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${brandHeaderHtml('opabiz')}</tr></table>
            </div>
            <div style="padding:28px 32px;font-size:14px;line-height:1.65">
              <p style="margin:0 0 12px">Te compartimos el <strong>Manual de OpaBiz</strong>: cómo funciona el negocio, explicado de forma sencilla.</p>
              ${nota ? `<p style="margin:0 0 12px;background:#f8fafc;border-left:3px solid #2563EB;padding:10px 14px">${escapeHtml(nota).replace(/\n/g, '<br/>')}</p>` : ''}
              <p style="margin:0 0 12px">Va adjunto como archivo: ábrelo con cualquier navegador. Tiene el índice y los links funcionando, y desde ahí también lo puedes imprimir o guardar como PDF.</p>
              <p style="margin:0 0 20px">Siempre está la versión más actualizada en el panel de administración:</p>
              <div style="text-align:center;margin:0 0 8px">
                <a href="https://www.opabiz.com/admin/manual" style="display:inline-block;background:#fff;color:#2563EB;border:1.5px solid #2563EB;text-decoration:none;padding:11px 24px;border-radius:8px;font-weight:700">Abrir el manual en línea</a>
              </div>
              <p style="margin:18px 0 0;color:#94a3b8;font-size:12px">El link en línea pide el login del panel de administración. Este manual es de uso interno: no lo compartas con clientes.</p>
            </div>
          </div>
        </div>`,
    })
  } catch (err) {
    console.error('[admin/manual/send] error:', err)
    return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
