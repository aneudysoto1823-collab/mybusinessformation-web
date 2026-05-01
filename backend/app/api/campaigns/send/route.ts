import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import QRCode from 'qrcode'
import { getSupabaseAdmin } from '@/lib/supabase'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'info@mybusinessformation.com'
const BASE_URL   = 'https://mybusinessformation.com'

// ─── Email template ────────────────────────────────────────────────────────

function buildEmail(company: {
  id: string
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  city: string | null
  state: string
}, qrDataUrl: string, trackUrl: string, lang: 'en' | 'es') {
  const isEs = lang === 'es'

  const subject = isEs
    ? `Acción Requerida — ${company.company_name} Aviso de Cumplimiento`
    : `Action Required — ${company.company_name} Compliance Notice`

  const services = [
    {
      icon: '📋',
      name:    isEs ? 'Póster de Leyes Laborales 2026' : 'Labor Law Poster 2026',
      price:   '$69.99',
      desc:    isEs ? 'Requerido por ley federal para todos los negocios en Florida.' : 'Required by federal law for all Florida businesses.',
    },
    {
      icon: '🔢',
      name:    isEs ? 'EIN / Número de Identificación Fiscal' : 'EIN / Tax ID Number',
      price:   '$99.99',
      desc:    isEs ? 'Necesario para abrir una cuenta bancaria empresarial.' : 'Required to open a business bank account.',
    },
    {
      icon: '✅',
      name:    isEs ? 'Certificado de Estado de Florida' : 'Certificate of Status (FL)',
      price:   '$49.99',
      desc:    isEs ? 'Prueba que tu empresa está activa y en cumplimiento.' : 'Proves your company is active and in good standing.',
    },
  ]

  const servicesHtml = services.map(s => `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="36" style="font-size:1.4rem;vertical-align:top;padding-top:2px">${s.icon}</td>
            <td style="vertical-align:top">
              <div style="font-weight:700;color:#1C2E44;font-size:15px;margin-bottom:3px">${s.name}</div>
              <div style="color:#64748b;font-size:13px;line-height:1.5">${s.desc}</div>
            </td>
            <td width="80" style="text-align:right;vertical-align:top;padding-top:2px">
              <span style="font-weight:800;color:#2563EB;font-size:16px;white-space:nowrap">${s.price}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Arial,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F5F9;padding:32px 0">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1C2E44 0%,#1e40af 100%);border-radius:14px 14px 0 0;padding:28px 36px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:42px;height:42px;background:#2563EB;border-radius:10px;text-align:center;vertical-align:middle">
                        <span style="color:#fff;font-weight:900;font-size:16px;font-family:Georgia,serif">FL</span>
                      </td>
                      <td style="padding-left:12px">
                        <div style="color:#fff;font-weight:700;font-size:16px;font-family:Georgia,serif">MyBusinessFormation</div>
                        <div style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.5px;text-transform:uppercase">Florida Business Formation Center</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right">
                  <span style="background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">
                    ${isEs ? '⚠ Acción Requerida' : '⚠ Action Required'}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Company notice banner -->
        <tr>
          <td style="background:#1e40af;padding:16px 36px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <div style="color:rgba(255,255,255,.7);font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">
                    ${isEs ? 'Empresa Registrada en Florida' : 'Florida Registered Company'}
                  </div>
                  <div style="color:#fff;font-size:20px;font-weight:800;font-family:Georgia,serif">${company.company_name}</div>
                  <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:3px">
                    ${company.document_id}${company.city ? ` · ${company.city}, ${company.state}` : ` · ${company.state}`}
                  </div>
                </td>
                <td align="right" width="80">
                  <span style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700">${company.company_type}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px 36px">

            <!-- Intro -->
            <p style="color:#1C2E44;font-size:16px;font-weight:700;margin:0 0 8px">
              ${isEs ? `Estimado propietario de ${company.company_name},` : `Dear ${company.company_name} owner,`}
            </p>
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px">
              ${isEs
                ? 'Revisamos los registros del estado de Florida y notamos que tu empresa puede tener requisitos de cumplimiento pendientes. Completar estos servicios mantiene tu empresa activa, en buena reputación y lista para operar.'
                : 'We reviewed Florida state records and noticed your company may have outstanding compliance requirements. Completing these services keeps your business active, in good standing, and ready to operate.'}
            </p>

            <!-- Services -->
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:28px">
              <div style="background:#1C2E44;padding:12px 20px">
                <span style="color:#fff;font-weight:700;font-size:13px;letter-spacing:.3px">
                  ${isEs ? '📋 Servicios Requeridos / Recomendados' : '📋 Required / Recommended Services'}
                </span>
              </div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${servicesHtml}
                <!-- Bundle -->
                <tr>
                  <td style="padding:14px 20px;background:#ECFDF5">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <div style="font-weight:800;color:#047857;font-size:14px;margin-bottom:2px">🎁 ${isEs ? 'Bundle Completo — Los 3 servicios' : 'Complete Bundle — All 3 services'}</div>
                          <div style="color:#065f46;font-size:12px">${isEs ? 'Ahorra $30 al obtener los 3 juntos' : 'Save $30 when you get all 3 together'}</div>
                        </td>
                        <td align="right" width="90">
                          <div style="font-weight:900;color:#047857;font-size:18px">$189.99</div>
                          <div style="color:#a7f3d0;font-size:11px;text-decoration:line-through">$219.97</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>

            <!-- QR section -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:12px;margin-bottom:28px">
              <tr>
                <td style="padding:24px;text-align:center">
                  <div style="font-weight:700;color:#1C2E44;font-size:14px;margin-bottom:6px">
                    📱 ${isEs ? 'Escanea para completar tus requisitos' : 'Scan to complete your requirements'}
                  </div>
                  <div style="color:#64748b;font-size:12px;margin-bottom:16px">
                    ${isEs ? 'Tu información ya está pre-llenada — solo selecciona y paga' : 'Your information is pre-filled — just select and pay'}
                  </div>
                  <img src="${qrDataUrl}" width="200" height="200" alt="QR Code" style="border-radius:10px;border:3px solid #E2E8F0;display:block;margin:0 auto"/>
                  <div style="margin-top:12px;font-size:11px;color:#94A3B8;word-break:break-all">${trackUrl}</div>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px">
              <tr>
                <td align="center">
                  <a href="${trackUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:15px 48px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:.2px">
                    ${isEs ? '✓ Completar Mis Requisitos' : '✓ Complete My Requirements'}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Secondary note -->
            <p style="color:#64748b;font-size:12px;line-height:1.6;text-align:center;margin:0 0 8px">
              ${isEs
                ? '¿Tienes preguntas? Contáctanos en <a href="mailto:info@mybusinessformation.com" style="color:#2563EB">info@mybusinessformation.com</a>'
                : 'Questions? Contact us at <a href="mailto:info@mybusinessformation.com" style="color:#2563EB">info@mybusinessformation.com</a>'}
            </p>

          </td>
        </tr>

        <!-- Footer / Legal -->
        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 14px 14px;padding:20px 36px">
            <p style="color:#94A3B8;font-size:11px;line-height:1.6;margin:0 0 8px;text-align:center">
              <strong>MyBusinessFormation.com</strong> · Florida Business Formation Center<br/>
              info@mybusinessformation.com · mybusinessformation.com
            </p>
            <p style="color:#CBD5E1;font-size:10px;line-height:1.6;margin:0;text-align:center">
              ${isEs
                ? 'Este mensaje es una notificación informativa sobre el estado de cumplimiento de tu empresa registrada en Florida. MyBusinessFormation es un servicio de preparación de documentos — no somos un bufete de abogados y no brindamos asesoría legal, fiscal ni financiera. Los precios mostrados son de nuestros servicios de preparación y no incluyen cargos estatales. Para dejar de recibir estos correos, contáctanos en info@mybusinessformation.com.'
                : 'This message is an informational notice regarding the compliance status of your Florida-registered company. MyBusinessFormation is a document preparation service — we are not a law firm and do not provide legal, tax, or financial advice. Prices shown are for our preparation services and do not include state fees. To unsubscribe, contact info@mybusinessformation.com.'}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { company_ids, lang = 'en' } = await req.json()

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return NextResponse.json({ error: 'company_ids array is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: companies, error: fetchErr } = await supabase
      .from('prospective_companies')
      .select('id,document_id,company_name,company_type,owner_name,city,state,email,status')
      .in('id', company_ids)

    if (fetchErr) throw fetchErr
    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies found for the given IDs' }, { status: 404 })
    }

    const results: { company_id: string; document_id: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = []

    for (const company of companies) {
      // Skip if no email
      if (!company.email) {
        results.push({ company_id: company.id, document_id: company.document_id, status: 'skipped', reason: 'no email' })
        continue
      }

      try {
        // Build track URL (QR points here, records scan then redirects)
        const trackUrl = `${BASE_URL}/api/campaigns/track-scan?doc=${encodeURIComponent(company.document_id)}&cid=${company.id}`

        // Generate QR code as data URL (embedded directly in email)
        const qrDataUrl = await QRCode.toDataURL(trackUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#1C2E44', light: '#FFFFFF' },
        })

        // Build email
        const { subject, html } = buildEmail(company, qrDataUrl, trackUrl, lang as 'en' | 'es')

        // Send via Resend
        await getResend().emails.send({
          from:    FROM_EMAIL,
          to:      company.email,
          subject,
          html,
        })

        // Save campaign record
        await supabase.from('email_campaigns').insert({
          company_id:  company.id,
          email_to:    company.email,
          qr_code_url: trackUrl,
        })

        // Update company status → email_sent
        await supabase
          .from('prospective_companies')
          .update({ status: 'email_sent' })
          .eq('id', company.id)

        results.push({ company_id: company.id, document_id: company.document_id, status: 'sent' })
      } catch (err) {
        results.push({
          company_id:  company.id,
          document_id: company.document_id,
          status:      'error',
          reason:      err instanceof Error ? err.message : String(err),
        })
      }
    }

    const sent    = results.filter(r => r.status === 'sent').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const errors  = results.filter(r => r.status === 'error').length

    return NextResponse.json({ sent, skipped, errors, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[campaigns/send]', msg)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
